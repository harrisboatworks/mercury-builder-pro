

# Enhance Options Page with Visual Galleries and Premium Mobile Experience

## Overview
Upgrade the Options page (Step 2) to display hero items like SmartCraft Connect Mobile and fuel tanks in a beautiful visual grid, while keeping maintenance kits in an efficient list format. Both layouts will support a "View Details" modal using the responsive Dialog/Drawer pattern.

---

## Mercury Product Data (From Official Pages)

### SmartCraft Connect Mobile
| Field | Value |
|-------|-------|
| Name | SmartCraft Connect Mobile |
| Part # | 8M0173128 |
| Price | $325 |
| Image | Mercury's official product image (will upload to Supabase Storage) |
| Description | Plug-and-play module that streams live engine performance data to your smartphone via Bluetooth |
| Features | Real-time engine monitoring, Fuel burn tracking, Battery voltage alerts, GPS range rings, Maintenance reminders, Works with iOS & Android |
| Compatibility | Mercury outboards 40hp+ (2004+), 25-30hp (2022+) |
| Category | electronics |
| Assignment | recommended (for all EFI motors 8hp+) |

### Maintenance Kits (From Mercury Canada Page)

**100-Hour Service Kits:**
| HP Range | Part # | Price | Contents |
|----------|--------|-------|----------|
| Under 25 HP | 8M0151469 | $95 | Oil filter, fuel filter, gear lube |
| 40-60 HP | 8M0232733 | $80 | Oil filter, fuel filter, gear lube |
| 75-115 HP (2.1L) | 8M0097854 | $55 | Spark plugs, fuel filter, gear lube |
| 150 HP | 8M0094232 | $65 | Filter kit, spark plugs |
| 175-225 HP V6 | 8M0149929 | $105 | Complete filter set |
| 250-300 HP V8 | 8M0149929 | $105 | Complete filter set |

**300-Hour Service Kits:**
| HP Range | Part # | Price | Contents |
|----------|--------|-------|----------|
| 40-60 HP | 8M0090559 | $340 | All 100-hr items + impeller, thermostat |
| 75-115 HP (2.1L) | 8M0097855 | $440 | Complete service package |
| 150 HP | 8M0094233 | $510 | Full 300-hr maintenance |
| 175-225 HP V6 | 8M0149930 | $500 | All filters + impeller + belt |
| 250-300 HP V8 | 8M0149931 | $700 | Premium complete kit |

**Oil Change Kits:**
| HP Range | Part # | Price | Oil Type |
|----------|--------|-------|----------|
| 40-60 HP | 8M0081916 | $90 | 25W-40 |
| 75-115 HP (2.1L) | 8M0107510 | $125 | 10W-30 Synthetic |
| 150 HP | 8M0188357 | $140 | 10W-30 Synthetic |
| 175-225 HP V6 | 8M0187621 | $180 | 10W-30 Synthetic |
| 250-300 HP V8 | 8M0187621 | $215 | 10W-30 Synthetic |

---

## UI Design

### Mobile Layout (< 768px)
```text
+----------------------------------------+
| RECOMMENDED ADD-ONS         Pre-selected|
+----------------------------------------+
| +------------------+ +------------------+
| | [SmartCraft img] | | [25L Tank img]   |
| |                  | |                  |
| | SmartCraft       | | 25L Fuel Tank    |
| | Connect Mobile   | | & Hose           |
| |      $325    [i] | |   $199.99    [i] |
| |    [checkmark]   | |    [checkmark]   |
| +------------------+ +------------------+
+----------------------------------------+
| MAINTENANCE OPTIONS                     |
+----------------------------------------+
| [check] 100-Hour Service Kit 2.1L  $55  |
|   Spark plugs, fuel filter   [Details]  |
+-----------------------------------------+
| [ ] 300-Hour Service Kit 2.1L    $440   |
|   Complete service package   [Details]  |
+-----------------------------------------+
| [ ] Oil Change Kit 2.1L          $125   |
|   10W-30 synthetic oil       [Details]  |
+-----------------------------------------+
```

