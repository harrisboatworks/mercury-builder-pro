/**
 * Strip markdown syntax from a string for use in plain-text contexts
 * (meta descriptions, OG tags, JSON-LD schema, page intros).
 *
 * Converts patterns like:
 *   "[/quote/motor-selection](/quote/motor-selection)"  -> "mercuryrepower.ca/quote/motor-selection"
 *   "[motor selection page](/quote/motor-selection)"    -> "motor selection page"
 *   "[request service](https://hbw.wiki/service)"       -> "request service"
 * Also strips bold/italic/code markers.
 */
export function stripMarkdown(input: string): string {
  if (!input) return '';
  let out = input;

  // Markdown links [label](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, url: string) => {
    const trimmedLabel = label.trim();
    const trimmedUrl = url.trim();
    // If the label is just the URL/path (e.g. "[/quote/motor-selection](/quote/motor-selection)"),
    // render a clean human-readable URL.
    if (trimmedLabel === trimmedUrl || trimmedLabel === trimmedUrl.replace(/^https?:\/\//, '')) {
      if (trimmedUrl.startsWith('/')) {
        return `mercuryrepower.ca${trimmedUrl}`;
      }
      return trimmedUrl.replace(/^https?:\/\//, '');
    }
    return trimmedLabel;
  });

  // Images ![alt](url) -> alt
  out = out.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Bold/italic/code
  out = out.replace(/\*\*(.+?)\*\*/g, '$1');
  out = out.replace(/\*(.+?)\*/g, '$1');
  out = out.replace(/`([^`]+)`/g, '$1');

  // Collapse whitespace
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}
