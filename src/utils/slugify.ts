/**
 * Converts a string to a URL-safe slug/anchor ID
 * Used for generating anchor links in blog articles
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-')   // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
}

/**
 * Extracts headers (H2 and H3) from markdown content
 * Returns an array of header objects with id, text, and level
 */
export interface TOCItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export function extractHeaders(content: string): TOCItem[] {
  const headers: TOCItem[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('### ')) {
      const text = line.slice(4).trim();
      headers.push({
        id: slugify(text),
        text,
        level: 3,
      });
    } else if (line.startsWith('## ')) {
      const text = line.slice(3).trim();
      headers.push({
        id: slugify(text),
        text,
        level: 2,
      });
    }
  }

  return headers;
}
