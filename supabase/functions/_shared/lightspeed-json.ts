// Lightspeed includes 64-bit IDs. JSON.parse alone rounds integers above 2^53-1.
// Match whole strings first so digits inside quoted text are never rewritten.
export function parseLightspeedJson(text: string): any {
  const lossless = text.replace(
    /"(?:\\.|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (token) => /^-?\d+$/.test(token) && !Number.isSafeInteger(Number(token))
      ? JSON.stringify(token)
      : token,
  );
  try {
    return JSON.parse(lossless);
  } catch {
    // Parser diagnostics can contain private source text.
    throw new Error("Invalid Lightspeed JSON");
  }
}
