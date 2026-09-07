import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  applyMotorPresentationOverrides as applyPublicMotorPresentationOverrides,
  motorSlug,
} from "../../../supabase/functions/_shared/motor-slug.ts";
import {
  PUBLIC_SITE_URL,
  toPublicImageUrl,
} from "../../../supabase/functions/_shared/public-motor-contract.ts";
import {
  applyMotorPresentationOverrides as applyBuildMotorPresentationOverrides,
} from "../../data/motorPresentationOverrides.js";

const source = (path: string) => readFileSync(path, "utf8");

const qualifierCorrections = [
  {
    partNumber: "1F5145TJZ",
    staleDisplay: "50 ELHPT FourStroke",
    display: "50 ELHPT Command Thrust FourStroke Tiller",
    route: "fourstroke-50hp-50-elhpt-fourstroke",
    legacyRoute: "/motors/fs-50-elhpt-ct-t",
    pricingDisplay: "50ELHPT Command Thrust FourStroke Tiller",
  },
  {
    partNumber: "1F60463GZ",
    staleDisplay: "60 EXLPT FourStroke",
    display: "60 EXLPT Command Thrust FourStroke",
    route: "fourstroke-60hp-60-exlpt-fourstroke",
    legacyRoute: "/motors/fs-60-exlpt-ct",
    pricingDisplay: "60EXLPT Command Thrust FourStroke",
  },
  {
    partNumber: "1F904632D",
    staleDisplay: "90 EXLPT FourStroke",
    display: "90 EXLPT Command Thrust FourStroke",
    route: "fourstroke-90hp-90-exlpt-fourstroke",
    legacyRoute: "/motors/fs-90-exlpt-ct",
    pricingDisplay: "90EXLPT Command Thrust FourStroke",
  },
] as const;

