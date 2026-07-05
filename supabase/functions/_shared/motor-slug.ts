// Shared slug + family normalization for Mercury motor rows.
// Used by public-motors-api, agent-mcp-server, and public-quote-api so
// slugs and family filters cannot drift between endpoints.

export function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Normalize a family value (from DB or user input) to a canonical display form.
// DB stores "ProXS"; docs/enum sometimes use "Pro XS". Both must match.
export function detectFamily(
  model: string | null | undefined,
  _motorType: string | null | undefined,
  family: string | null | undefined
): string {
  if (family) {
    const f = family.toLowerCase().replace(/\s+/g, "");
    if (f === "proxs") return "Pro XS";
    if (f === "seapro") return "SeaPro";
    if (f === "verado") return "Verado";
    if (f === "racing") return "Racing";
    if (f === "fourstroke") return "FourStroke";
    return family;
  }
  const m = (model || "").toLowerCase();
  if (m.includes("proxs") || m.includes("pro xs")) return "Pro XS";
  if (m.includes("seapro") || m.includes("sea pro")) return "SeaPro";
  if (m.includes("racing")) return "Racing";
  if (m.includes("verado")) return "Verado";
  return "FourStroke";
}

// Collapse a family string to a comparison key: lowercase, no spaces.
// "Pro XS" / "ProXS" / "pro xs" -> "proxs".
export function familyKey(family: string | null | undefined): string {
  return (family || "").toLowerCase().replace(/\s+/g, "");
}

// Canonical motor slug matching public-motors-api output and the
// /motors/{slug}.md markdown twins.
export function motorSlug(row: {
  model?: string | null;
  model_display?: string | null;
  family?: string | null;
  motor_type?: string | null;
  horsepower?: number | null;
}): string {
  const family = detectFamily(row.model_display || row.model, row.motor_type, row.family);
  const display = row.model_display || row.model || "";
  return slugify(`${family}-${row.horsepower}hp-${display}`);
}
