import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { searchLiveBlogKnowledge } from "../../../supabase/functions/_shared/format-kb-documents";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("live blog knowledge retrieval", () => {
  it("publishes a rich live retrieval index, not only article titles", () => {
    const index = JSON.parse(readFileSync("public/blog-index.json", "utf8"));
    const oilArticle = index.articles.find(
      (article: { slug: string }) => article.slug === "mercury-outboard-oil-capacity-chart",
    );

    expect(oilArticle.description).toContain("crankcase");
    expect(oilArticle.keywords).toContain("Mercury outboard oil capacity chart");
    expect(oilArticle.faqs.length).toBeGreaterThan(0);
  });

  it("selects and fetches first-party article text for the current question", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/blog-index.json")) {
        return new Response(JSON.stringify({
          count: 2,
          articles: [
            {
              slug: "mercury-outboard-oil-capacity-chart",
              title: "Mercury Outboard Oil Capacity Chart: Model and Year Lookup",
              description: "Search crankcase capacities by engine family and serial break.",
              category: "Service & Maintenance",
              publishDate: "2026-07-24",
              keywords: ["oil capacity", "crankcase capacity"],
              faqs: [],
            },
            {
              slug: "mercury-repower-cost-ontario",
              title: "Mercury Repower Cost Ontario",
              description: "Repower pricing and installation.",
              category: "Pricing",
              publishDate: "2026-07-20",
              keywords: ["repower cost"],
              faqs: [],
            },
          ],
        }), { status: 200 });
      }

      if (url.endsWith("/mercury-outboard-oil-capacity-chart.md")) {
        return new Response(
          "# Mercury Outboard Oil Capacity Chart\n\nThe 2.1 L 115 Pro XS row lists 5.5 US qt / 5.2 L. Confirm final level on the dipstick.",
          { status: 200 },
        );
      }

      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchLiveBlogKnowledge(
      "How much oil does a 115 Pro XS take?",
      1,
    );

    expect(result).toContain("Relevant first-party HBW article knowledge");
    expect(result).toContain("5.5 US qt / 5.2 L");
    expect(result).toContain("/blog/mercury-outboard-oil-capacity-chart");
    expect(result).not.toContain("Mercury Repower Cost Ontario");
  });
});
