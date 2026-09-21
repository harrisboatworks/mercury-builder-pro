// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  decodeMercuryModelSpecs,
  formatMercuryShaftMarkdown,
  parseMercuryRigCodes,
  resolveMercuryCatalogSpecs,
} from "../../../supabase/functions/_shared/mercury-codes.ts";

describe("parseMercuryRigCodes catalog strings", () => {
  it("keeps the original token examples stable", () => {
    expect(parseMercuryRigCodes("9.9 EXLPT EFI").tokens).toEqual(["XL", "E", "PT"]);
    expect(parseMercuryRigCodes("25 ELHPT").tokens).toEqual(["L", "E", "H", "PT"]);
    expect(parseMercuryRigCodes("90 ELPT CT").tokens).toEqual(["L", "E", "PT", "CT"]);
    expect(parseMercuryRigCodes("MLH").tokens).toEqual(["L", "M", "H"]);
    expect(parseMercuryRigCodes("EXLPT-CT").tokens).toEqual(["XL", "E", "PT", "CT"]);
  });

  it("decodes spaced ELPT FourStroke as electric long remote with power trim", () => {
    const rig = parseMercuryRigCodes("90 ELPT FourStroke");
    expect(rig).toMatchObject({
      shaft_code: "L",
      shaft_inches: 20,
      start_type: "Electric",
      control_type: "Remote",
      has_power_trim: true,
      has_command_thrust: false,
    });
    expect(rig.tokens).not.toContain("H");
  });

  it("peels codes glued to horsepower without a space", () => {
    const rig = parseMercuryRigCodes("115EXLPT FourStroke");
    expect(rig.shaft_code).toBe("XL");
    expect(rig.shaft_inches).toBe(25);
    expect(rig.start_type).toBe("Electric");
    expect(rig.control_type).toBe("Remote");
    expect(rig.has_power_trim).toBe(true);
  });

  it("decodes portable tiller codes including short and long", () => {
    expect(parseMercuryRigCodes("9.9 MH FourStroke")).toMatchObject({
      shaft_code: "S",
      shaft_inches: 15,
      start_type: "Manual",
      control_type: "Tiller",
      has_power_trim: false,
    });
    expect(parseMercuryRigCodes("9.9 MLH FourStroke")).toMatchObject({
      shaft_code: "L",
      shaft_inches: 20,
      start_type: "Manual",
      control_type: "Tiller",
    });
  });

  it("treats Command Thrust as CT and does not parse letters from family words", () => {
    const command = parseMercuryRigCodes("90 ELPT Command Thrust FourStroke");
    expect(command.has_command_thrust).toBe(true);
    expect(command.control_type).toBe("Remote");
    expect(command.tokens).not.toContain("H");

    const proxs = parseMercuryRigCodes("150 XL ProXS");
    expect(proxs.shaft_code).toBe("XL");
    expect(proxs.control_type).toBe("Remote");
    expect(proxs.has_command_thrust).toBe(false);

    const seaPro = parseMercuryRigCodes("150 XL SeaPro");
    expect(seaPro.shaft_code).toBe("XL");
    expect(seaPro.start_type).toBe("Unknown");
  });
});

describe("decodeMercuryModelSpecs", () => {
  it("returns determined fields for the live catalog examples", () => {
    expect(decodeMercuryModelSpecs("90 ELPT FourStroke")).toEqual({
      shaft_code: "L",
      shaft_inches: 20,
      start_type: "Electric",
      control_type: "Remote",
      has_power_trim: true,
      has_command_thrust: null,
    });
    expect(decodeMercuryModelSpecs("115EXLPT FourStroke")).toMatchObject({
      shaft_code: "XL",
      shaft_inches: 25,
      start_type: "Electric",
      control_type: "Remote",
      has_power_trim: true,
    });
    expect(decodeMercuryModelSpecs("9.9 MH FourStroke")).toMatchObject({
      shaft_code: "S",
      shaft_inches: 15,
      start_type: "Manual",
      control_type: "Tiller",
    });
    expect(decodeMercuryModelSpecs("9.9 MLH FourStroke")).toMatchObject({
      shaft_code: "L",
      shaft_inches: 20,
      control_type: "Tiller",
    });
    expect(decodeMercuryModelSpecs("90 ELPT Command Thrust FourStroke")).toMatchObject({
      has_command_thrust: true,
      control_type: "Remote",
      start_type: "Electric",
    });
  });

  it("does not guess start, controls, or trim from family words or shaft-only names", () => {
    expect(decodeMercuryModelSpecs("FourStroke")).toEqual({
      shaft_code: null,
      shaft_inches: null,
      start_type: null,
      control_type: null,
      has_power_trim: null,
      has_command_thrust: null,
    });
    expect(decodeMercuryModelSpecs("150 XL ProXS")).toEqual({
      shaft_code: "XL",
      shaft_inches: 25,
      start_type: null,
      control_type: null,
      has_power_trim: null,
      has_command_thrust: null,
    });
    expect(decodeMercuryModelSpecs("Command Thrust")).toMatchObject({
      shaft_code: null,
      control_type: null,
      has_command_thrust: true,
    });
  });
});

