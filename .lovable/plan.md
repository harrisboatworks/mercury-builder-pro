

# Clean Up Hamburger Menu - Remove Redundant CTAs

## The Problem

The hamburger menu currently has a "Quick Actions" section with:
- A giant "Call (905) 342-2153" button
- A "Request a Quote" button

This is redundant because:
1. This **is** the quote building site - users are already building quotes!
2. The **UnifiedMobileBar** already provides Call/Text/Email options in its drawer
3. The phone number appears again in the **Location Footer** section at the bottom of the menu
4. "Contact Us" is already in the navigation links

## Proposed Changes

Remove the entire "Quick Actions" section (lines 42-59) from the hamburger menu.

### Before
```
┌─────────────────────────────────┐
│ [Harris Logo]              [X] │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 📞 Call (905) 342-2153      │ │  ← REMOVE
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 💬 Request a Quote          │ │  ← REMOVE
│ └─────────────────────────────┘ │
│                                 │
│ Navigation                      │
│ • Engines                       │
│ • Promotions                    │
│ ...                             │
└─────────────────────────────────┘
```

### After
```
┌─────────────────────────────────┐
│ [Harris Logo]              [X] │
├─────────────────────────────────┤
│ [XP Badge - if user has XP]    │
│                                 │
│ Navigation                      │
│ • Engines                       │
│ • Promotions                    │
│ • Repower                       │
│ • Compare Engines               │
│ • Financing                     │
│ • Blog                          │
│ • About Us                      │
│ • Contact Us   ← Still here    │
│                                 │
│ Dealer Credentials              │
│ [CSI Award] [Certified Repower] │
│                                 │
│ Account                         │
│ ...                             │
│                                 │
│ Harris Boat Works               │
│ 5369 Harris Boat Works Rd...    │
│ Mercury Premier Dealer          │
└─────────────────────────────────┘
```

## Implementation

### File to Modify
`src/components/ui/hamburger-menu.tsx`

### Changes
1. Remove the "Quick Actions" section (lines 42-59)
2. Remove the `Phone` and `MessageSquare` icon imports (no longer needed)

### Code Change

Delete this section:
```tsx
{/* Quick Actions */}
<div className="space-y-3">
  <a 
    href="tel:+19053422153" 
    className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
  >
    <Phone className="w-5 h-5" />
    Call (905) 342-2153
  </a>
  <Link 
    to="/contact" 
    onClick={onClose}
    className="flex items-center justify-center gap-2 border border-border py-3 rounded-lg font-medium hover:bg-muted transition-colors"
  >
    <MessageSquare className="w-5 h-5" />
    Request a Quote
  </Link>
</div>
```

Update imports from:
```tsx
import { X, Sparkles, User, Phone, MessageSquare, FileText } from "lucide-react";
```

To:
```tsx
import { X, Sparkles, User, FileText } from "lucide-react";
```

## Result

A cleaner, more focused hamburger menu that:
- Prioritizes navigation (what users actually need from a menu)
- Removes redundant contact CTAs that are available elsewhere
- Keeps the menu shorter and easier to scan
- Still provides contact via "Contact Us" nav link and footer info

