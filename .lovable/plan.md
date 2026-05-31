## Issue
On `/agents` (`src/pages/AgentsHub.tsx`), the `<pre>` code blocks use `bg-muted` which renders as a light cream background. The `<code>` text inside inherits a near-white color from a parent style, producing white-on-light text that's nearly unreadable (visible in the screenshot for the MCP `POST` URL and the `curl` example).

## Fix
Swap the code-block styling on every `<pre className="bg-muted ...">` in `AgentsHub.tsx` to a dark surface with light text using existing tokens:

- Replace `bg-muted` → `bg-repower-navy-900 text-repower-paper`
- Keep the `p-4 rounded text-sm/text-xs overflow-x-auto` utilities intact

This affects ~7 `<pre>` blocks (lines 184, 190, 226, 231, 278, 286, 306, 324). No other files touched, no token changes, no content changes.

## Verification
Reload `/agents` and confirm the API/MCP/curl code blocks now show light text on a dark navy background, consistent with the site's dark header.