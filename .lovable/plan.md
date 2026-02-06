

# Fix Deposit Refund Language Across the Site

## The Problem

The current wording in multiple places says deposits are "fully refundable" with "no restocking fees or penalties." For in-stock motors this may be fine, but for **special-order motors** (which Mercury builds or ships specifically for the customer), a no-strings refund policy defeats the purpose of the deposit. If someone special-orders a 400HP Verado and cancels, the dealership is stuck with a motor they may not normally stock.

## Updated Policy Language

The deposit language will be updated to distinguish between in-stock and special-order scenarios, while still being transparent and buyer-friendly:

**In-stock motors**: Deposits are fully refundable before pickup.
**Special-order motors**: Deposits may be non-refundable once the order is placed with Mercury, as these motors are ordered specifically for the customer.

## Files to Update (4 locations)

### 1. `src/data/faqData.ts` (line 221-222)

**Current**: "Yes, all deposits are fully refundable if you change your mind. There are no restocking fees or penalties."

**Updated**: Rewrite to explain the distinction clearly:
- Deposits on **in-stock motors** are fully refundable if you change your mind before pickup
- Deposits on **special-order motors** may be non-refundable once the order has been placed with Mercury, as these units are ordered specifically for you
- We'll always confirm whether a motor is in-stock or special-order before you place your deposit
- Payment methods line stays the same (Apple Pay, Google Pay, etc.)

### 2. `src/components/quote-builder/StickySummary.tsx` (line 214)

**Current button text**: "Reserve with $X refundable deposit"

**Updated**: Change to "Reserve with $X deposit" -- dropping the word "refundable" from the button label. The deposit details and refund terms are explained on the summary page and FAQ; the button doesn't need to make a blanket promise.

### 3. `src/components/quote-builder/QuoteDisplay.tsx` (line 679)

**Current subtext**: "Secure your motor with a refundable deposit - Balance due on delivery"

**Updated**: Change to "Secure your motor with a deposit -- Balance due on delivery" -- same reasoning, removing the blanket "refundable" claim from the deposit selector.

### 4. `src/components/seo/GlobalSEO.tsx` (line 200)

**Current schema text**: "You can reserve any Mercury motor with a refundable deposit..."

**Updated**: Change to "You can reserve any Mercury motor with a deposit through our online quote builder. Deposit amounts are based on horsepower: $200 for motors 0-25HP, $500 for 30-115HP, and $1,000 for 150HP and up. The deposit locks in your price and holds the motor until pickup. Deposits on in-stock motors are fully refundable before pickup."

This keeps the structured data accurate without blanket refund claims for special orders.

## Summary of Changes

All four updates follow the same principle: **remove blanket "fully refundable" language and replace with nuanced, honest wording that distinguishes in-stock from special-order situations.** This protects the business while still being transparent and buyer-friendly -- which actually builds more trust than an overly generous promise that might need to be walked back later.

