import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("repower-guide and blog subscribe input validation", () => {
  it("returns 400 for missing or malformed send-repower-guide-email input instead of throwing into 500", () => {
    const source = read("supabase/functions/send-repower-guide-email/index.ts");

    expect(source).toMatch(
      /await req\.json\(\);[\s\S]*?Request body must be valid JSON[\s\S]{0,220}status:\s*400/,
    );
    expect(source).toMatch(
      /if\s*\(\s*!email\s*\)\s*\{[\s\S]*?JSON\.stringify\(\{\s*error:\s*"Email is required"\s*\}\)[\s\S]*?status:\s*400/,
    );
    expect(source).not.toContain('throw new Error("Email is required")');
  });

  it("returns 400 for malformed subscribe-blog JSON instead of throwing into 500", () => {
    const source = read("supabase/functions/subscribe-blog/index.ts");

    expect(source).toMatch(
      /await req\.json\(\);[\s\S]*?Request body must be valid JSON[\s\S]{0,220}status:\s*400/,
    );
    expect(source).toContain("Valid email address is required");
  });
});
