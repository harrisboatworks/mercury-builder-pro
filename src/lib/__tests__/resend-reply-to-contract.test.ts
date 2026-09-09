import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceFiles = (directory: string): string[] =>
  readdirSync(resolve(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });

const stripComments = (source: string): string =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");

const REPLY_TO_PROPERTY = /\breplyTo\s*:/;

describe("Resend SDK v2 reply_to contract", () => {
  it("treats replyTo only as a property key so an explanatory comment cannot trip the pin", () => {
    const commented = [
      "// replyTo is silently ignored by npm:resend@2.0.0",
      "/* replyTo: was the v3 SDK field */",
      'reply_to: "info@harrisboatworks.ca",',
    ].join("\n");

    expect(REPLY_TO_PROPERTY.test(stripComments(commented))).toBe(false);
    expect(REPLY_TO_PROPERTY.test(stripComments('replyTo: "info@harrisboatworks.ca",'))).toBe(true);
  });

  it("does not leave a replyTo property on any edge-function send payload", () => {
    const offenders = sourceFiles("supabase/functions")
      .filter((path) => path.endsWith(".ts"))
      .filter((path) => REPLY_TO_PROPERTY.test(stripComments(readFileSync(path, "utf8"))));

    expect(offenders).toEqual([]);
  });
});
