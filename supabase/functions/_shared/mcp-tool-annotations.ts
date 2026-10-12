/**
 * MCP tool annotations are client hints only. They are not authorization.
 * The server still rejects contact on build_quote and requires consent=true
 * before submit_quote_lead forwards a contact block.
 *
 * idempotentHint is set only when a repeated identical call has no additional
 * effect. Read-only tools omit it because the hint is defined for writes.
 * Lead submission and checkout writes are not idempotent.
 */

export type McpToolAnnotationKind = "read" | "write" | "destructive-write";

export function mcpToolAnnotations(kind: McpToolAnnotationKind) {
  if (kind === "read") {
    return {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    };
  }
  return {
    readOnlyHint: false,
    destructiveHint: kind === "destructive-write",
    idempotentHint: false,
    openWorldHint: false,
  };
}
