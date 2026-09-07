import { describe, expect, it } from "vitest";

import {
  buildCanonicalMotorRouteCatalog,
  mergeMotorRouteSources,
  motorIdentity,
} from "../../../scripts/lib/motor-route-canonicalization.mjs";
import { applyMotorPresentationOverrides } from "../../data/motorPresentationOverrides.js";

describe("motor route canonicalization", () => {
  it("loads quoted canonical twin frontmatter by normalized part number", () => {
    const catalog = buildCanonicalMotorRouteCatalog({
      twins: [
        {
          filename: "canonical-route.md",
          markdown: [
            "---",
            'motor_id: "motor-quoted"',
            'model_number: "1a10461lk"',
            "slug: 'canonical-route'",
            "---",
          ].join("\n"),
        },
      ],
    });

    expect(catalog.byPartNumber.get("1A10461LK")).toBe("canonical-route");
    expect(catalog.byId.get("motor-quoted")).toBe("canonical-route");
  });

  it("rejects two product identities sharing one canonical route", () => {
    expect(() =>
      buildCanonicalMotorRouteCatalog({
        twins: [
          {
            filename: "canonical-route.md",
            markdown: [
              "---",
              "model_number: 1A00001",
              "slug: canonical-route",
              "---",
            ].join("\n"),
          },
        ],
        requiredCanonicalRoutes: new Map([
          ["1A00002", "canonical-route"],
        ]),
      }),
    ).toThrow(
      "canonical motor route canonical-route maps to both 1A00001 and 1A00002",
    );
  });

  it("rejects a partless id claim colliding with an unrelated part route", () => {
    expect(() =>
      buildCanonicalMotorRouteCatalog({
        twins: [
          {
            filename: "canonical-route.md",
            markdown: [
              "---",
              "motor_id: motor-partless",
              "slug: canonical-route",
              "---",
            ].join("\n"),
          },
        ],
        requiredCanonicalRoutes: new Map([
          ["1A00001", "canonical-route"],
        ]),
      }),
    ).toThrow(
      "canonical motor route canonical-route is claimed by unrelated product identities",
    );
  });

  it("rejects one motor id mapping to two canonical routes", () => {
    expect(() =>
      buildCanonicalMotorRouteCatalog({
        twins: [
          {
            filename: "first-route.md",
            markdown: [
              "---",
              "motor_id: shared-id",
              "slug: first-route",
              "---",
            ].join("\n"),
          },
          {
            filename: "second-route.md",
            markdown: [
              "---",
              "motor_id: shared-id",
              "slug: second-route",
              "---",
            ].join("\n"),
          },
        ],
      }),
    ).toThrow(
      "canonical motor id shared-id maps to both first-route and second-route",
    );
  });

  it("indexes a partless twin by motor id without blocking part routes", () => {
    const catalog = buildCanonicalMotorRouteCatalog({
      twins: [
        {
          filename: "partless-route.md",
          markdown: [
            "---",
            "motor_id: MOTOR-PARTLESS",
            "slug: partless-route",
            "---",
          ].join("\n"),
        },
      ],
      requiredCanonicalRoutes: new Map([
        ["1A00001", "known-canonical-route"],
      ]),
    });

    expect(catalog.byPartNumber).toEqual(
      new Map([["1A00001", "known-canonical-route"]]),
    );
    expect(catalog.byId).toEqual(
      new Map([["motor-partless", "partless-route"]]),
    );
  });

  it("recovers a partless API twin route during a later API outage", () => {
    const catalog = buildCanonicalMotorRouteCatalog({
      twins: [
        {
          filename: "api-generated-partless-route.md",
          markdown: [
            "---",
            "motor_id: MOTOR-PARTLESS",
            "slug: api-generated-partless-route",
            "---",
          ].join("\n"),
        },
      ],
    });

    const result = mergeMotorRouteSources({
      supabaseMotors: [
        {
          id: "motor-partless",
          model_key: "LEGACY_PARTLESS_ROUTE",
          model_number: null,
        },
      ],
      apiMotors: [],
      canonicalRoutesByPartNumber: catalog.byPartNumber,
      canonicalRoutesById: catalog.byId,
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: "motor-partless",
        model_key: "api-generated-partless-route",
      }),
    ]);
  });

  it("recovers a canonical route before dropping a null Supabase legacy key", () => {
    const catalog = buildCanonicalMotorRouteCatalog({
      twins: [
        {
          filename: "api-generated-null-key-route.md",
          markdown: [
            "---",
            "motor_id: motor-null-key",
            "slug: api-generated-null-key-route",
            "---",
          ].join("\n"),
        },
      ],
    });

    const result = mergeMotorRouteSources({
      supabaseMotors: [
        {
          id: "motor-null-key",
          model_key: null,
          model_number: null,
        },
      ],
      apiMotors: [],
      canonicalRoutesByPartNumber: catalog.byPartNumber,
      canonicalRoutesById: catalog.byId,
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: "motor-null-key",
        model_key: "api-generated-null-key-route",
      }),
    ]);
  });

  it("deduplicates API and Supabase slugs by normalized part number", () => {
    const result = mergeMotorRouteSources({
      supabaseMotors: [
        {
          id: "motor-1",
          model_key: "FS_9.9_EXLHPT_PK",
          model_number: " 1a10461lk ",
        },
      ],
      apiMotors: [
        {
          id: "motor-1",
          model_key:
            "fourstroke-9-9hp-9-9exlhpt-command-thrust-prokicker-efi-fourstroke",
          model_number: "1A10461LK",
          model_display: "9.9EXLHPT Command Thrust ProKicker EFI FourStroke",
        },
      ],
    });

    expect(result).toEqual([
      expect.objectContaining({
        model_key:
          "fourstroke-9-9hp-9-9exlhpt-command-thrust-prokicker-efi-fourstroke",
        model_number: "1A10461LK",
      }),
    ]);
  });

  it("keeps required public routes authoritative after source merging", () => {
    const result = mergeMotorRouteSources({
      canonicalMotors: [
        {
          id: "motor-25",
          model_key: "fourstroke-25hp-25-elpt-fourstroke",
          model_number: "1A25413BK",
        },
      ],
      supabaseMotors: [
        {
          id: "motor-25",
          model_key: "FS_25_ELPT",
          model_number: "1A25413BK",
        },
      ],
      apiMotors: [
        {
          id: "motor-25",
          model_key: "temporary-upstream-slug",
          model_number: "1A25413BK",
        },
      ],
      canonicalRoutesByPartNumber: new Map([
        ["1A25413BK", "fourstroke-25hp-25-elpt-fourstroke"],
      ]),
    });

    expect(result).toHaveLength(1);
    expect(result[0].model_key).toBe(
      "fourstroke-25hp-25-elpt-fourstroke",
    );
  });

  it("prefers a part-number route when a motor also matches an id route", () => {
    const result = mergeMotorRouteSources({
      supabaseMotors: [
        {
          id: "motor-both",
          model_key: "legacy-route",
          model_number: "1A00001",
        },
      ],
      canonicalRoutesByPartNumber: new Map([
        ["1A00001", "part-number-route"],
      ]),
      canonicalRoutesById: new Map([
        ["motor-both", "id-route"],
      ]),
    });

    expect(result[0].model_key).toBe("part-number-route");
  });

  it("canonicalizes a Supabase-only fallback to its checked-in public route", () => {
    const result = mergeMotorRouteSources({
      supabaseMotors: [
        {
          id: "motor-9-9",
          model_key: "FS_9.9_EXLHPT_PK",
          model_number: "1A10461LK",
        },
      ],
      canonicalRoutesByPartNumber: new Map([
        [
          "1A10461LK",
          "fourstroke-9-9hp-9-9exlhpt-command-thrust-prokicker-efi-fourstroke",
        ],
      ]),
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: "motor-9-9",
        model_key:
          "fourstroke-9-9hp-9-9exlhpt-command-thrust-prokicker-efi-fourstroke",
      }),
    ]);
  });

  it("does not collapse distinct 60 HP products", () => {
    const result = mergeMotorRouteSources({
      apiMotors: [
        {
          id: "standard-60",
          model_key: "fourstroke-60hp-60-elpt-fourstroke",
          model_number: "1F60413GZ",
        },
        {
          id: "command-thrust-60",
          model_key: "fourstroke-60hp-60-elpt-command-thrust-fourstroke",
          model_number: "1F60453GZ",
        },
      ],
    });

    expect(result.map((motor) => motor.model_key)).toEqual([
      "fourstroke-60hp-60-elpt-fourstroke",
      "fourstroke-60hp-60-elpt-command-thrust-fourstroke",
    ]);
  });

  it("pins the corrected 60 EXLPT part to its permanent public route", () => {
    const result = mergeMotorRouteSources({
      apiMotors: [
        {
          id: "command-thrust-60-exlpt",
          model_key:
            "fourstroke-60hp-60-exlpt-command-thrust-fourstroke",
          model_number: "1F60463GZ",
          model_display: "60 EXLPT Command Thrust FourStroke",
        },
      ],
    });

    expect(result[0].model_display).toBe(
      "60 EXLPT Command Thrust FourStroke",
    );
    expect(result[0].model_key).toBe(
      "fourstroke-60hp-60-exlpt-fourstroke",
    );
  });

  it("does not alter unrelated motor presentation or identity", () => {
    const motor = {
      id: "standard-60-elpt",
      model_key: "fourstroke-60hp-60-elpt-fourstroke",
      model_number: "1F60413GZ",
      model_display: "60 ELPT FourStroke",
    };

    expect(applyMotorPresentationOverrides(motor)).toBe(motor);
    expect(motorIdentity(applyMotorPresentationOverrides(motor))).toBe(
      "part:1F60413GZ",
    );
  });

  it("falls back to normalized id and then route key when a part number is absent", () => {
    expect(motorIdentity({ id: "ABC", model_key: "first" })).toBe("id:abc");
    expect(motorIdentity({ model_key: "FS_5_MH" })).toBe("key:fs_5_mh");
  });

  it("preserves API priority when an identity overwrite collides on a route", () => {
    const result = mergeMotorRouteSources({
      canonicalMotors: [
        {
          id: "canonical-api-identity",
          model_key: "shared-route",
          model_number: "1A00001",
          model_display: "Canonical fallback",
        },
      ],
      supabaseMotors: [
        {
          id: "different-supabase-identity",
          model_key: "shared-route",
          model_number: "1A00002",
          model_display: "Colliding Supabase record",
        },
      ],
      apiMotors: [
        {
          id: "canonical-api-identity",
          model_key: "SHARED-ROUTE",
          model_number: "1A00001",
          model_display: "API winner",
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: "canonical-api-identity",
        model_display: "API winner",
      }),
    );
  });
});
