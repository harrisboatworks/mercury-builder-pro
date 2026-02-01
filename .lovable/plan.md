
# Sync PDF Template with Quote Summary UI Updates

## Overview

Update `ProfessionalQuotePDF.tsx` to match the five refinements we made to the web UI in `PricingTable.tsx`.

---

## Changes

### 1. Remove Redundant Motor Name from MSRP

**File:** `src/components/quote-pdf/ProfessionalQuotePDF.tsx`  
**Line 613**

```tsx
// Before
<Text style={styles.pricingLabel}>MSRP - {quoteData.productName}</Text>

// After
<Text style={styles.pricingLabel}>MSRP</Text>
```

---

### 2. Personalize Discount Label

**Line 618**

```tsx
// Before
<Text style={styles.pricingLabel}>Dealer Discount</Text>

// After
<Text style={styles.pricingLabel}>Your Discount</Text>
```

---

### 3. Shorten Promo Labels

**Lines 633-641**

```tsx
// Before
<Text style={styles.pricingLabel}>
  {quoteData.selectedPromoOption === 'no_payments'
    ? 'Mercury GET 7 + 6 Mo No Payments'
    : quoteData.selectedPromoOption === 'special_financing'
    ? `Mercury GET 7 + ${quoteData.selectedPromoValue || '2.99%'} APR`
    : quoteData.selectedPromoOption === 'cash_rebate'
    ? `Mercury GET 7 + ${quoteData.selectedPromoValue || ''} Rebate`
    : 'Mercury GET 7 Promotion'}
</Text>

// After - two-line layout
<View style={{ flex: 1 }}>
  <Text style={styles.pricingLabel}>
    {quoteData.selectedPromoOption === 'no_payments'
      ? '7-Year Warranty + No Payments'
      : quoteData.selectedPromoOption === 'special_financing'
      ? `7-Year Warranty + ${quoteData.selectedPromoValue || '2.99%'} APR`
      : quoteData.selectedPromoOption === 'cash_rebate'
      ? `7-Year Warranty + ${quoteData.selectedPromoValue} Rebate`
      : 'Promotional Savings'}
  </Text>
  <Text style={{ fontSize: 7, color: colors.lightText, marginTop: 1 }}>
    Mercury GET 7 Promotion
  </Text>
</View>
```

---

### 4. Trade-In on Two Lines

**Lines 5-13 and 684-689**

Update the helper function and rendering:

```tsx
// Lines 5-13: Simplify formatTradeInLabel to just return the label
function formatTradeInLabel(): string {
  return "Estimated Trade Value";
}

// Add new helper for description
function formatTradeInDescription(tradeInInfo?: { brand: string; year: number; horsepower: number; model?: string }): string {
  if (!tradeInInfo) return "";
  const { brand, year, horsepower, model } = tradeInInfo;
  const parts = [year.toString(), brand, `${horsepower} HP`];
  if (model) parts.push(model);
  return parts.join(' ');
}

// Lines 684-689: Update the trade-in row
<View style={styles.pricingRow}>
  <View style={{ flex: 1 }}>
    <Text style={styles.pricingLabel}>Estimated Trade Value</Text>
    <Text style={{ fontSize: 7, color: colors.lightText, marginTop: 1 }}>
      {formatTradeInDescription(quoteData.tradeInInfo)}
    </Text>
  </View>
  <Text style={[styles.pricingValue, styles.discountValue]}>
    -${quoteData.tradeInValue.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </Text>
</View>
```

---

### 5. Consolidate Footer Terms

**Lines 871-886**

```tsx
// Before - multiple separate bullets
<View style={styles.termsSection}>
  <Text style={styles.termsText}>
    • This quote is valid for 30 days from date of issue • Prices subject to change without notice after expiry
  </Text>
  <Text style={styles.termsText}>
    • {quoteData.includesInstallation ? 'Installation and PDI included • ' : ''}All prices in Canadian dollars
  </Text>
  {quoteData.tradeInValue && quoteData.tradeInValue > 0 && (
    <Text style={styles.termsText}>
      • *Estimated trade values subject to physical inspection
    </Text>
  )}
  ...
</View>

// After - consolidated with clearer language
<View style={styles.termsSection}>
  <Text style={styles.termsText}>
    • This quote is valid for 30 days from date of issue • Prices subject to change without notice after expiry
  </Text>
  <Text style={styles.termsText}>
    • All prices in Canadian dollars • Installation, rigging, and trade-in values subject to inspection and verification
  </Text>
  <Text style={styles.termsText}>
    • Financing options available subject to credit approval • Ask your sales representative for details
  </Text>
</View>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/quote-pdf/ProfessionalQuotePDF.tsx` | 1. Remove motor name from MSRP line<br>2. "Dealer Discount" to "Your Discount"<br>3. Shorten promo labels with description line<br>4. Trade-in motor info on second line<br>5. Consolidate footer terms |

---

## Summary

These changes ensure the PDF output matches the polished quote summary UI:

- Cleaner MSRP label without redundant motor name
- Personalized "Your Discount" wording
- Shorter promo labels with "Mercury GET 7 Promotion" as subtitle
- Trade-in motor details on dedicated second line (no awkward wrapping)
- Consolidated footer disclaimer matching the web UI