describe("public motor agent contract", () => {
  it("uses the canonical www origin and emits absolute safe image URLs", () => {
    expect(PUBLIC_SITE_URL).toBe("https://www.mercuryrepower.ca");
    expect(toPublicImageUrl("/motors/200-exlpt-proxs.jpg")).toBe(
      "https://www.mercuryrepower.ca/motors/200-exlpt-proxs.jpg",
    );
    expect(toPublicImageUrl("https://cdn.example/motor.jpg")).toBe(
      "https://cdn.example/motor.jpg",
    );
    expect(toPublicImageUrl(null)).toBeNull();
    expect(toPublicImageUrl("javascript:alert(1)")).toBeNull();
  });

  it.each([
    {
      row: {
        family: "FourStroke",
        horsepower: 9.9,
        model_display: "9.9MH FourStroke",
      },
      slug: "fourstroke-9-9hp-9-9mh-fourstroke",
    },
    {
      row: {
        family: "ProXS",
        horsepower: 150,
        model_display: "150 EXLPT ProXS",
      },
      slug: "proxs-150hp-150-exlpt-proxs",
    },
    {
      row: {
        family: "ProXS",
        horsepower: 115,
        model_display: "115 ELPT Pro XS Command Thrust",
      },
      slug: "proxs-115hp-115-elpt-pro-xs-command-thrust",
    },
    {
      row: {
        family: "FourStroke",
        horsepower: 60,
        model_display: "60 ELPT Command Thrust FourStroke",
      },
      slug: "fourstroke-60hp-60-elpt-command-thrust-fourstroke",
    },
    {
      row: {
        family: "FourStroke",
        horsepower: 60,
        model_display: "60 EXLPT Command Thrust FourStroke",
        model_number: "1F60463GZ",
      },
      slug: "fourstroke-60hp-60-exlpt-fourstroke",
    },
  ])("derives the checked-in catalog route $slug", ({ row, slug }) => {
    expect(motorSlug(row)).toBe(slug);
    expect(existsSync(`public/motors/${slug}.md`)).toBe(true);
  });

  it.each(qualifierCorrections)(
    "shares the authoritative $partNumber presentation without moving its route",
    ({ partNumber, staleDisplay, display, route }) => {
      const row = {
        family: "FourStroke",
        horsepower: Number.parseFloat(display),
        model_display: staleDisplay,
        model_number: partNumber,
      };

      expect(applyPublicMotorPresentationOverrides(row)).toEqual({
        ...row,
        model_display: display,
        model_key: route,
      });
      expect(applyBuildMotorPresentationOverrides(row)).toEqual(
        applyPublicMotorPresentationOverrides(row),
      );
      expect(motorSlug(applyPublicMotorPresentationOverrides(row))).toBe(route);
      expect(source("src/data/mercury-motors-reference.md")).toContain(
        `| ${partNumber} | ${display} |`,
      );
    },
  );

  it("does not 301 a checked-in motor twin onto a different motor", () => {
    const commandThrustTwin = source(
      "public/motors/fourstroke-60hp-60-elpt-command-thrust-fourstroke.md",
    );
    const standardTwin = source(
      "public/motors/fourstroke-60hp-60-elpt-fourstroke.md",
    );

    expect(commandThrustTwin).toContain(
      "motor_id: 8f7b62e5-e3d4-41d5-8489-9aa50c476d46",
    );
    expect(commandThrustTwin).toContain("model_number: 1F60453GZ");
    expect(standardTwin).toContain(
      "motor_id: 5744e979-5c77-4550-a955-d9e83ecdb26c",
    );
    expect(standardTwin).toContain("model_number: 1F60413GZ");

    const vercel = JSON.parse(source("vercel.json")) as {
      redirects?: Array<{ source: string; destination: string }>;
    };
    const motorHtmlRoutes = new Set(
      readdirSync("public/motors")
        .filter((name) => name.endsWith(".md"))
        .map((name) => `/motors/${name.slice(0, -3)}`),
    );
    const colliding = (vercel.redirects ?? []).filter(
      (redirect) =>
        motorHtmlRoutes.has(redirect.source) &&
        redirect.destination !== redirect.source,
    );

    expect(colliding).toEqual([]);
  });

  it("pairs every legacy motor redirect with a valid Markdown twin", () => {
    const vercel = JSON.parse(source("vercel.json")) as {
      redirects?: Array<{
        source: string;
        destination: string;
        statusCode: number;
      }>;
    };
    const redirects = vercel.redirects ?? [];
    const motorRedirects = redirects.filter((redirect) =>
      redirect.source.startsWith("/motors/"),
    );
    const bySource = new Map(
      motorRedirects.map((redirect) => [redirect.source, redirect]),
    );

    expect(bySource.size).toBe(motorRedirects.length);
    for (const redirect of motorRedirects) {
      expect(redirect.destination).not.toBe(redirect.source);
      expect(bySource.has(redirect.destination)).toBe(false);
    }
    for (const redirect of motorRedirects.filter(
      ({ source }) => !source.endsWith(".md"),
    )) {
      expect(redirect.statusCode).toBe(301);
      expect(existsSync(`public${redirect.destination}.md`)).toBe(true);
      expect(bySource.get(`${redirect.source}.md`)).toEqual({
        source: `${redirect.source}.md`,
        destination: `${redirect.destination}.md`,
        statusCode: 301,
      });
    }
  });

  it("keeps the twin-generator fallback eligibility aligned with prerender", () => {
    const twinGenerator = source("scripts/generate-markdown-twins.mjs");
    const staticPrerender = source("scripts/static-prerender.mjs");

    for (const script of [twinGenerator, staticPrerender]) {
      expect(script).toContain(
        "&or=(availability.is.null,availability.neq.Exclude)&order=horsepower.asc",
      );
      expect(script).not.toContain(
        "&availability=neq.Exclude&order=horsepower.asc",
      );
      expect(script).not.toContain("&model_key=not.is.null&or=");
    }
  });

  it("keeps qualifier-corrected legacy URLs on the same motor identities", () => {
    const vercel = JSON.parse(source("vercel.json")) as {
      redirects?: Array<{ source: string; destination: string }>;
    };
    const redirects = new Map(
      (vercel.redirects ?? []).map((redirect) => [
        redirect.source,
        redirect.destination,
      ]),
    );

    expect(redirects.get("/motors/fs-60-elpt-ct")).toBe(
      "/motors/fourstroke-60hp-60-elpt-command-thrust-fourstroke",
    );
    expect(
      redirects.has(
        "/motors/fourstroke-60hp-60-elpt-command-thrust-fourstroke",
      ),
    ).toBe(false);

    const pricingReference = source("public/pricing-reference.md");
    const pricingSchema = source("public/pricing-reference.schema.json");
    for (const correction of qualifierCorrections) {
      const destination = redirects.get(correction.legacyRoute);
      expect(destination).toBe(`/motors/${correction.route}`);
      const twin = source(`public${destination}.md`);
      expect(twin).toContain(`model_number: ${correction.partNumber}`);
      expect(twin).toContain(`# ${correction.display}`);
      expect(pricingReference).toContain(
        `| ${Number.parseFloat(correction.display)} | ${correction.pricingDisplay} | ${correction.partNumber} |`,
      );
      expect(pricingSchema).toContain(
        `"name": "Mercury ${correction.display}"`,
      );
    }
  });

  it("routes every public motor surface through the shared contract", () => {
    const motorsApi = source("supabase/functions/public-motors-api/index.ts");
    const quoteApi = source("supabase/functions/public-quote-api/index.ts");
    const mcpServer = source("supabase/functions/agent-mcp-server/index.ts");
    const motorPage = source("src/pages/MotorPage.tsx");

    expect(motorsApi).toContain("const SITE_URL = PUBLIC_SITE_URL;");
    expect(quoteApi).toContain("const SITE_URL = PUBLIC_SITE_URL;");
    expect(mcpServer).toContain("const SITE_URL = PUBLIC_SITE_URL;");
    expect(quoteApi).not.toContain('Deno.env.get("APP_URL")');
    expect(quoteApi).not.toContain('.ilike("model_display"');
    expect(quoteApi).toContain(".limit(textSearch ? 500 : limit)");
    expect(quoteApi).toContain(".includes(textSearch)");

    expect(motorsApi).toContain("const slug = motorSlug(m);");
    expect(quoteApi).toContain("const slug = motorSlug(m);");
    expect(quoteApi).toContain("const slug = motorSlug(motor);");
    expect(mcpServer).toContain("const slug = motorSlug(m);");
    expect(motorPage).toContain("motorSlug as publicMotorSlug");
    expect(motorPage).toContain("publicMotorSlug(candidate) === slug");
    expect(motorPage).not.toContain("function publicMotorSlug");
    expect(mcpServer).toContain("${SITE_URL}/motors/${slug}");
    expect(mcpServer).not.toContain(
      "url: `${SITE_URL}/quote/motor-selection?motor=${m.id}`",
    );
    expect(mcpServer).not.toContain('.neq("availability", "Exclude")');
    expect(
      mcpServer.match(
        /\.or\("availability\.is\.null,availability\.neq\.Exclude"\)/g,
      ),
    ).toHaveLength(2);
    expect(mcpServer).toContain(".limit(500)");
    expect(mcpServer).toContain(".slice(0, resultLimit)");

    for (const handler of [motorsApi, quoteApi, mcpServer]) {
      expect(handler).toContain("applyMotorPresentationOverrides(");
      const motorSelects = Array.from(
        handler.matchAll(
          /\.from\(["']motor_models["']\)\s*\.select\(\s*["']([^"']+)["']/g,
        ),
        (match) => match[1],
      );
      expect(motorSelects.length).toBeGreaterThan(0);
      for (const selection of motorSelects) {
        expect(selection.split(/,\s*/)).toContain("model_number");
      }
    }

    expect(motorsApi).not.toContain("function slugify");
    expect(quoteApi).not.toContain("function slugify");

    for (const handler of [motorsApi, quoteApi, mcpServer]) {
      expect(handler).toContain("toPublicImageUrl(");
    }
  });

  it("does not advertise unsupported shaft or controls quote inputs", () => {
    const quoteApi = source("supabase/functions/public-quote-api/index.ts");
    expect(quoteApi).not.toContain(
      "Optional: shaft, controls, trade_in, contact, customer_has_propeller",
    );
  });
});
