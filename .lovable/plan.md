# Pontoon HP sizing SVG: add the missing top tier

## 1. What the article says

**Alt text** (identical in `src/data/blogArticles.ts:24531` and the twin `public/blog/pontoon-hp-sizing-decision-tree-ontario.md:101`):

> Reference table of Mercury outboard HP for pontoons by length and use, from 25–40 HP (16–18 ft) to 300–400+ HP (26+ ft).

**Body tier list** (section "The Decision Tree: HP by Boat Length and Use Case", H3 headings + bold HP line):

| Body H3 | HP |
|---|---|
| 16-18 ft, 2 tubes, 4-6 passengers. Calm water cruise | Mercury 25-40 HP |
| 18-20 ft, 2 tubes, 4-6 passengers. Mixed cruise and fishing | Mercury 40-60 HP |
| 20-22 ft, 2 tubes, 6-8 passengers. Family cruise + tube pulling | Mercury 90-115 HP (Command Thrust recommended) |
| 22-24 ft, 2 tubes, 8-10 passengers. All-around family boat | Mercury 115-150 HP |
| 22-24 ft, 3 tubes (tritoon), 8-12 passengers. Watersports-capable | Mercury 200-250 HP |
| 24-26 ft tritoon, 10-12 passengers. Watersports and cruise speed | Mercury 250-300 HP |
| 26+ ft luxury tritoon. Performance-focused | Mercury 300-400+ HP |

## 2. What the SVG actually contains

`public/lovable-uploads/inline/pontoon-hp-sizing.svg`, 11,755 bytes, `viewBox="0 0 680 632"`, `width="100%"`, `role="img"` with `<title>` and `<desc>`.

Drawing method: a flat table. Header bar `#20384d` at y=160 h=38, then six 50px zebra rows (`#ffffff` / `#f1f2f3`) clipped to a rounded rect, column dividers at x=287 and x=467, hairline row rules. Three columns: length/use (left, x=88), Recommended HP (centred x=377, red `#c8102e`), Command Thrust (centred x=537). Fonts are a single system stack declared once in `<style>`; classes `.rb` 13px bold, `.rs` 11px, `.hp` 14.5px bold red, `.ct` 11.5px 600. Footer punchline at y=542 and a source line at y=576. Card rect is x=36 y=36 w=608 h=560.

Rows present today: 25 to 40, 40 to 60, 90 to 115, 115 to 150, **200 to 250 (22 to 24 ft tritoon)**, 250 to 300 (24 to 26 ft tritoon).

**Correction to the audit:** the 200-250 tritoon tier is already in the graphic (row at y=398-448). Only **one** tier is missing: **300 to 400+ HP, 26+ ft luxury tritoon**. The alt text promises it, the body has it, the SVG stops at 250-300.

Two further findings:

- **Embedded raster:** yes, one `<image>` at x=520 y=50, 88x62, a base64 PNG (192x134, single colour `#20384d`). It is the genuine Harris Boat Works badge logo, not a fake, and it carries place-specific text baked into the pixels: "SINCE 1947", "HARRIS BOAT WORKS", "Rice Lake, ON". Nothing fabricated, but flagging it since the task asked.
- **One em dash** in the graphic: `Worth it — 60 CT` (row 2, Command Thrust column). That violates the house rule.

No external refs, no webfonts, no other place-specific text beyond the logo and `mercuryrepower.ca` in the source line.

## 3. Proposed edit (smallest that works)

Add one row. Extend geometry by exactly 50px: `viewBox` 632 -> 682, background rect height 632 -> 682, card rect height 560 -> 610, clip rect height 338 -> 388, table border rect height 338 -> 388, column dividers y2 498 -> 548, and shift the punchline (y=542 -> 592) and source line (y=576 -> 626).

New row band, appended inside the `<g clip-path="url(#tbl)">` group after the last band:

```svg
<rect x="72" y="498" width="536" height="50" fill="#ffffff"/>
```

New row content, inserted after the `24 to 26 ft` block (before the punchline text):

```svg
<line x1="72" y1="498" x2="608" y2="498" stroke="#20384d" stroke-opacity="0.09" stroke-width="1"/>
<text class="rb" x="88" y="520.0">26+ ft luxury tritoon</text>
<text class="rs" x="88" y="536.0">Performance focused</text>
<text class="hp" x="377" y="528.0" text-anchor="middle">300 to 400+ HP</text>
<text class="ct" x="537" y="527.0" text-anchor="middle">Standard</text>
```

Labels come straight from the body H3 "26+ ft luxury tritoon. Performance-focused" and its "Mercury 300-400+ HP" line. Same classes, same x positions, same 50px rhythm, no new fonts, no em dashes, no external refs.

Two small text fixes in the same pass:

- `<desc>`: change "up to 250 to 300 HP on a 24 to 26 ft tritoon" to "up to 300 to 400+ HP on a 26+ ft luxury tritoon" so the accessible description matches the table and the alt text.
- Replace `Worth it — 60 CT` with `Worth it, 60 CT` to clear the em dash.

Nothing else changes: no pricing, no body copy, no alt text, no `dateModified`.

## 4. Blast radius

`grep` for `inline/pontoon-hp-sizing.svg` returns exactly two hits, both the same article: `src/data/blogArticles.ts:24531` and its generated twin `public/blog/pontoon-hp-sizing-decision-tree-ontario.md:101`. No other article embeds this graphic. The SVG also appears in `src/data/imageVariantsManifest.json` and image-budget tooling, so if a prebuild gate tracks byte size, the +~450 bytes should be re-checked (the file stays well under any sane budget).

## 5. Open question

Confirm the "Command Thrust" cell for the 26+ ft row should read "Standard" (matching the two tritoon rows above it, and consistent with the body's note that CT tops out at 115 HP). If you would rather it read "Not applicable", say so and I will use that instead.