### Desktop Layout (>= 768px)
```text
+------------------------------------------------------------------+
| RECOMMENDED ADD-ONS                              [Pre-selected]  |
+------------------------------------------------------------------+
|  +--------------------+  +--------------------+  +----------------+
|  | [SmartCraft Image] |  | [25L Tank Image]   |  | [12L Tank]    |
|  |                    |  |                    |  |               |
|  | SmartCraft Connect |  | 25L Fuel Tank      |  | 12L Fuel Tank |
|  | Mobile             |  | & Hose             |  | & Hose        |
|  |       $325     [i] |  |    $199.99     [i] |  |  $169.99  [i] |
|  |         [check]    |  |         [check]    |  |       [ ]     |
|  +--------------------+  +--------------------+  +----------------+
+------------------------------------------------------------------+
| MAINTENANCE OPTIONS                                               |
+------------------------------------------------------------------+
| [check] 100-Hour Service Kit 2.1L              $55    [Details]   |
| [ ] 300-Hour Service Kit 2.1L                 $440    [Details]   |
| [ ] Oil Change Kit 2.1L                       $125    [Details]   |
+------------------------------------------------------------------+
```

### Details Modal - Mobile (Slide-up Drawer)
```text
+----------------------------------------+
|  ═══════════════                       |  <- Drag handle
|                                        |
|  [     Product Image - Full Width     ]|
|                                        |
|  SmartCraft Connect Mobile             |
|  Part #: 8M0173128                     |
|                                        |
|  $325.00                               |
|  ────────────────────────────────────  |
|                                        |
|  Stream live engine data to your       |
|  smartphone via Bluetooth. Monitor     |
|  fuel burn, battery levels, and more.  |
|                                        |
|  [check] Real-time engine monitoring   |
|  [check] Fuel burn & range tracking    |
|  [check] Battery voltage alerts        |
|  [check] GPS range rings               |
|  [check] Maintenance reminders         |
|  [check] iOS & Android compatible      |
|                                        |
|  Compatible: 40hp+ (2004+)             |
|                                        |
|  [  Add to Quote  ] or [  Remove  ]    |
+----------------------------------------+
```

---

## Technical Implementation

### New Components

| File | Purpose |
|------|---------|
| `src/components/options/VisualOptionCard.tsx` | Premium visual grid card with 4:3 image, price badge, selection state, info button |
| `src/components/options/OptionDetailsModal.tsx` | Responsive Dialog/Drawer with full product details |

### VisualOptionCard Features
- **Grid layout**: 2 columns on mobile, 3 columns on desktop
- **4:3 aspect ratio** image container with lazy loading
- **Price badge** in top-right corner
- **Recommended badge** for pre-selected items (uses existing pattern from PackageCards)
- **Animated checkmark** on selection (Framer Motion spring animation)
- **Info icon** opens OptionDetailsModal
- **Haptic feedback** on selection using `useHapticFeedback` hook with `addedToQuote` pattern
- **Touch targets** minimum 44px

### OptionDetailsModal Features
- Uses `useIsMobile()` hook for responsive rendering
- **Desktop**: Centered `Dialog` (max-w-lg)
- **Mobile**: Bottom `Drawer` with drag handle
- Full-width product image
- Part number display
- Price with optional MSRP strikethrough
- Full description text
- Features list with checkmark icons
- "Add to Quote" / "Remove" CTA button

### Modified OptionsPage Logic
```text
Rendering Decision:
if (option.category in ['electronics', 'accessory'] AND option.image_url exists):
    render VisualOptionCard in grid section
else:
    render enhanced OptionCard in list section

Section Structure:
1. Required Items (list - existing OptionCard)
2. Battery Question (if electric start - existing)
3. Recommended Add-Ons
   - Visual Section (VisualOptionCard grid) for items with images
   - List Section (OptionCard) for items without images
4. Available Options
   - Same split: visual grid for items with images, list for others
5. Sticky Footer (unchanged)
```

