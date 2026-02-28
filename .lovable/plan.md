

## Problem

The Package Selection page appears washed out on iPhone. From the screenshot, the dark stone gradient background renders as a flat mid-gray, and text elements like "Back", subtitle text, and badges use low-contrast colors (`text-stone-300`, `text-stone-400`, `bg-white/10`). This violates the project's established contrast standards.

## Root Causes

1. **Page background**: `from-stone-900 via-stone-800 to-stone-900` — renders as flat gray on mobile Safari
2. **Header bar**: `bg-stone-900/80` with `text-stone-300` — low contrast
3. **Body text**: `text-stone-300` (subtitle), `text-stone-400` (hints) — too faint against stone-800/900
4. **Recommendation badge**: `bg-white/10` with `text-white` — nearly invisible on washed-out backgrounds
5. **Coverage badge**: `bg-emerald-500/20 border-emerald-500/30` with `text-emerald-300` — very faint
6. **Hint text**: `text-stone-300` and `text-stone-400` throughout — washed out
7. **PackageCards component**: Card text uses `text-gray-600` for subtitles and monthly pricing — adequate on white cards but could be stronger

## Plan

### 1. Fix PackageSelectionPage.tsx contrast

**Line 334**: Change page background to solid dark:
- `from-stone-900 via-stone-800 to-stone-900` → `from-stone-950 via-stone-900 to-stone-950`

**Line 336**: Header background stronger opacity:
- `bg-stone-900/80` → `bg-stone-950/95`

**Line 341**: Back button text:
- `text-stone-300` → `text-white`

**Line 370-371**: Coverage badge — increase opacity:
- `bg-emerald-500/20 border border-emerald-500/30` → `bg-emerald-500/30 border border-emerald-500/50`
- `text-emerald-300` → `text-emerald-200`

**Line 382**: Subtitle text:
- `text-stone-300` → `text-stone-200`

**Line 397**: Recommendation badge:
- `bg-white/10` → `bg-white/15`
- `border-white/20` → `border-white/30`

**Line 402**: Recommendation reason text:
- `text-stone-300` → `text-stone-200`

**Line 410**: HelpCircle icon:
- `text-stone-400` → `text-stone-300`

**Lines 467, 535, 543, 548, 561, 569**: Various secondary text:
- All `text-stone-300` → `text-stone-200`
- All `text-stone-400` → `text-stone-300`

**Line 584**: Disabled button text:
- `text-stone-400` → `text-stone-300`

### 2. Fix PackageCards.tsx card text contrast

**Line 161**: Package subtitle:
- `text-gray-600` → `text-gray-700`

**Line 171**: Monthly price context:
- `text-gray-600` → `text-gray-700`

**Line 200**: Coverage years:
- `text-gray-600` → `text-gray-700`

**Line 209**: Feature list text:
- `text-gray-700` — already good, no change needed

**Line 237**: "Tap to select" hint:
- `text-gray-500` → `text-gray-600`

These changes deepen the page background, brighten all text on dark surfaces, and strengthen badge backgrounds for better readability on iPhone screens in all lighting conditions.

