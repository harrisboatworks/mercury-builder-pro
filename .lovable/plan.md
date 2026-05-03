## Fix Hero Eyebrow Wrapping on Mobile

The line "Mercury Repower · Rice Lake · Since 1947" is wrapping on mobile because of the long text + heavy letter-spacing (`tracking-[0.24em]`).

### Fix in `src/components/repower/HeroRepower.tsx`

Shorten on mobile, keep full version on `sm:` and up:

- Mobile (`< 640px`): **"Mercury Repower · Since 1947"** — drops "Rice Lake" (it's already in the H1/sub-copy nearby and reinforced in the trust strip).
- Tablet/desktop: full **"Mercury Repower · Rice Lake · Since 1947"**.
- Also tighten mobile tracking (`tracking-[0.18em]`) and drop a hair of font size (`text-[10px] sm:text-xs`) for headroom.
- Add `whitespace-nowrap` so it never breaks awkwardly mid-phrase.

### Files
- `src/components/repower/HeroRepower.tsx` (one element)
