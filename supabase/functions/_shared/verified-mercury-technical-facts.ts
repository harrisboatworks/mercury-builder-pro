export const MERCURY_TECHNICAL_FACTS_VERSION = "mercury-tech-2026-07-25.1";

export const MERCURY_115_PRO_XS_MANUAL = {
  publication: "8M0145552",
  title: "75/80/90/100/115/115 Pro XS, SeaPro FourStroke Operation, Maintenance and Installation Manual",
  url: "https://servicelit.mercurymarine.com/mnetdata/service/mermar/owner/18/8m0145552.pdf",
} as const;

export const MERCURY_115_PRO_XS_FACTS = {
  engineOilCapacityWithFilter: {
    litres: 5.2,
    usQuarts: 5.5,
  },
  engineOil: {
    recommended: "Mercury or Quicksilver NMMA FC-W 10W-30 four-stroke marine oil",
    optional: "Mercury or Quicksilver NMMA FC-W 25W-40 mineral or synthetic-blend four-stroke marine oil",
  },
  displacementCc: 2061,
  cylinders: 4,
  wotRpm: {
    min: 5300,
    max: 6300,
  },
  sparkPlug: "NGK ZFR5F",
  sparkPlugGapMm: 0.8,
  sparkPlugGapIn: 0.032,
  gearRatio: {
    standard: "2.07:1",
    commandThrust: "2.38:1",
  },
  gearcaseCapacityMl: {
    standard: 800,
    commandThrustRightHand: 810,
    commandThrustLeftHand: 790,
  },
  battery: {
    mca: 1000,
    cca: 800,
    ampHours: 65,
  },
} as const;

export interface MercuryTechnicalMotorContext {
  id?: string;
  model?: string;
  model_display?: string;
  modelDisplay?: string;
  model_number?: string;
  mercury_model_no?: string;
  family?: string;
  hp?: number | string;
  horsepower?: number | string;
  serialNumber?: string;
  serial_number?: string;
}

export type MercuryTechnicalIntent =
  | "engine_oil_capacity"
  | "engine_oil_type"
  | "wot_rpm"
  | "displacement"
  | "spark_plug"
  | "gear_ratio"
  | "gearcase_capacity"
  | "battery"
  | "break_in"
  | "service_schedule"
  | "unsupported_technical";

export interface MercuryTechnicalAnswerOptions {
  includeLinks?: boolean;
  voice?: boolean;
}

const PRO_XS_115_MODEL_NUMBERS = new Set([
  "1117F131D",
  "1117F231D",
  "1117F531D",
  "1117F631D",
]);

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function contextText(context?: MercuryTechnicalMotorContext | string | null): string {
  if (!context) return "";
  if (typeof context === "string") return normalize(context);
  return normalize([
    context.model,
    context.model_display,
    context.modelDisplay,
    context.model_number,
    context.mercury_model_no,
    context.family,
    context.hp,
    context.horsepower,
    context.serialNumber,
    context.serial_number,
  ].filter(Boolean).join(" "));
}

function has115ProXsLabel(value: string): boolean {
  return /\b115\b/.test(value) && /\bpro\s*xs\b/.test(value);
}

export function isVerified115ProXs(
  message: string,
  context?: MercuryTechnicalMotorContext | string | null,
): boolean {
  if (context && typeof context !== "string") {
    const modelNumber = String(context.model_number || context.mercury_model_no || "").toUpperCase();
    if (PRO_XS_115_MODEL_NUMBERS.has(modelNumber)) return true;
  }

  return has115ProXsLabel(contextText(context)) || has115ProXsLabel(normalize(message));
}

