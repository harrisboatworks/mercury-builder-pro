import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildVerifiedHbwAuthorityAnswer,
  detectHbwAuthorityIntent,
  formatHbwAuthorityKnowledge,
  HBW_AUTHORITY_FACTS_VERSION,
} from "../../../supabase/functions/_shared/verified-hbw-authority-facts";

describe("verified HBW dealer-authority facts", () => {
  it("answers the exact Premier Dealer question from the canonical guide", () => {
    const answer = buildVerifiedHbwAuthorityAnswer(
      "What should I expect from a Mercury Premier Dealer?",
    );

    expect(detectHbwAuthorityIntent(
      "What should I expect from a Mercury Premier Dealer?",
    )).toBe("premier_dealer");
    expect(answer).toContain("Mercury Marine Premier Dealer");
    expect(answer).toContain("Mercury-trained technicians");
    expect(answer).toContain("deep Mercury and MerCruiser parts inventory");
    expect(answer).toContain("on-water Rice Lake test");
    expect(answer).toContain(
      "https://www.mercuryrepower.ca/blog/best-mercury-dealer-ontario-hbw-difference",
    );
    expect(answer).not.toMatch(/\b(?:top|highest)\s+(?:dealer\s+)?tier\b/i);
    expect(answer).not.toContain("faster resolution");
  });

  it("answers dealer-status warranty questions before the technical fallback", () => {
    const answer = buildVerifiedHbwAuthorityAnswer(
      "Does dealer status change my Mercury warranty?",
    );

    expect(detectHbwAuthorityIntent(
      "Does dealer status change my Mercury warranty?",
    )).toBe("dealer_warranty");
    expect(answer).toMatch(/^No\./);
    expect(answer).toContain("does not change a customer's Mercury factory-warranty rights");
    expect(answer).toContain("or guarantee claim approval");
    expect(answer).not.toContain("serial-number");
    expect(answer).not.toContain("I won't guess");
  });

  it("handles possessive status wording without swallowing mixed warranty disputes", () => {
    expect(detectHbwAuthorityIntent(
      "Does my dealer's status affect the warranty?",
    )).toBe("dealer_warranty");
    expect(detectHbwAuthorityIntent(
      "My dealer said the factory warranty won't cover my 115 Pro XS. Is that true?",
    )).toBeNull();
  });

  it("keeps voice answers free of Markdown links and raw URLs", () => {
    const answer = buildVerifiedHbwAuthorityAnswer(
      "Is Premier status better for warranty claims?",
      { voice: true, includeLinks: false },
    );

    expect(answer).toContain("Source: HBW's Mercury Premier Dealer guide.");
    expect(answer).not.toContain("](");
    expect(answer).not.toContain("https://");
  });

  it("does not intercept model-warranty or unrelated warranty questions", () => {
    expect(buildVerifiedHbwAuthorityAnswer(
      "How long is the Mercury warranty on a 115 Pro XS?",
    )).toBeNull();
    expect(buildVerifiedHbwAuthorityAnswer(
      "What is covered by the factory warranty?",
    )).toBeNull();
  });

  it("injects the same canon ahead of generated chat, lookup and realtime paths", () => {
    const stream = readFileSync("supabase/functions/ai-chatbot-stream/index.ts", "utf8");
    const legacy = readFileSync("supabase/functions/ai-chatbot/index.ts", "utf8");
    const voiceLookup = readFileSync(
      "supabase/functions/voice-perplexity-lookup/index.ts",
      "utf8",
    );
    const realtime = readFileSync("supabase/functions/realtime-session/index.ts", "utf8");
    const harrisGuide = formatHbwAuthorityKnowledge();

    for (const source of [stream, legacy, voiceLookup]) {
      expect(source).toContain("buildVerifiedHbwAuthorityAnswer");
      expect(source.lastIndexOf("buildVerifiedHbwAuthorityAnswer("))
        .toBeLessThan(source.lastIndexOf("buildVerifiedMercuryTechnicalAnswer("));
    }
    expect(realtime).toContain("HBW_AUTHORITY_REALTIME_INSTRUCTIONS");
    expect(harrisGuide).toContain("does **not** change");
    expect(harrisGuide).toContain("Do not call Premier");
    expect(HBW_AUTHORITY_FACTS_VERSION).toMatch(/^hbw-authority-/);
  });
});
