
# Fix Admin PDF to Match Customer Quote PDF

## Problem Identified

Comparing the two PDFs reveals the admin-generated version is missing key content:

| Element | Customer PDF | Admin PDF |
|---------|-------------|-----------|
| Dealer Discount | -$508.00 (motor's built-in savings) | -$700.00 (using admin discount incorrectly) |
| Promo Rebate Line | "Mercury GET 7 + $250 Rebate" line | Missing |
| Accessories Section | Shows "Clamp-On Installation $0.00" | Missing (empty array not being used) |
| Header Monthly Payment | "$4,262.36 or $113/month*" | Just total price |
| GET 7 Promo Box | Full callout with 7-Year warranty | Missing |
| Financing Section | "$113/month over 48 months at 8.99% APR" | Missing |

## Root Cause

The admin's `handleDownloadPDF` function is misinterpreting the saved `quote_data`:

1. **Wrong discount source**: Using `q.admin_discount` as dealer discount, but should use motor's `savings` field
2. **Missing promo value**: Not extracting `selectedPromoValue` correctly for the rebate amount
3. **Empty accessories**: Accessories array exists but may not be rendering
4. **Missing financing data**: Monthly payment exists in `qd.financing` but not being extracted properly

## Data Available in quote_data

The saved quote has all the necessary data:
- `motor.savings`: $508 (dealer discount)
- `adminDiscount`: $700 (special admin discount - separate line)
- `selectedPromoOption`: "cash_rebate"
- `selectedPromoValue`: "$250 rebate"
- `financing.rate`: 7.99
- `financing.term`: 48
- `purchasePath`: "loose" (affects accessories)
- `tradeInInfo.estimatedValue`: $1550

---

## Implementation

### Fix AdminQuoteDetail.tsx `handleDownloadPDF`

Rewrite the data extraction to properly map all fields:

```typescript
const handleDownloadPDF = async () => {
  // ... existing validation ...
  
  const qd = q.quote_data;
  const motor = qd.motor || {};
  
  // Motor pricing - use motor's built-in savings as dealer discount
  const motorMSRP = motor.msrp || motor.originalPrice || q.base_price || 0;
  const motorSavings = motor.savings || 0;  // Built-in dealer discount
  const adminDiscount = q.admin_discount || qd.adminDiscount || 0;  // Admin's special discount
  
  // Promo rebate - parse the selectedPromoValue (e.g., "$250 rebate" -> 250)
  const promoValueStr = qd.selectedPromoValue || '';
  const promoValue = parseInt(promoValueStr.replace(/[^0-9]/g, '')) || 0;
  
  // Motor subtotal after all discounts
  const motorSubtotal = motorMSRP - motorSavings - adminDiscount - promoValue;
  
  // Accessories - handle loose motor path
  let accessoryBreakdown = qd.accessoryBreakdown || qd.selectedOptions || [];
  
  // For loose motor path, add "Clamp-On Installation" if empty
  if (qd.purchasePath === 'loose' && accessoryBreakdown.length === 0) {
    accessoryBreakdown = [{
      name: 'Clamp-On Installation',
      price: 0,
      description: 'DIY-friendly mounting system (no installation labor required)'
    }];
  }
  
  // Calculate totals
  const accessoriesTotal = accessoryBreakdown.reduce((sum, a) => sum + (a.price || 0), 0);
  const tradeInValue = qd.tradeInInfo?.hasTradeIn ? 
    (q.tradein_value_final || qd.tradeInInfo?.estimatedValue || 0) : 0;
  const subtotalBeforeTax = motorSubtotal + accessoriesTotal - tradeInValue;
  const taxAmount = subtotalBeforeTax * 0.13;
  const totalPrice = subtotalBeforeTax + taxAmount;
  
  // Financing info - extract from qd.financing object
  const financing = qd.financing || {};
  const financingTerm = financing.term || q.term_months || 48;
  const financingRate = financing.rate || 7.99;
  const monthlyPayment = q.monthly_payment || qd.monthlyPayment || 
    Math.round(totalPrice / financingTerm);
  
  // Build PDF data with correct structure
  const pdfData = {
    quoteNumber: `HBW-${q.id.slice(0, 6).toUpperCase()}`,
    customerName: q.customer_name || 'Valued Customer',
    customerEmail: q.customer_email || '',
    customerPhone: q.customer_phone || '',
    motor: {
      model: motor.model || motor.display_name || 'Motor',
      hp: motor.hp || motor.horsepower || 0,
      msrp: motorMSRP,
      model_year: motor.year || 2025,
      category: motor.category || 'FourStroke'
    },
    selectedPackage: qd.selectedPackage ? {
      id: qd.selectedPackage.id || 'essential',
      label: qd.selectedPackage.label || 'Essential',
      coverageYears: qd.warrantyConfig?.totalYears || 7,
      features: qd.selectedPackage.features || []
    } : undefined,
    accessoryBreakdown,
    tradeInValue: tradeInValue > 0 ? tradeInValue : undefined,
    tradeInInfo: qd.tradeInInfo?.hasTradeIn ? {
      brand: qd.tradeInInfo.brand,
      year: qd.tradeInInfo.year,
      horsepower: qd.tradeInInfo.horsepower,
      model: qd.tradeInInfo.model
    } : undefined,
    includesInstallation: qd.purchasePath === 'installed',
    pricing: {
      msrp: motorMSRP,
      discount: motorSavings + adminDiscount,  // Combine dealer + admin discount
      promoValue: promoValue,
      motorSubtotal: motorSubtotal,
      subtotal: subtotalBeforeTax,
      hst: taxAmount,
      totalCashPrice: totalPrice,
      savings: motorSavings + adminDiscount + promoValue
    },
    monthlyPayment: monthlyPayment,
    financingTerm: financingTerm,
    financingRate: financingRate,
    selectedPromoOption: qd.selectedPromoOption,
    selectedPromoValue: qd.selectedPromoValue
  };
  
  const pdfUrl = await generateQuotePDF(pdfData);
  // ... rest of download logic
};
```

---

## Key Fixes Summary

| Issue | Fix |
|-------|-----|
| Wrong discount | Use `motor.savings` for dealer discount, `adminDiscount` separately |
| Missing promo line | Parse `selectedPromoValue` to get numeric promo value |
| Empty accessories | Generate default "Clamp-On" for loose motor path |
| Missing financing | Extract from `qd.financing` object |
| Missing monthly in header | Calculate or use saved `monthlyPayment` |

---

## Expected Result

After fix, admin PDF will show:
- Correct dealer discount from motor pricing
- Mercury GET 7 promo rebate as separate line
- Accessories section with installation info
- Monthly payment in price header
- GET 7 Promotion callout box
- Financing details section
