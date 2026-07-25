import { describe, expect, it } from "vitest";
import { parseMessageText } from "../textParser";

describe("parseMessageText", () => {
  it("extracts every Markdown link from a message", () => {
    const segments = parseMessageText(
      "Sources: [Mercury manual 8M0145552](https://example.com/manual.pdf) and " +
        "[HBW's oil-capacity lookup](https://www.mercuryrepower.ca/blog/mercury-outboard-oil-capacity-chart).",
    );
    const links = segments.filter(
      (segment) => segment.type === "url" || segment.type === "internal-link",
    );

    expect(links).toHaveLength(2);
    expect(links.map((segment) => segment.content)).toEqual([
      "Mercury manual 8M0145552",
      "HBW's oil-capacity lookup",
    ]);
    expect(links.map((segment) => segment.href)).toEqual([
      "https://example.com/manual.pdf",
      "https://www.mercuryrepower.ca/blog/mercury-outboard-oil-capacity-chart",
    ]);
    expect(
      segments
        .filter((segment) => segment.type === "text")
        .map((segment) => segment.content)
        .join(""),
    ).not.toContain("[HBW's oil-capacity lookup]");
  });
});