export function detectMercuryTechnicalIntent(message: string): MercuryTechnicalIntent | null {
  const q = normalize(message);
  const mentionsEngineOil = /\b(?:engine|crankcase|motor)?\s*oil\b/.test(q) &&
    !/\b(?:gear|gearcase|lower unit|filter)\b/.test(q);

  if (
    mentionsEngineOil &&
    (
      /\b(?:capacity|quantity|amount|litres?|liters?|quarts?)\b/.test(q) ||
      /\bhow much\b/.test(q) ||
      /\b(?:take|takes|hold|holds)\b/.test(q)
    )
  ) {
    return "engine_oil_capacity";
  }

  if (
    mentionsEngineOil &&
    !/\b(?:change|changed|service|interval|schedule)\b/.test(q) &&
    /\b(?:type|grade|weight|viscosity|which|what|recommend|recommended|use)\b/.test(q)
  ) {
    return "engine_oil_type";
  }

  if (
    mentionsEngineOil &&
    /\b(?:change|changed|service)\b/.test(q) &&
    /\b(?:when|how often|hours?|annual|yearly|due|interval|schedule)\b/.test(q)
  ) {
    return "service_schedule";
  }

  if (/\b(?:wide open throttle|wot|max(?:imum)? rpm|rpm range|operating range)\b/.test(q)) {
    return "wot_rpm";
  }

  if (/\b(?:displacement|cylinders?|cubic centimetres?|cubic centimeters?|cc)\b/.test(q)) {
    return "displacement";
  }

  if (/\b(?:spark plugs?|plug gap)\b/.test(q)) {
    return "spark_plug";
  }

  if (/\bgear ratio\b/.test(q)) {
    return "gear_ratio";
  }

  if (
    /\b(?:gearcase|lower unit|gear oil|gear lube)\b/.test(q) &&
    /\b(?:capacity|quantity|amount|oil|lube|lubricant|litres?|liters?|ounces?|ml)\b/.test(q)
  ) {
    return "gearcase_capacity";
  }

  if (/\b(?:battery|batteries|cranking amps?|cca|mca|amp hours?|ah)\b/.test(q)) {
    return "battery";
  }

  if (/\b(?:break in|breakin|breaking in)\b/.test(q)) {
    return "break_in";
  }

  if (
    /\b(?:service|maintenance|oil change)\b/.test(q) &&
    /\b(?:schedule|interval|first|when|how often|hours?|annual|yearly|due)\b/.test(q)
  ) {
    return "service_schedule";
  }

  if (
    /\b(?:technical|specs?|specification|weight|weigh|dry weight|fuel consumption|fuel burn|gph|mpg|alternator|charging output|compression|bore|stroke|dimensions?|shaft length|part number|oil filter|fuel filter|impeller|water pump|thermostat|cooling system|fuel system|anode|fuse|circuit breaker|overheat|alarm code|fault code|winteriz|storage procedure|fuel line|fuel hose|fuel pump|primer bulb|ethanol|octane|prop pitch|propeller pitch|prop size|propeller size|prop diameter|propeller diameter|prop hub|hub kit|top speed|speed estimate|how fast|hole shot|torque curve|noise level|how loud|control cable|throttle cable|shift cable|steering fluid|warranty|recall|service bulletin|wont start|no start|stall|vibration|smoke)\b/.test(q)
  ) {
    return "unsupported_technical";
  }

  return null;
}

function sourceSuffix(options: MercuryTechnicalAnswerOptions): string {
  if (options.voice || options.includeLinks === false) {
    return ` Source: Mercury manual ${MERCURY_115_PRO_XS_MANUAL.publication}.`;
  }
  return ` Source: [Mercury manual ${MERCURY_115_PRO_XS_MANUAL.publication}](${MERCURY_115_PRO_XS_MANUAL.url}).`;
}

function oilCapacitySourceSuffix(options: MercuryTechnicalAnswerOptions): string {
  if (options.voice || options.includeLinks === false) {
    return sourceSuffix(options);
  }
  return ` Sources: [Mercury manual ${MERCURY_115_PRO_XS_MANUAL.publication}](${MERCURY_115_PRO_XS_MANUAL.url}) and [HBW's oil-capacity lookup](/blog/mercury-outboard-oil-capacity-chart).`;
}

function manualHandoff(
  context?: MercuryTechnicalMotorContext | string | null,
  options: MercuryTechnicalAnswerOptions = {},
): string {
  const identified = contextText(context);
  const modelPhrase = identified ? "that exact motor" : "the exact motor";
  const link = options.voice || options.includeLinks === false
    ? "Mercury's serial-number owner's manual"
    : "[Mercury's owner-manual lookup](https://www.mercurymarine.com/ca/en/service-and-support/owners-resources)";

  return `That value can change by model family, year, gearcase and serial number. I don't have a verified manual-backed answer loaded for ${modelPhrase}, so I won't guess. Check ${link}, or send Harris Boat Works in Gores Landing a photo of the serial-number label.`;
}

