// Shared helper for sanitizing agent-supplied free-text fields before they
// are persisted in the database (e.g. customer_quotes.notes). Defense against
// stored prompt-injection / content-poisoning when downstream consumers feed
// the value into an LLM context.
//
// Behavior:
//   - coerces to string (null/undefined/non-string → "")
//   - trims surrounding whitespace
//   - strips Unicode control characters (\p{C}) except \n
//   - collapses runs of whitespace to a single space (per line)
//   - hard-caps length to maxLen (default 200)
//   - prefixes "[agent-supplied] " so downstream readers can tell it's untrusted

export function sanitizeAgentNote(input: unknown, maxLen = 200): string {
  let s = "";
  if (typeof input === "string") s = input;
  else if (input == null) s = "";
  else {
    try { s = String(input); } catch { s = ""; }
  }

  // Strip control chars (Unicode category C) except newline.
  s = s.replace(/[\p{C}&&[^\n]]/gu, "");
  // Fallback for runtimes without character-class intersection: redo with explicit pattern.
  s = s.replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "");

  // Collapse whitespace on each line, then trim.
  s = s
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join(" ");
  s = s.trim();

  if (s.length > maxLen) s = s.slice(0, maxLen);

  return `[agent-supplied] ${s}`;
}
