// src/lib/mercury-codes.ts
import { getCorrectModelNumber, isValidModelNumber } from "./mercury-model-number-mapping";

export type RigAttrs = {
  tokens: string[];               // ordered tokens for key (e.g. ["S","E","H","PT","CT"])
  shaft_code: "S"|"L"|"XL"|"XXL";
  shaft_inches: 15|20|25|30;
  start_type: "Electric"|"Manual"|"Unknown";
  control_type: "Tiller"|"Remote"|"Unknown";
  has_power_trim: boolean;
  has_command_thrust: boolean;
  is_counter_rotating: boolean;   // Counter Rotating designation
};

const CODE_CANON: Record<string,string> = {
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

function toCanon(raw: string): string | null {
  const up = raw.replace(/\s+/g, "").toUpperCase();
  return CODE_CANON[up] ?? null;
}

/** Parse Mercury rigging codes from strings like:
 *  "9.9 EXLPT EFI", "25 ELHPT", "90 ELPT CT", "MLH", "EXLPT-CT"
 * Strategy:
 *  1) Tokenize by non-alnum boundaries -> alnum chunks
 *  2) Strip a leading horsepower prefix, then peel known sub-codes in priority order
 *  3) De-duplicate preserving first occurrence order
 *  4) Infer shaft S (15") if no L/XL/XXL present
 */
export function parseMercuryRigCodes(input: string): RigAttrs {
  const chunks = (input || "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .split(/\s+/);

  const out: string[] = [];
  
  // Extract HP for special logic
  const hpMatch = input.match(/(\d{2,3})\s*HP?/i);
  const hp = hpMatch ? parseInt(hpMatch[1]) : 0;

  // Special handling for high HP motors (115+) with shaft codes
  // Look for patterns like "150L", "250XL", "350XXL" in the input
  if (hp >= 115) {
    const highHPShaftMatch = input.toUpperCase().match(new RegExp(`${hp}\\s*(XXL|XL|L)\\b`));
    if (highHPShaftMatch) {
      const shaftCode = highHPShaftMatch[1];
      if (!out.includes(shaftCode)) {
        out.push(shaftCode);
      }
    }
  }

  // Check for Counter Rotating designation first
  let is_counter_rotating = false;
  const counterRotatingMatch = input.toUpperCase().match(/\b(CXXL|CXL|ECXLPT|ECXL|CL)\b/);
  if (counterRotatingMatch) {
    is_counter_rotating = true;
    // Extract the shaft part from Counter Rotating codes
    const crCode = counterRotatingMatch[1];
    if (crCode === 'CXXL') {
      out.push('XXL');
    } else if (crCode === 'CXL') {
      out.push('XL');
    } else if (crCode === 'ECXLPT') {
      out.push('E', 'XL', 'PT');
    } else if (crCode === 'ECXL') {
      out.push('E', 'XL');
    } else if (crCode === 'CL') {
      out.push('L');
    }
  }

  // peel sub-tokens in priority order so "EXLPT" splits correctly
  const SUB_ORDER = ["CXXL","CXL","ECXLPT","ECXL","XXL","XL","PT","CT","ELECTRIC","ELEC","E","MANUAL","M","TILLER","H","L"];
  // A counter-rotation bundle may end in a real rig suffix ("225CXXLPT").
  // An ordinary word tail ("Classic" -> "ASSIC") does not.
  function counterRotationTailIsRig(rest: string): boolean {
    let t = rest;
    let progressed = true;
    while (t && progressed) {
      progressed = false;
      for (const pat of SUB_ORDER) {
        if (!t.startsWith(pat) || !toCanon(pat)) continue;
        t = t.slice(pat.length);
        progressed = true;
        break;
      }
    }
    return t === "" || t === "A";
  }
  function peel(chunk: string) {
    let s = chunk.toUpperCase();
    // Catalog names glue horsepower onto the rig bundle ("115EXLPT", "9.9MH").
    // Chunks are already split on the decimal point. A glued "HP" label is not
    // a tiller code; "HPT" still peels as tiller plus power trim.
    const hpPrefixed = /^\d/.test(s);
    const leadingHp = s.match(/^\d+(?:\.\d+)?/);
    if (leadingHp) {
      s = s.slice(leadingHp[0].length);
      if (/^HP(?!T)/.test(s)) s = s.slice(2);
    }
    if (!s) return;

    // Counter-rotation glued to horsepower ("225CXXL", "115ECXLPT") has no
    // word boundary, so the pre-pass misses it. Only that horsepower-prefixed
    // bundle is handled here. Standalone chunks stay on the pre-pass and the
    // peel below, so "Classic" and "CXLPT" keep their previous results.
    if (hpPrefixed) {
      let consumed = 0;
      let tokens: string[] = [];
      if (s.startsWith("CXXL")) {
        consumed = 4;
        tokens = ["XXL"];
      } else if (s.startsWith("CXL")) {
        consumed = 3;
        tokens = ["XL"];
      } else if (s.startsWith("CL")) {
        consumed = 2;
        tokens = ["L"];
      } else if (s.startsWith("ECXLPT")) {
        consumed = 6;
        tokens = ["E", "XL", "PT"];
      } else if (s.startsWith("ECXL")) {
        consumed = 4;
        tokens = ["E", "XL"];
      }
      if (consumed && counterRotationTailIsRig(s.slice(consumed))) {
        is_counter_rotating = true;
        out.push(...tokens);
        s = s.slice(consumed);
      }
    }

    let progressed = true;
    while (s && progressed) {
      progressed = false;
      for (const pat of SUB_ORDER) {
        if (s.startsWith(pat)) {
          // Skip Counter Rotating codes as we handled them above
          if (pat.startsWith('C') && (pat === 'CXXL' || pat === 'CXL' || pat === 'ECXLPT' || pat === 'ECXL')) {
            s = s.slice(pat.length);
            progressed = true;
            break;
          }
          const canon = toCanon(pat);
          if (canon) out.push(canon);
          s = s.slice(pat.length);
          progressed = true;
          break;
        }
      }
    }
  }

  for (const c of chunks) peel(c);
  
  // Automatic Power Trim for motors 40 HP and above
  if (hp >= 40 && !out.includes("PT")) {
    out.push("PT");
  }

  // normalize + dedupe preserving order
  const norm: string[] = [];
  for (const t of out) if (!norm.includes(t)) norm.push(t);

  // shaft inference: default Short (S=15") if none provided
  const hasShaft = norm.some(t => t === "L" || t === "XL" || t === "XXL");
  const shaft_code = hasShaft ? (norm.includes("XXL") ? "XXL" : norm.includes("XL") ? "XL" : "L") : "S";
  const shaft_inches = shaft_code === "XXL" ? 30 : shaft_code === "XL" ? 25 : shaft_code === "L" ? 20 : 15;

  const start_type   = norm.includes("E") ? "Electric" : norm.includes("M") ? "Manual" : "Unknown";
  const control_type = norm.includes("H") ? "Tiller" : "Remote"; // default to Remote if not explicitly H
  const has_power_trim = norm.includes("PT");
  const has_command_thrust = norm.includes("CT");

  // ordered tokens for model_key: shaft first, then features
  const ordered = [
    shaft_code,
    ...(norm.filter(t => t !== "L" && t !== "XL" && t !== "XXL")),
  ];

  return { tokens: ordered, shaft_code, shaft_inches, start_type, control_type, has_power_trim, has_command_thrust, is_counter_rotating };
}

/** 
 * Build Mercury model key using correct model number as primary identifier
 * This ensures model keys are based on official Mercury model numbers
 */
export function buildMercuryModelKey(params: {
  family?: string;       // FourStroke | ProXS | SeaPro | Verado | Racing
  hp?: number | null;
  hasEFI?: boolean;
  rig: RigAttrs;
  modelDisplay?: string; // motor display name to get correct model number
  modelNo?: string;      // optional mercury model number to disambiguate
}): string {
  // Try to get correct model number from display name first
  let correctModelNo = params.modelNo;
  if (params.modelDisplay && !correctModelNo) {
    correctModelNo = getCorrectModelNumber(params.modelDisplay);
  }
  
  // Build key with correct model number as primary identifier
  if (correctModelNo && isValidModelNumber(correctModelNo)) {
    return correctModelNo; // Use official Mercury model number as the key
  }
  
  // Fallback to old system if no correct model number available
  const parts: string[] = [];
  if (params.family) parts.push(params.family.toUpperCase());
  if (params.hp && params.hp > 0) parts.push(`${params.hp}HP`);
  if (params.hasEFI) parts.push("EFI");
  parts.push(...params.rig.tokens); // ["S","E","H","PT","CT"] etc.
  if (params.modelNo) parts.push(params.modelNo.toUpperCase());
  return parts.join("-").replace(/-+/g,"-").replace(/^-|-$/g,"");
}

/**
 * Validate if a motor display name has a correct Mercury model number mapping
 */
export function hasCorrectModelNumber(modelDisplay: string): boolean {
  return getCorrectModelNumber(modelDisplay) !== null;
}