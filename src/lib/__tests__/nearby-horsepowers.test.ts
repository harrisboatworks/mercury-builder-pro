import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { nearbyAvailableHorsepowers } from "../../../supabase/functions/_shared/nearby-horsepowers.ts";

describe("nearbyAvailableHorsepowers", () => {
  it("drops null horsepower and keeps remaining ratings in ascending order", () => {
    const horsepowers = [155, null, 140, undefined, "150", 165, 90];

    expect(nearbyAvailableHorsepowers(horsepowers, 150)).toEqual([140, 150, 155, 165]);
  });

  it("does not treat a missing horsepower as 0 HP", () => {
    expect(nearbyAvailableHorsepowers([null, 15, 20], 9.9)).toEqual([15, 20]);
  });

  it("keeps the lowest ratings inside the ±15 window, not a nearest-first reorder", () => {
    expect(
      nearbyAvailableHorsepowers([135, 140, 145, 150, 155, 160, 165], 150),
    ).toEqual([135, 140, 145, 150]);
  });

  it("is the horsepower fallback used by ai-chatbot-stream", () => {
    const source = readFileSync("supabase/functions/ai-chatbot-stream/index.ts", "utf8");

    expect(source).toContain("from '../_shared/nearby-horsepowers.ts'");
    expect(source).toContain("nearbyAvailableHorsepowers(");
  });
});