export function buildVerifiedMercuryTechnicalAnswer(
  message: string,
  context?: MercuryTechnicalMotorContext | string | null,
  options: MercuryTechnicalAnswerOptions = {},
): string | null {
  const intent = detectMercuryTechnicalIntent(message);
  if (!intent) return null;

  if (!isVerified115ProXs(message, context)) {
    return manualHandoff(context, options);
  }

  const facts = MERCURY_115_PRO_XS_FACTS;
  const source = sourceSuffix(options);
  const combined = `${normalize(message)} ${contextText(context)}`;
  const commandThrust = /\b(?:command thrust|ct)\b/.test(combined);

  switch (intent) {
    case "engine_oil_capacity":
      return `For the 2.1 L Mercury 115 Pro XS covered by manual ${MERCURY_115_PRO_XS_MANUAL.publication}, engine-oil capacity with filter replacement is approximately ${facts.engineOilCapacityWithFilter.litres} L (${facts.engineOilCapacityWithFilter.usQuarts} US qt)—not 4 L. Add less than the listed amount first, then set the final level by the dipstick with the engine vertical and cold or rested at least one hour.${oilCapacitySourceSuffix(options)}`;

    case "engine_oil_type":
      return `For this 2.1 L 115 Pro XS, Mercury recommends ${facts.engineOil.recommended}. ${facts.engineOil.optional} is also listed as an option. Use the exact serial-number manual if the engine identity differs.${source}`;

    case "wot_rpm":
      return `The manual-backed wide-open-throttle range for this 115 Pro XS is ${facts.wotRpm.min}-${facts.wotRpm.max} RPM. Propeller setup should let the engine operate inside that range under the boat's normal load.${source}`;

    case "displacement":
      return `This 115 Pro XS is a ${facts.cylinders}-cylinder, ${facts.displacementCc.toLocaleString("en-CA")} cc (2.1 L) outboard.${source}`;

    case "spark_plug":
      return `The specified spark plug is ${facts.sparkPlug}, gapped to ${facts.sparkPlugGapMm} mm (${facts.sparkPlugGapIn} in.). Confirm the serial-number manual before ordering parts if the engine identity is uncertain.${source}`;

    case "gear_ratio":
      return commandThrust
        ? `The 115 Pro XS Command Thrust gear ratio is ${facts.gearRatio.commandThrust}. The standard-gearcase 115 Pro XS is ${facts.gearRatio.standard}; the gearcase must be identified before using either value.${source}`
        : `The standard-gearcase 115 Pro XS ratio is ${facts.gearRatio.standard}. The Command Thrust version is ${facts.gearRatio.commandThrust}, so confirm which lower unit is fitted.${source}`;

    case "gearcase_capacity":
      return commandThrust
        ? `For the 115 Pro XS Command Thrust gearcase, the manual lists ${facts.gearcaseCapacityMl.commandThrustRightHand} mL for right-hand rotation and ${facts.gearcaseCapacityMl.commandThrustLeftHand} mL for left-hand rotation. Confirm rotation and fill by the manual procedure rather than by horsepower alone.${source}`
        : `For the standard 115 Pro XS gearcase, the manual lists approximately ${facts.gearcaseCapacityMl.standard} mL (27.1 US fl oz). A Command Thrust gearcase uses a different quantity, so identify the lower unit first.${source}`;

    case "battery":
      return `For this 115 Pro XS, Mercury specifies a starting battery rated at least ${facts.battery.mca} MCA, ${facts.battery.cca} CCA or ${facts.battery.ampHours} Ah. Battery fit and cable requirements still need to match the boat and installation.${source}`;

    case "break_in":
      return `For the first 2 hours, vary throttle up to 4500 RPM or three-quarter throttle and run wide open for about 1 minute every 10 minutes. For the next 8 hours, avoid continuous wide-open throttle for more than 5 minutes. That is the 10-hour break-in in manual ${MERCURY_115_PRO_XS_MANUAL.publication}; it does not create a universal 20-hour oil-change rule.${source}`;

    case "service_schedule":
      return `For this 115 Pro XS manual, engine oil and filter are scheduled every 100 hours or once yearly, whichever comes first. The water-pump impeller and spark plugs are in the 300-hour or 3-year schedule. There is no scheduled 20-hour oil change in this manual.${source}`;

    case "unsupported_technical":
      return manualHandoff(context, options);
  }
}
