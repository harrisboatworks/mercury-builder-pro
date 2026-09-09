import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPublicPartResponse } from "../../../supabase/functions/mercury-parts-lookup/public-part";

const read = (path: string) => readFileSync(path, "utf8");

describe("elevenlabs MCP parts lookup shape", () => {
  it("keeps part name and price under data, which the MCP tool now reads", () => {
    const result = buildPublicPartResponse(
      {
        part_number: "8M0151274",
        name: "Tiller Extension Handle",
        description: "Adjustable tiller extension",
        cad_price: 129.99,
      },
      { fromCache: true },
    );

    expect(result).toEqual({
      success: true,
      data: {
        partNumber: "8M0151274",
        name: "Tiller Extension Handle",
        description: "Adjustable tiller extension",
        cadPrice: 129.99,
        imageUrl: null,
        sourceUrl: "https://www.mercuryrepower.ca/mercuryparts",
        fromCache: true,
      },
    });
    expect(result).not.toHaveProperty("name");
    expect(result).not.toHaveProperty("cadPrice");

    const mcp = read("supabase/functions/elevenlabs-mcp-server/index.ts");
    const partsBlock = mcp.slice(
      mcp.indexOf('case "check_parts_availability"'),
      mcp.indexOf("default:"),
    );

    expect(partsBlock).toContain("result.data?.name");
    expect(partsBlock).toContain("result.data?.description");
    expect(partsBlock).toContain("result.data?.cadPrice");
    expect(partsBlock).not.toMatch(/result\.(name|description|cadPrice)\b/);
  });
});
