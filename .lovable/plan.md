# Restyle Filter Motors sheet to cinematic dark theme

The "Filter Motors" drawer (HP grid, Availability, Start Type, Control, Shaft Length, Clear All / Done) currently uses the default light/muted shadcn palette. Restyle it to match the new Repower hero look used elsewhere on the site.

## Visual target

Pulled from the existing hero/RepowerLayout palette:

- Surface (sheet bg): `#050E1C` (deep navy)
- Text primary: `#F5F1EA` (cream)
- Text muted / section labels: `#F5F1EA / 55–70%`
- Hairlines / dividers: `#F5F1EA / 15%`
- Active chip: solid gold `#C9A24A`, dark text `#050E1C`
- Inactive chip: `#F5F1EA / 8%` bg, cream text, subtle hover `#F5F1EA / 14%`
- Disabled chip: `#F5F1EA / 4%` bg, `#F5F1EA / 30%` text
- "Popular" tag stays amber/gold but slightly brighter on dark
- Drag handle: `#F5F1EA / 25%`
- Done button: gold `#C9A24A` on navy text; Clear All: ghost outline in `#F5F1EA / 25%` border with cream text
- Reset all link / count badge: gold

## Files to change

1. `src/components/motors/ConfigFilterSheet.tsx` — the sheet shown in the screenshot.
2. `src/components/ui/mobile-filter-sheet.tsx` — older variant, restyle for parity in case it renders elsewhere.
3. (Optional, scoped override only) `src/components/ui/drawer.tsx` — only if we need to override the default `bg-background` on the `DrawerContent`. Preferred: pass `className` on the consumer side instead, so we don't affect every drawer in the app.

## Implementation details

In `ConfigFilterSheet.tsx`:

- `DrawerContent`: add `className="bg-[#050E1C] text-[#F5F1EA] border-t border-[#F5F1EA]/10"`. Override the built-in handle color via a child selector or by adding `[&>div:first-child]:bg-[#F5F1EA]/25`.
- `DrawerTitle`: `text-[#F5F1EA] font-display tracking-tight`.
- "Reset all" link: `text-[#C9A24A] hover:text-[#D9B868]`.
- Section headings (`Horsepower`, `Availability`, ...): `text-[#F5F1EA]/55 uppercase tracking-[0.16em] text-[11px]`.
- Dividers: replace `border-border` with `border-[#F5F1EA]/10`.
- HP pill (active): `bg-[#C9A24A] text-[#050E1C]`.
- HP pill (inactive, has stock): `bg-[#F5F1EA]/8 text-[#F5F1EA] hover:bg-[#F5F1EA]/14`.
- HP pill (disabled): `bg-[#F5F1EA]/[0.04] text-[#F5F1EA]/30`.
- "Popular" suffix: `text-[#C9A24A]` (replace `text-amber-600`).
- Update `FilterPill` with the same active / inactive token set; count text becomes `text-[#050E1C]/70` when active, `text-[#F5F1EA]/55` when inactive.
- `DrawerFooter`: add top border `border-t border-[#F5F1EA]/10 bg-[#050E1C]`.
- `Clear All` (outline): `border-[#F5F1EA]/25 text-[#F5F1EA] hover:bg-[#F5F1EA]/8 bg-transparent`.
- `Done` (primary): `bg-[#C9A24A] text-[#050E1C] hover:bg-[#D9B868]`.
- Trigger button (the gear icon on the toolbar) is outside the sheet — leave it alone unless the user calls it out.

In `mobile-filter-sheet.tsx`: apply the same token set to `DrawerContent`, labels, selects, and Apply/Clear buttons so the two sheets stay visually consistent.

## Out of scope

- Trigger button styling on the motor selection toolbar.
- Drawer overlay / scrim color (the default works on dark sheets).
- Other drawers in the app (settings, comparison, etc.) — we keep changes scoped to these two files.

## Acceptance check

After implementation, on `/quote/motor-selection` (mobile viewport) opening the filter sheet shows: navy sheet, cream headings, gold active chips matching the hero/CTA on `/`, and a gold "Done" button. The non-active HP chips read clearly against the navy background.
