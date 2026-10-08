// Shared Mercury model-code system for deterministic parsing across all functions
export type MercuryShaftCode = "S" | "L" | "XL" | "XXL";
export type MercurySpecSource = "database" | "model_code" | null;

export type RigAttrs = {
  tokens: string[];               // ordered tokens for key (e.g. ["S","E","H","PT","CT"])
  shaft_code: MercuryShaftCode;
  shaft_inches: 15 | 20 | 25 | 30;
  start_type: "Electric" | "Manual" | "Unknown";
  control_type: "Tiller" | "Remote" | "Unknown";
  has_power_trim: boolean;
  has_command_thrust: boolean;
};

export type MercuryDecodedSpecs = {
  shaft_code: MercuryShaftCode | null;
  shaft_inches: 15 | 20 | 25 | 30 | null;
  start_type: "Electric" | "Manual" | null;
  control_type: "Tiller" | "Remote" | null;
  has_power_trim: boolean | null;
  has_command_thrust: boolean | null;
};

export type MercuryCatalogSpecs = {
  shaftLength: string | null;
  shaftInches: number | null;
  controlType: string | null;
  startType: "Electric" | "Manual" | null;
  powerTrim: boolean | null;
  commandThrust: boolean | null;
  specSource: MercurySpecSource;
};

const CODE_CANON: Record<string, string> = {
  // start
  E: "E", ELEC: "E", ELECTRIC: "E",
  M: "M", MANUAL: "M",
  // control
  H: "H", TILLER: "H",
  // power trim
  PT: "PT",
  // gearcase
  CT: "CT", // Command Thrust
  // shaft
  L: "L", XL: "XL", XXL: "XXL",
};

const SHAFT_INCHES: Record<MercuryShaftCode, 15 | 20 | 25 | 30> = {
  S: 15,
  L: 20,
  XL: 25,
  XXL: 30,
};

const SHAFT_NAMES: Record<MercuryShaftCode, string> = {
  S: "Short",
  L: "Long",
  XL: "Extra Long",
  XXL: "Extra Extra Long",
};

// Family / marketing words whose letters must never be peeled as rig codes
// (the H in "Thrust"/"FourStroke", the L/S in "SeaPro", etc.).
const FAMILY_NOISE = [
  /four\s*strokes?/gi,
  /pro\s*xs/gi,
  /sea\s*pro/gi,
  /pro\s*kicker/gi,
  /\bverado\b/gi,
  /\bracing\b/gi,
  /\befi\b/gi,
  /\bdts\b/gi,
];

function toCanon(raw: string): string | null {
  const up = raw.replace(/\s+/g, "").toUpperCase();
  return CODE_CANON[up] ?? null;
}

function preprocessModelDisplay(input: string): string {
  let text = input || "";
  // Promote the phrase to the CT token before family-word stripping.
  text = text.replace(/command\s*thrust/gi, " CT ");
  for (const re of FAMILY_NOISE) {
    re.lastIndex = 0;
    text = text.replace(re, " ");
  }
  return text;
}

function extractCanonTokens(input: string): string[] {
  const chunks = preprocessModelDisplay(input)
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const out: string[] = [];

  // Peel sub-tokens in priority order so "EXLPT" splits correctly.
  // Leading HP digits are stripped so "115EXLPT" and "9.9MH" still parse.
  const SUB_ORDER = ["XXL", "XL", "PT", "CT", "ELECTRIC", "ELEC", "E", "MANUAL", "M", "TILLER", "H", "L"];
  function peel(chunk: string) {
    let s = chunk.toUpperCase().replace(/^\d+(?:\.\d+)?/, "");
    if (!s) return;
    // Counter-rotation prefix ("225CXXL", "250 CXL"): the C is not a rig code.
    if (/^C(?:XXL|XL|L)/.test(s)) s = s.slice(1);
    const found: string[] = [];
    let progressed = true;
    while (s && progressed) {
      progressed = false;
      for (const pat of SUB_ORDER) {
        if (s.startsWith(pat)) {
          const canon = toCanon(pat);
          if (canon) found.push(canon);
          s = s.slice(pat.length);
          progressed = true;
          break;
        }
      }
    }
    // All-or-nothing: a chunk only counts as a rig code when it is consumed
    // completely (a trailing "A" is the Sail Power suffix, e.g. "5MLHA").
    // Otherwise ordinary words such as "Mercury", "High" or "Lake" would leak
    // M/E/H/L tokens.
    if (s === "" || s === "A") out.push(...found);
  }

  for (const chunk of chunks) peel(chunk);

  const norm: string[] = [];
  for (const token of out) if (!norm.includes(token)) norm.push(token);
  return norm;
}

function explicitShaftCode(norm: string[]): MercuryShaftCode | null {
  if (norm.includes("XXL")) return "XXL";
  if (norm.includes("XL")) return "XL";
  if (norm.includes("L")) return "L";
  return null;
}

