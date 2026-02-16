import { corsHeaders } from "../_shared/cors.ts";

const PART_NUMBERS = [
  "8M0094233",
  "8M0149930",
  "8M0149931",
  "8M0107510",
  "8M0188357",
  "8M0187621",
  "8M0187622",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { partNumbers?: string[] } = {};
  try { body = await req.json(); } catch { /* use defaults */ }
  const partNumbers = body.partNumbers || PART_NUMBERS;

  console.log(`Fetching images for ${partNumbers.length} parts:`, partNumbers);

  const results: Record<string, { imageUrl: string | null; source: string; error?: string }> = {};

  for (const pn of partNumbers) {
    try {
      // Strategy 1: Search for product image via Firecrawl search
      console.log(`[${pn}] Searching for product image...`);
      const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `Mercury Marine "${pn}" service kit oil change kit product image`,
          limit: 5,
          scrapeOptions: { formats: ["markdown", "links"] },
        }),
      });

      if (!searchRes.ok) {
        const errText = await searchRes.text();
        console.error(`[${pn}] Search failed: ${searchRes.status} ${errText}`);
        results[pn] = { imageUrl: null, source: "search-failed", error: errText };
        continue;
      }

      const searchData = await searchRes.json();
      const searchResults = searchData.data || [];

      // Look for image URLs in search results
      let foundImageUrl: string | null = null;
      let foundSource = "";

      for (const result of searchResults) {
        // Check markdown content for image references
        const markdown = result.markdown || "";
        const imgMatches = markdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+\.(jpg|jpeg|png|webp)[^\s)]*)\)/gi);
        if (imgMatches) {
          for (const match of imgMatches) {
            const urlMatch = match.match(/\((https?:\/\/[^\s)]+)\)/);
            if (urlMatch) {
              const url = urlMatch[1];
              // Filter out tiny icons/logos - prefer product images
              if (!url.includes("logo") && !url.includes("icon") && !url.includes("favicon")) {
                foundImageUrl = url;
                foundSource = `search:${result.url}`;
                break;
              }
            }
          }
        }

        // Check links for image URLs
        if (!foundImageUrl && result.links) {
          for (const link of result.links) {
            if (/\.(jpg|jpeg|png|webp)/i.test(link) && !link.includes("logo") && !link.includes("icon")) {
              foundImageUrl = link;
              foundSource = `links:${result.url}`;
              break;
            }
          }
        }

        if (foundImageUrl) break;
      }

      // Strategy 2: If no image from search, try scraping a specific dealer page
      if (!foundImageUrl && searchResults.length > 0) {
        // Find the best product page URL from search results
        const productUrl = searchResults.find((r: any) =>
          r.url && (r.url.includes(pn) || r.title?.includes(pn))
        )?.url || searchResults[0]?.url;

        if (productUrl) {
          console.log(`[${pn}] Scraping product page: ${productUrl}`);
          const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: productUrl,
              formats: ["links", "screenshot"],
            }),
          });

          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            const links = scrapeData.data?.links || scrapeData.links || [];

            for (const link of links) {
              if (/\.(jpg|jpeg|png|webp)/i.test(link) && !link.includes("logo") && !link.includes("icon")) {
                foundImageUrl = link;
                foundSource = `scrape:${productUrl}`;
                break;
              }
            }

            // Fallback: use screenshot
            if (!foundImageUrl) {
              const screenshot = scrapeData.data?.screenshot || scrapeData.screenshot;
              if (screenshot) {
                foundImageUrl = screenshot;
                foundSource = `screenshot:${productUrl}`;
              }
            }
          } else {
            const errText = await scrapeRes.text();
            console.error(`[${pn}] Scrape failed: ${scrapeRes.status} ${errText}`);
          }
        }
      }

      results[pn] = {
        imageUrl: foundImageUrl,
        source: foundSource || "not-found",
      };
      console.log(`[${pn}] Result: ${foundImageUrl ? "FOUND" : "NOT FOUND"} (${foundSource || "no source"})`);

      // Small delay between requests to be polite
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`[${pn}] Error:`, err);
      results[pn] = {
        imageUrl: null,
        source: "error",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const found = Object.values(results).filter((r) => r.imageUrl).length;
  console.log(`Done: ${found}/${partNumbers.length} images found`);

  return new Response(
    JSON.stringify({ success: true, found, total: partNumbers.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
