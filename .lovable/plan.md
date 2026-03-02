

## Plan: Replace Contact Button with Compact AI Chat Button

### What's happening now
- `ContactButton` renders a white floating circle at `bottom-4 right-4` (desktop only)
- `AIChatButton` renders a large pill-shaped button at `bottom-24 right-4` with text label — and is hidden on `/quote/` pages
- Two overlapping floating buttons on desktop, one of which (contact) isn't useful

### Changes

**1. Remove `ContactButton` from the app** (`src/App.tsx`)
- Remove the `<ContactButton />` component from the layout and its import
- Keep the `ContactModal` export in `contact-button.tsx` since it's used by `UnifiedMobileBar`

**2. Restyle `AIChatButton` as a compact circle** (`src/components/chat/AIChatButton.tsx`)
- Position at `bottom-4 right-4` (where contact button was)
- Make it a small round button (`h-12 w-12 rounded-full`) instead of the large pill with text
- Remove the text label — just show the icon with sparkle
- Remove the quote-page hiding logic so it's available everywhere on desktop
- Keep unread badge and loading indicator

### Files changed
- `src/App.tsx` — remove `ContactButton` import and usage
- `src/components/chat/AIChatButton.tsx` — compact circle style, position at bottom-4 right-4, show on all pages