/** Parse Mercury rigging codes from strings like:
 *  "9.9 EXLPT EFI", "25 ELHPT", "90 ELPT CT", "MLH", "EXLPT-CT"
 * Strategy:
 *  1) Strip family/marketing words, promote "Command Thrust" to CT
 *  2) Tokenize by non-alnum boundaries -> alnum chunks
 *  3) Strip leading HP digits, then peel known sub-codes in priority order
 *  4) De-duplicate preserving first occurrence order
 *  5) Infer shaft S (15") if no L/XL/XXL present
 */
export function parseMercuryRigCodes(input: string): RigAttrs {
  const norm = extractCanonTokens(input);

  const shaft_code: MercuryShaftCode = explicitShaftCode(norm) ?? "S";
  const shaft_inches = SHAFT_INCHES[shaft_code];

  const start_type = norm.includes("E") ? "Electric" : norm.includes("M") ? "Manual" : "Unknown";
  const control_type = norm.includes("H") ? "Tiller" : "Remote"; // default to Remote if not explicitly H
  const has_power_trim = norm.includes("PT");
  const has_command_thrust = norm.includes("CT");

  const ordered = [
    shaft_code,
    ...norm.filter((t) => t !== "L" && t !== "XL" && t !== "XXL"),
  ];

  return { tokens: ordered, shaft_code, shaft_inches, start_type, control_type, has_power_trim, has_command_thrust };
}

/**
 * Catalog-safe decode: same tokens as parseMercuryRigCodes, but fields the
 * decoder cannot actually determine stay null instead of inferred defaults.
 */
export function decodeMercuryModelSpecs(input: string): MercuryDecodedSpecs {
  const norm = extractCanonTokens(input);
  const hasStart = norm.includes("E") || norm.includes("M");
  const hasHandle = norm.includes("H");
  const hasPT = norm.includes("PT");
  const explicitShaft = explicitShaftCode(norm);
  // MH / EH with no shaft letter means Short in the Mercury code system.
  const shaft_code = explicitShaft ?? (hasStart || hasHandle ? "S" : null);

  return {
    shaft_code,
    shaft_inches: shaft_code ? SHAFT_INCHES[shaft_code] : null,
    start_type: norm.includes("E") ? "Electric" : norm.includes("M") ? "Manual" : null,
    control_type: hasHandle ? "Tiller" : (hasStart || hasPT ? "Remote" : null),
    has_power_trim: hasPT ? true : null,
    has_command_thrust: norm.includes("CT") ? true : null,
  };
}

function presentText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function shaftCodeFromLength(value: string | null | undefined): MercuryShaftCode | null {
  if (!value) return null;
  const u = value.trim().toUpperCase();
  if (u === "S" || u === "SHORT") return "S";
  if (u === "L" || u === "LONG") return "L";
  if (u === "XL") return "XL";
  if (u === "XXL") return "XXL";
  return null;
}

/** DB shaft/control win when present; otherwise decode model_display. Never guess. */
export function resolveMercuryCatalogSpecs(input: {
  modelDisplay?: string | null;
  shaft?: string | null;
  shaftCode?: string | null;
  controlType?: string | null;
}): MercuryCatalogSpecs {
  const dbShaft = presentText(input.shaftCode) || presentText(input.shaft);
  const dbControl = presentText(input.controlType);
  const decoded = decodeMercuryModelSpecs(input.modelDisplay || "");

  const shaftLength = dbShaft ?? decoded.shaft_code ?? null;
  const controlType = dbControl ?? decoded.control_type ?? null;
  const inchesCode = shaftCodeFromLength(dbShaft) ?? decoded.shaft_code ?? shaftCodeFromLength(shaftLength);

  let specSource: MercurySpecSource = null;
  if (dbShaft || dbControl) specSource = "database";
  else if (decoded.shaft_code || decoded.control_type) specSource = "model_code";

  return {
    shaftLength,
    shaftInches: inchesCode ? SHAFT_INCHES[inchesCode] : null,
    controlType,
    startType: decoded.start_type,
    powerTrim: decoded.has_power_trim,
    commandThrust: decoded.has_command_thrust,
    specSource,
  };
}

export function formatMercuryShaftMarkdown(
  shaftLength: string | null,
  shaftInches: number | null,
): string {
  const code = shaftCodeFromLength(shaftLength);
  if (code) {
    const inches = shaftInches ?? SHAFT_INCHES[code];
    return `${SHAFT_NAMES[code]} (${inches}")`;
  }
  if (shaftLength && shaftInches != null) return `${shaftLength} (${shaftInches}")`;
  if (shaftLength) return shaftLength;
  if (shaftInches != null) return `${shaftInches}"`;
  return "—";
}

/** Stable key composer */
export function buildMercuryModelKey(params: {
  family?: string;       // FourStroke | ProXS | SeaPro | Verado | Racing
  hp?: number | null;
  hasEFI?: boolean;
  rig: RigAttrs;
  modelNo?: string;      // optional mercury model number to disambiguate
}): string {
  const parts: string[] = [];
  if (params.family) parts.push(params.family.toUpperCase());
  if (params.hp && params.hp > 0) parts.push(`${params.hp}HP`);
  if (params.hasEFI) parts.push("EFI");
  parts.push(...params.rig.tokens); // ["S","E","H","PT","CT"] etc.
  if (params.modelNo) parts.push(params.modelNo.toUpperCase());
  return parts.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
