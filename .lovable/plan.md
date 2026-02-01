
# Fix 404 Error: Incorrect Motor Route Path

## The Problem

The `/quote/motor` route is causing 404 errors because it doesn't exist. The correct route is `/quote/motor-selection`.

The bug was introduced in redirect logic within the promo and package selection pages.

## Root Cause

Two files are navigating to `/quote/motor` instead of `/quote/motor-selection`:

| File | Line | Incorrect | Correct |
|------|------|-----------|---------|
| `PromoSelectionPage.tsx` | 139 | `/quote/motor` | `/quote/motor-selection` |
| `PackageSelectionPage.tsx` | 101 | `/quote/motor` | `/quote/motor-selection` |

## Fixes

### File 1: `src/pages/quote/PromoSelectionPage.tsx`

**Line 139** - Change:
```tsx
// Before
navigate('/quote/motor');

// After
navigate('/quote/motor-selection');
```

### File 2: `src/pages/quote/PackageSelectionPage.tsx`

**Line 101** - Change:
```tsx
// Before
navigate('/quote/motor');

// After
navigate('/quote/motor-selection');
```

## Summary

Simple two-line fix that corrects the redirect paths to use the proper route defined in `App.tsx`. After this fix, users will be correctly redirected to the motor selection page when they access promo or package selection without having a motor selected.
