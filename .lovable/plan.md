

# Fix: Revert Over-Aggressive Availability Filtering

## Problem

The previous fix went too far. It hid all motors with `NULL` availability, but those 111 motors are your normal catalog/brochure motors — they should absolutely be visible. Only motors you explicitly mark as `'Exclude'` in the admin panel should be hidden.

**Current database reality:**
- 111 motors have `availability = NULL` — these are normal motors, should be visible
- 17 motors have `availability = 'In Stock'` — should be visible
- 0 motors have `availability = 'Exclude'` — when you do mark one, it should be hidden

## Changes (revert the NULL filtering)

### 1. `src/components/quote-builder/MotorSelection.tsx` (line 434)

Revert back to only checking for `'Exclude'`:
```typescript
const isExcluded = m.availability === 'Exclude';
```

### 2. `src/pages/quote/MotorSelectionPage.tsx` (line 358)

Revert back to only filtering `'Exclude'`:
```typescript
motor.availability !== 'Exclude'
```

### 3. `src/components/chat/AICommandBar.tsx` (line 117)

Remove the `.not('availability', 'is', null)` line, keep only `.neq('availability', 'Exclude')`.

These three one-line reverts restore all normal motors to the site while still hiding any motor you explicitly mark as `'Exclude'` in the admin dashboard.