### Enhanced OptionCard
Add "View Details" button to existing OptionCard that opens OptionDetailsModal:
```text
+-----------------------------------------------+
| [check] 100-Hour Service Kit 2.1L        $55  |
|   Spark plugs, fuel filter         [Details]  |
+-----------------------------------------------+
```

---

## Mobile-First Optimizations

| Optimization | Implementation |
|--------------|----------------|
| 2-Column Grid | Visual cards use `grid-cols-2 md:grid-cols-3` |
| Large Touch Targets | Entire card clickable, min 44px interactive areas |
| Bottom Sheet | Drawer slides up from bottom for details |
| Haptic Feedback | `addedToQuote` pattern when selecting options |
| No Hover on Mobile | Use `@media (hover: hover)` for desktop hover states |
| Smooth Animations | `whileTap={{ scale: 0.98 }}` for satisfying feedback |

---

## Database Migrations

### 1. Insert Products into `motor_options` Table

**17 new products:**
- 1 SmartCraft Connect Mobile (electronics)
- 6 100-Hour Service Kits (maintenance)
- 5 300-Hour Service Kits (maintenance)
- 5 Oil Change Kits (maintenance)

Each product includes:
- name, description, short_description
- part_number, base_price, category
- image_url (for SmartCraft; service kits can use Mercury's kit images or placeholder)
- features array (e.g., ["Spark plugs", "Fuel filter", "Gear lube"])
- is_taxable: true, is_active: true

### 2. Create Rules in `motor_option_rules` Table

**17 HP-based rules:**

| Product | Condition | Assignment |
|---------|-----------|------------|
| SmartCraft Connect Mobile | hp_min: 8 | recommended |
| 100-Hour Kit (Under 25HP) | hp_min: 8, hp_max: 24 | available |
| 100-Hour Kit (40-60HP) | hp_min: 40, hp_max: 60 | available |
| 100-Hour Kit (75-115HP) | hp_min: 75, hp_max: 115 | available |
| 100-Hour Kit (150HP) | hp_min: 150, hp_max: 150 | available |
| 100-Hour Kit (175-225HP) | hp_min: 175, hp_max: 225 | available |
| 100-Hour Kit (250-300HP) | hp_min: 250, hp_max: 300 | available |
| ... (same pattern for 300-Hour and Oil Change kits) |

---

## File Summary

### New Files
| File | Purpose |
|------|---------|
| `src/components/options/VisualOptionCard.tsx` | Premium visual card with image and animations |
| `src/components/options/OptionDetailsModal.tsx` | Responsive product details modal |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/quote/OptionsPage.tsx` | Split rendering by category, add modal state, integrate new components |
| `src/hooks/useHapticFeedback.ts` | Add `optionSelected` pattern (optional) |

### Database Changes
| Table | Action |
|-------|--------|
| `motor_options` | Insert 17 new Mercury products |
| `motor_option_rules` | Insert 17 HP-based filtering rules |

---

## Image Assets Needed

| Product | Source | Action |
|---------|--------|--------|
| SmartCraft Connect Mobile | Mercury website image | Upload to Supabase Storage |
| Service Kits | Mercury maintenance page | Upload 1-2 generic kit images for categories |
| Fuel Tanks | Already in database | No action needed |

---

## Summary

**Frontend:**
1. Create `VisualOptionCard` - premium 2/3-column visual grid with images, haptic feedback, animations
2. Create `OptionDetailsModal` - responsive Dialog/Drawer for full product info
3. Update `OptionsPage` to render visual cards for electronics/accessories with images, list for maintenance
4. Add "View Details" button to existing `OptionCard` for maintenance items

**Database:**
1. Insert 17 Mercury products (SmartCraft + service kits + oil kits)
2. Create 17 HP-based rules for automatic filtering
3. SmartCraft as "recommended", maintenance as "available"

**Result:**
- SmartCraft Connect Mobile and fuel tanks display as beautiful visual cards
- Maintenance kits stay in efficient list format with "View Details" option
- Premium mobile experience with 2-column grid, bottom sheets, and haptic feedback
- Customers see only relevant products based on their motor's HP

