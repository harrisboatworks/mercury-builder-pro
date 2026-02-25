

# Fix: Motors with NULL Availability Still Showing on Site

## Root Cause

The exclusion filter `!= 'Exclude'` does **not** filter out motors where `availability` is NULL. In both SQL and JavaScript, comparing NULL to any value returns NULL/falsy — so NULL rows slip through.

- **Database**: 111 motors have `availability = NULL`. Only 17 have `availability = 'In Stock'`.
- **No motors** are actually marked `'Exclude'` — the filter was correct but had nothing to catch.

## Fix: Show Only Motors With Explicit Availability

Per your preference, we will hide both NULL and 'Exclude' motors. This means only motors with a positive availability value (like "In Stock", "Available to Order") will appear.

### Changes

**1. `src/components/quote-builder/MotorSelection.tsx`** (client-side filter, ~line 434)

Change:
```typescript
const isExcluded = m.availability === 'Exclude';
```
To:
```typescript
const isExcluded = !m.availability || m.availability === 'Exclude';
```

**2. `src/pages/quote/MotorSelectionPage.tsx`** (client-side filter, ~line 358)

Change:
```typescript
motor.availability !== 'Exclude'
```
To:
```typescript
motor.availability && motor.availability !== 'Exclude'
```

**3. `src/components/chat/AICommandBar.tsx`** (database query, ~line 116)

Add a `.not('availability', 'is', null)` filter alongside the existing `.neq`:
```typescript
.neq('availability', 'Exclude')
.not('availability', 'is', null)
```

These three changes ensure that only motors with an explicitly set, non-excluded availability appear across all search and browse paths on the site.

