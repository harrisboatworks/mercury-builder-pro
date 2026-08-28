import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { motorSlug } from "../../../supabase/functions/_shared/motor-slug.ts";
import {
  PUBLIC_SITE_URL,
  toPublicImageUrl,
} from "../../../supabase/functions/_shared/public-motor-contract.ts";

const source = (path: string) => readFileSync(path, "utf8");

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
  ])("derives the checked-in catalog route $slug", ({ row, slug }) => {
    expect(motorSlug(row)).toBe(slug);
    expect(existsSync(`public/motors/${slug}.md`)).toBe(true);
  });

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

  it("routes every public motor surface through the shared contract", () => {
    const motorsApi = source("supabase/functions/public-motors-api/index.ts");
    const quoteApi = source("supabase/functions/public-quote-api/index.ts");
    const mcpServer = source("supabase/functions/agent-mcp-server/index.ts");

    expect(motorsApi).toContain("const SITE_URL = PUBLIC_SITE_URL;");
    expect(quoteApi).toContain("const SITE_URL = PUBLIC_SITE_URL;");
    expect(mcpServer).toContain("const SITE_URL = PUBLIC_SITE_URL;");
    expect(quoteApi).not.toContain('Deno.env.get("APP_URL")');

    expect(motorsApi).toContain("const slug = motorSlug(m);");
    expect(quoteApi).toContain("const slug = motorSlug(m);");
    expect(quoteApi).toContain("const slug = motorSlug(motor);");
    expect(mcpServer).toContain("const slug = motorSlug(m);");
    expect(mcpServer).toContain("${SITE_URL}/motors/${slug}");
    expect(mcpServer).not.toContain(
      "url: `${SITE_URL}/quote/motor-selection?motor=${m.id}`",
    );
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
