import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveAllowedBrowserOrigin } from "../../../supabase/functions/_shared/browser-origin.ts";
import { isAllowedOrigin } from "../../../supabase/functions/_shared/origin-check.ts";

const PR_303_PREVIEW_REGEX = /^https:\/\/mercury-builder[a-z0-9-]*-hbw\.vercel\.app$/;

describe("browser origin ownership boundary", () => {
  it("reproduces the PR #303 hostname spoof and rejects it after the fix", () => {
    const attackerOrigin = "https://mercury-builder-evil-hbw.vercel.app";

    expect(PR_303_PREVIEW_REGEX.test(attackerOrigin)).toBe(true);
    expect(resolveAllowedBrowserOrigin(attackerOrigin)).toBeNull();
  });

  it.each([
    "https://mercury-builder-pro.vercel.app",
    "https://mercury-builder-pro-hbw.vercel.app",
    "https://mercury-builder-pro-git-main-hbw.vercel.app",
  ])("allows the exact Vercel project domain %s", (origin) => {
    expect(resolveAllowedBrowserOrigin(origin)).toBe(origin);
  });

  it.each([
    "https://mercury-builder-pro-git-main-hbw.vercel.app.attacker.example",
    "https://mercury-builder-pro-git-main-hbw.vercel.app:444",
    "https://mercury-builder-random-hbw.vercel.app",
    "https://evil.vercel.app",
    "http://mercury-builder-pro-git-main-hbw.vercel.app",
    "https://mercury-builder-pro-git-main-hbw.vercel.app.",
  ])("rejects unowned or non-exact Vercel origin %s", (origin) => {
    expect(resolveAllowedBrowserOrigin(origin)).toBeNull();
  });

  it.each([
    "https://www.mercuryrepower.ca",
    "https://mercuryrepower.ca",
    "https://quote.harrisboatworks.ca",
    "https://www.mercuryquote.ca",
    "https://mercuryquote.ca",
  ])("preserves production origin %s", (origin) => {
    expect(resolveAllowedBrowserOrigin(origin)).toBe(origin);
  });

  it("preserves HTTP localhost ports without weakening public hosts", () => {
    expect(resolveAllowedBrowserOrigin("http://localhost:5173/path")).toBe("http://localhost:5173");
    expect(resolveAllowedBrowserOrigin("http://127.0.0.1:4173")).toBe("http://127.0.0.1:4173");
    expect(resolveAllowedBrowserOrigin("https://localhost:5173")).toBeNull();
  });

  it("normalizes case but rejects absent and opaque origins", () => {
    expect(resolveAllowedBrowserOrigin("HTTPS://MERCURYREPOWER.CA/path")).toBe(
      "https://mercuryrepower.ca",
    );
    expect(resolveAllowedBrowserOrigin(null)).toBeNull();
    expect(resolveAllowedBrowserOrigin("")).toBeNull();
    expect(resolveAllowedBrowserOrigin("null")).toBeNull();
  });

  it("keeps the shared Referer fallback inside the same exact boundary", () => {
    expect(isAllowedOrigin(new Request("https://edge.example", {
      headers: { referer: "https://quote.harrisboatworks.ca/quote/summary" },
    }))).toBe(true);
    expect(isAllowedOrigin(new Request("https://edge.example", {
      headers: { referer: "https://mercury-builder-evil-hbw.vercel.app/attack" },
    }))).toBe(false);
  });

  it("routes both edge-function implementations through the same exact resolver", () => {
    const paymentSource = readFileSync("supabase/functions/create-payment/index.ts", "utf8");
    const sharedSource = readFileSync("supabase/functions/_shared/origin-check.ts", "utf8");

    expect(paymentSource).toContain(
      'return resolveAllowedBrowserOrigin(req.headers.get("origin"));',
    );
    expect(sharedSource).toContain("resolveAllowedBrowserOrigin(origin) !== null");
    expect(paymentSource).not.toContain("PAYMENT_PREVIEW_ORIGIN");
    expect(sharedSource).not.toContain("ALLOWED_PREVIEW_HOST");
  });
});
