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

type MotorPresentationRow = {
  model?: string | null;
  model_display?: string | null;
  model_key?: string | null;
  model_number?: string | null;
  mercury_model_no?: string | null;
};

// Exact-part presentation corrections retain established same-product public
// URLs when authoritative names include qualifiers missing from upstream data.
const MOTOR_OVERRIDES_BY_PART_NUMBER: Readonly<
  Record<string, Readonly<{ model_display: string; model_key: string }>>
> = {
  "1F5145TJZ": {
    model_display: "50 ELHPT Command Thrust FourStroke Tiller",
    model_key: "fourstroke-50hp-50-elhpt-fourstroke",
  },
  "1F60463GZ": {
    model_display: "60 EXLPT Command Thrust FourStroke",
    model_key: "fourstroke-60hp-60-exlpt-fourstroke",
  },
  "1F904632D": {
    model_display: "90 EXLPT Command Thrust FourStroke",
    model_key: "fourstroke-90hp-90-exlpt-fourstroke",
  },
};

function motorPartNumber(row: MotorPresentationRow): string {
  return String(row.model_number || row.mercury_model_no || "")
    .trim()
    .toUpperCase();
}

export function applyMotorPresentationOverrides<T extends MotorPresentationRow>(
  row: T,
): T {
  const overrides = MOTOR_OVERRIDES_BY_PART_NUMBER[motorPartNumber(row)];
  return overrides ? ({ ...row, ...overrides } as T) : row;
}

// Canonical motor slug matching public-motors-api output and the
// /motors/{slug}.md markdown twins. Uses the raw DB family value (e.g. "ProXS")
// when present so the slug does not drift from the markdown filenames.
export function motorSlug(row: {
  model?: string | null;
  model_display?: string | null;
  model_number?: string | null;
  mercury_model_no?: string | null;
  family?: string | null;
  motor_type?: string | null;
  horsepower?: number | null;
}): string {
  const canonicalRoute =
    MOTOR_OVERRIDES_BY_PART_NUMBER[motorPartNumber(row)]?.model_key;
  if (canonicalRoute) return canonicalRoute;

  const family = row.family || detectFamily(row.model_display || row.model, row.motor_type, null);
  const display = row.model_display || row.model || "";
  return slugify(`${family}-${row.horsepower}hp-${display}`);
}