describe("resolveMercuryCatalogSpecs", () => {
  it("lets a database value win over the decoder", () => {
    expect(resolveMercuryCatalogSpecs({
      modelDisplay: "90 ELPT FourStroke",
      shaftCode: "XL",
      controlType: "Tiller",
    })).toMatchObject({
      shaftLength: "XL",
      shaftInches: 25,
      controlType: "Tiller",
      startType: "Electric",
      powerTrim: true,
      specSource: "database",
    });
  });

  it("falls back to the model code when DB fields are empty", () => {
    expect(resolveMercuryCatalogSpecs({
      modelDisplay: "90 ELPT FourStroke",
      shaft: "  ",
      shaftCode: null,
      controlType: "",
    })).toEqual({
      shaftLength: "L",
      shaftInches: 20,
      controlType: "Remote",
      startType: "Electric",
      powerTrim: true,
      commandThrust: null,
      specSource: "model_code",
    });
  });

  it("keeps null when neither the DB nor the decoder can determine a value", () => {
    expect(resolveMercuryCatalogSpecs({
      modelDisplay: "Mystery Motor",
      shaftCode: null,
      controlType: null,
    })).toEqual({
      shaftLength: null,
      shaftInches: null,
      controlType: null,
      startType: null,
      powerTrim: null,
      commandThrust: null,
      specSource: null,
    });
  });
});

describe("formatMercuryShaftMarkdown", () => {
  it("prints the long-name plus inches form used by the markdown twin", () => {
    expect(formatMercuryShaftMarkdown("L", 20)).toBe('Long (20")');
    expect(formatMercuryShaftMarkdown("XL", 25)).toBe('Extra Long (25")');
    expect(formatMercuryShaftMarkdown("S", 15)).toBe('Short (15")');
    expect(formatMercuryShaftMarkdown(null, null)).toBe("—");
  });
});

describe("agent motors surfaces", () => {
  it("decode catalog specs in both JSON and markdown twins", async () => {
    const { readFileSync } = await import("node:fs");
    const motorsApi = readFileSync("supabase/functions/public-motors-api/index.ts", "utf8");
    const motorsMd = readFileSync("supabase/functions/motors-md/index.ts", "utf8");
    expect(motorsApi).toContain("resolveMercuryCatalogSpecs");
    expect(motorsApi).toContain("shaftInches");
    expect(motorsApi).toContain("specSource");
    expect(motorsMd).toContain("resolveMercuryCatalogSpecs");
    expect(motorsMd).toContain("formatMercuryShaftMarkdown");
    expect(motorsMd).toContain("must be confirmed against the customer's transom before ordering");
  });
});

describe("decodeMercuryModelSpecs hardening", () => {
  it("decodes counter-rotation prefixes without treating C as a code", () => {
    expect(decodeMercuryModelSpecs("225CXXL FourStroke")).toMatchObject({ shaft_code: "XXL", shaft_inches: 30 });
    expect(decodeMercuryModelSpecs("250 CXL ProXS")).toMatchObject({ shaft_code: "XL", shaft_inches: 25 });
  });
  it("keeps the Sail Power suffix from blocking the rig code", () => {
    expect(decodeMercuryModelSpecs("5MLHA Sail Power FourStroke")).toMatchObject({
      shaft_code: "L", start_type: "Manual", control_type: "Tiller",
    });
  });
  it("never peels codes out of ordinary words", () => {
    for (const name of ["Mercury High Lake Marine", "Mercury 90 Legend Edition", "Avator Electric Motor Housing"]) {
      const s = decodeMercuryModelSpecs(name);
      expect(s.control_type === "Tiller").toBe(false);
      expect(s.shaft_code === "L" || s.shaft_code === "XL" || s.shaft_code === "XXL").toBe(false);
    }
    expect(decodeMercuryModelSpecs("Mercury High Lake Marine")).toMatchObject({
      shaft_code: null, start_type: null, control_type: null,
    });
  });
});
