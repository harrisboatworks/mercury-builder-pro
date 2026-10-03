import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildVerifiedMercuryTechnicalAnswer,
  detectMercuryTechnicalIntent,
  MERCURY_115_PRO_XS_FACTS,
  MERCURY_TECHNICAL_FACTS_VERSION,
} from "../../../supabase/functions/_shared/verified-mercury-technical-facts";

const standard115ProXs = {
  id: "5587d161-617b-4b71-ad24-4d44df14f035",
  model: "115 ELPT ProXS",
  model_number: "1117F131D",
  hp: 115,
  family: "ProXS",
};

const commandThrust115ProXs = {
  model_display: "115 ELPT Pro XS Command Thrust",
  model_number: "1117F531D",
  horsepower: 115,
  family: "ProXS",
};

const modal115ProXs = {
  model: "115 ELPT ProXS",
  hp: 115,
};

describe("verified Mercury technical facts", () => {
  it("locks 115 Pro XS oil capacity to the official value", () => {
    const answer = buildVerifiedMercuryTechnicalAnswer(
      "How much engine oil does this motor take?",
      standard115ProXs,
    );

    expect(answer).toContain("5.2 L");
    expect(answer).toContain("5.5 US qt");
    expect(answer).toContain("not 4 L");
    expect(answer).toContain(
      "https://www.mercuryrepower.ca/blog/mercury-outboard-oil-capacity-chart",
    );
    expect(answer).not.toContain("](/blog/");
    expect(answer).not.toContain("3.0 L");
    expect(MERCURY_115_PRO_XS_FACTS.engineOilCapacityWithFilter.litres).toBe(5.2);
  });

  it("answers exact oil type, WOT, displacement and spark-plug questions", () => {
    expect(buildVerifiedMercuryTechnicalAnswer("What oil should I use?", standard115ProXs))
      .toContain("10W-30");
    expect(buildVerifiedMercuryTechnicalAnswer("What is the WOT RPM range?", standard115ProXs))
      .toContain("5300-6300 RPM");
    expect(buildVerifiedMercuryTechnicalAnswer("What is the displacement?", standard115ProXs))
      .toContain("2,061 cc");
    expect(buildVerifiedMercuryTechnicalAnswer("Which spark plug and gap?", standard115ProXs))
      .toContain("NGK ZFR5F");
  });

  it("keeps standard and Command Thrust gearcase facts separate", () => {
    expect(buildVerifiedMercuryTechnicalAnswer("What is the gear ratio?", standard115ProXs))
      .toContain("2.07:1");
    expect(buildVerifiedMercuryTechnicalAnswer("How much lower-unit lube?", standard115ProXs))
      .toContain("800 mL");

    const ctCapacity = buildVerifiedMercuryTechnicalAnswer(
      "How much lower-unit lube?",
      commandThrust115ProXs,
    );
    expect(ctCapacity).toContain("810 mL");
    expect(ctCapacity).toContain("790 mL");
  });

  it("does not turn a vague 115 HP question into a guessed capacity", () => {
    const answer = buildVerifiedMercuryTechnicalAnswer(
      "How much oil does a 115 hp Mercury take?",
    );

    expect(answer).toContain("I won't guess");
    expect(answer).not.toMatch(/\b(?:3(?:\.0)?|4(?:\.0)?|5\.2)\s*L\b/);
  });

  it("blocks unsupported technical claims instead of sending them to generation", () => {
    const answer = buildVerifiedMercuryTechnicalAnswer(
      "What does this motor weigh?",
      standard115ProXs,
    );

    expect(answer).toContain("I won't guess");
    expect(detectMercuryTechnicalIntent("What does this motor weigh?"))
      .toBe("unsupported_technical");
  });

  it.each([
    "What size battery do I need for a Mercury outboard?",
    "Can I use lithium batteries with my Mercury?",
    "How many CCA does a 150 FourStroke need?",
  ])("links the battery guide without bypassing the manual guard: %s", (message) => {
    const answer = buildVerifiedMercuryTechnicalAnswer(message, { model: "150 FourStroke" });

    expect(answer).toContain("I won't guess");
    expect(answer).toContain("https://www.mercurymarine.com/ca/en/service-and-support/owners-resources");
    expect(answer).toContain("photo of the serial-number label");
    expect(answer).toContain("[HBW's Mercury outboard battery-size guide](https://www.mercuryrepower.ca/blog/mercury-outboard-battery-size-guide)");
    expect(answer).not.toMatch(/\b\d+\s*(?:MCA|CCA|Ah)\b/);
  });

  it("keeps the unidentified-motor fallback and unrelated technical handoffs", () => {
    const battery = buildVerifiedMercuryTechnicalAnswer("What battery do I need?");
    const oil = buildVerifiedMercuryTechnicalAnswer("How much oil does a 150 FourStroke take?");
    const unsupported = buildVerifiedMercuryTechnicalAnswer("What does this motor weigh?", standard115ProXs);

    expect(battery).toContain("for the exact motor");
    expect(battery).toContain("/blog/mercury-outboard-battery-size-guide");
    for (const answer of [oil, unsupported]) {
      expect(answer).toContain("I won't guess");
      expect(answer).not.toContain("battery-size-guide");
    }
    expect(buildVerifiedMercuryTechnicalAnswer("What are your opening hours?")).toBeNull();
  });

  it.each([{ voice: true }, { includeLinks: false }, { voice: true, includeLinks: false }])(
    "preserves link-free battery handoffs for %j",
    (options) => {
      expect(buildVerifiedMercuryTechnicalAnswer("What battery do I need?", null, options))
        .toBe("That value can change by model family, year, gearcase and serial number. I don't have a verified manual-backed answer loaded for the exact motor, so I won't guess. Check Mercury's serial-number owner's manual, or send Harris Boat Works in Gores Landing a photo of the serial-number label.");
    },
  );

  it("preserves the verified 115 Pro XS battery answer and manual citation", () => {
    const answer = buildVerifiedMercuryTechnicalAnswer("What battery do I need?", standard115ProXs);
    expect(answer).toContain("1000 MCA, 800 CCA or 65 Ah");
    expect(answer).toContain("[Mercury manual 8M0145552]");
    expect(answer).not.toContain("I won't guess");
    expect(answer).not.toContain("battery-size-guide");
  });

  it("uses the model-specific break-in and service schedules", () => {
    const breakIn = buildVerifiedMercuryTechnicalAnswer(
      "What is the break-in schedule?",
      standard115ProXs,
    );
    expect(breakIn).toContain("first 2 hours");
    expect(breakIn).toContain("next 8 hours");
    expect(breakIn).toContain("does not create a universal 20-hour oil-change rule");

    const service = buildVerifiedMercuryTechnicalAnswer(
      "When is the first service due?",
      standard115ProXs,
    );
    expect(service).toContain("100 hours or once yearly");
    expect(service).toContain("There is no scheduled 20-hour oil change");
  });

  it("answers the exact modal impeller-schedule question from the 115 Pro XS manual", () => {
    const answer = buildVerifiedMercuryTechnicalAnswer(
      "Impeller replacement schedule?",
      modal115ProXs,
    );

    expect(detectMercuryTechnicalIntent("Impeller replacement schedule?"))
      .toBe("water_pump_impeller_schedule");
    expect(answer).toContain("every 300 hours of use or 3 years");
    expect(answer).toContain("Replace it sooner if overheating occurs or reduced water pressure is noted");
    expect(answer).toContain("manual 8M0145552");
    expect(answer).not.toContain("I won't guess");
  });

  it("exposes an explicit source version for deployment probes", () => {
    expect(MERCURY_TECHNICAL_FACTS_VERSION).toMatch(/^mercury-tech-/);
  });

  it("gates text, legacy and voice technical paths before generated lookup", () => {
    const stream = readFileSync("supabase/functions/ai-chatbot-stream/index.ts", "utf8");
    const legacy = readFileSync("supabase/functions/ai-chatbot/index.ts", "utf8");
    const voiceEdge = readFileSync("supabase/functions/voice-perplexity-lookup/index.ts", "utf8");
    const voiceClient = readFileSync("src/hooks/useElevenLabsVoice.ts", "utf8");

    for (const source of [stream, legacy, voiceEdge, voiceClient]) {
      expect(source).toContain("buildVerifiedMercuryTechnicalAnswer");
    }
    expect(stream.lastIndexOf("buildVerifiedMercuryTechnicalAnswer("))
      .toBeLessThan(stream.lastIndexOf("searchWithPerplexity(message"));
    expect(voiceEdge.lastIndexOf("buildVerifiedMercuryTechnicalAnswer("))
      .toBeLessThan(voiceEdge.lastIndexOf("fetch('https://api.perplexity.ai"));

    for (const staleVoiceClaim of [
      "75 to 115 horsepower hold around 4 to 5 quarts",
      "first oil change should be done at 20 hours",
      "a 115HP is around 365-395 pounds",
      "at least 625 cold cranking amps",
    ]) {
      expect(voiceClient).not.toContain(staleVoiceClaim);
    }
  });

  it("does not let voice service tools invent prices or universal parts lists", () => {
    const voiceClient = readFileSync("src/hooks/useElevenLabsVoice.ts", "utf8");
    const voiceMcp = readFileSync(
      "supabase/functions/elevenlabs-mcp-server/index.ts",
      "utf8",
    );
    const sharedEstimate = readFileSync(
      "supabase/functions/_shared/service-estimates.ts",
      "utf8",
    );

    for (const source of [voiceClient, voiceMcp, sharedEstimate]) {
      expect(source).toContain("I don't have a live verified price");
      expect(source).toContain("model and serial number");
      expect(source).toContain("applicable Mercury manual");
      expect(source).not.toContain("Carb adjustment");
      expect(source).not.toContain("Fog engine");
    }
    expect(voiceClient).not.toContain("serviceMap");
    expect(voiceMcp).not.toContain("SERVICE_ESTIMATES");
    expect(sharedEstimate).toContain(
      "export const SERVICE_ESTIMATES: Record<string, ServiceCategory> = {};",
    );
  });
});
