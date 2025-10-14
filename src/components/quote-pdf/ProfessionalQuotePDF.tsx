import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { parseMercuryRigCodes } from '@/lib/mercury-codes';

// Import logos
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

// Print-optimized professional color scheme
const colors = {
  text: '#111827',           // Black text
  lightText: '#6b7280',      // Gray secondary text  
  discount: '#059669',       // GREEN for discounts (prints well in B&W)
  border: '#cccccc',         // Lighter gray borders (20%)
  tableBg: '#f3f4f6',        // 10% gray backgrounds
  infoBg: '#e5e7eb',         // 15% gray for customer info box
  white: '#ffffff'
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    padding: 12,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  
  // Header with logos
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottom: `1.5 solid ${colors.border}`,
  },
  
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  
  headerRight: {
    alignItems: 'flex-end',
  },
  
  quoteTitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 1,
  },
  
  dealerText: {
    fontSize: 9,
    color: colors.lightText,
  },
  
  // Main content in two columns
  mainContent: {
    flexDirection: 'row',
    gap: 18,
  },
  
  leftColumn: {
    flex: 1.2,
  },
  
  rightColumn: {
    flex: 1,
  },
  
  // Product section
  productSection: {
    marginBottom: 8,
  },
  
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  
  productDetails: {
    fontSize: 9,
    color: colors.lightText,
    marginBottom: 2,
  },
  
  // Hero pricing callout box
  heroBox: {
    border: `2 solid ${colors.discount}`,
    padding: 12,
    marginBottom: 18,
    backgroundColor: 'transparent',
  },
  
  heroSavings: {
    fontSize: 14,
    color: colors.discount,
    marginBottom: 4,
  },
  
  heroPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  
  heroMonthly: {
    fontSize: 12,
    color: colors.lightText,
  },
  
  // Pricing table
  pricingTableContainer: {
    border: `1 solid ${colors.border}`,
    padding: 8,
    marginBottom: 8,
  },
  
  pricingSection: {
    marginBottom: 18,
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  
  pricingHeader: {
    backgroundColor: colors.tableBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 4,
    marginBottom: 4,
  },
  
  pricingHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text,
  },
  
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottom: `0.5 solid ${colors.border}`,
  },
  
  pricingLabel: {
    fontSize: 9,
    color: colors.text,
  },
  
  pricingValue: {
    fontSize: 9,
    color: colors.text,
  },
  
  strikethrough: {
    textDecoration: 'line-through',
  },
  
  discountValue: {
    color: colors.discount,
  },
  
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 4,
    borderTop: `2 solid ${colors.text}`,
  },
  
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
  },
  
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
  },
  
  // Customer info box
  infoBox: {
    backgroundColor: colors.infoBg,
    border: `1 solid ${colors.border}`,
    padding: 6,
    marginBottom: 8,
  },
  
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  
  infoLabel: {
    fontSize: 9,
    color: colors.lightText,
    width: 80,
  },
  
  infoValue: {
    fontSize: 9,
    color: colors.text,
    flex: 1,
  },
  
  // Summary box in right column
  summaryBox: {
    padding: 8,
    border: `1 solid ${colors.border}`,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  
  // Financing callout box (outline style)
  financingBox: {
    padding: 8,
    border: `1 solid ${colors.border}`,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },

  // Large savings callout box (right column top)
  savingsCalloutBox: {
    border: `2 solid ${colors.border}`,
    padding: 10,
    backgroundColor: 'transparent',
    marginBottom: 8,
    textAlign: 'center',
  },

  savingsCalloutSavings: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.discount,
    marginBottom: 10,
  },

  savingsCalloutLabel: {
    fontSize: 11,
    color: colors.lightText,
    marginBottom: 4,
  },

  savingsCalloutPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },

  savingsCalloutMonthly: {
    fontSize: 18,
    color: colors.text,
    fontWeight: 'bold',
  },

  coverageTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  promoUrgency: {
    fontSize: 9,
    color: colors.lightText,
    fontStyle: 'italic',
    marginTop: 2,
  },
  
  summaryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  
  summaryItem: {
    fontSize: 9,
    color: colors.text,
    marginBottom: 2,
  },
  
  savingsText: {
    fontSize: 12,
    color: colors.discount,
    fontWeight: 'bold',
    marginTop: 6,
  },
  
  // Extended warranty section (not currently used)
  warrantySection: {
    marginTop: 10,
    padding: 8,
    backgroundColor: colors.tableBg,
    borderRadius: 4,
  },
  
  warrantyTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  
  warrantyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  
  warrantyText: {
    fontSize: 9,
    color: colors.text,
  },
  
  warrantyPrice: {
    fontSize: 9,
    color: colors.text,
    fontWeight: 'bold',
  },
  
  // Motor code breakdown info box
  motorCodeBox: {
    backgroundColor: colors.tableBg,
    border: `1 solid ${colors.border}`,
    padding: 6,
    marginTop: 8,
    marginBottom: 8,
  },

  motorCodeTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },

  motorCodeContent: {
    fontSize: 8,
    color: colors.lightText,
    lineHeight: 1.4,
  },

  motorCodeItem: {
    fontSize: 8,
    color: colors.lightText,
    marginBottom: 1,
  },
  
  // Terms section
  termsSection: {
    marginTop: 8,
    marginBottom: 80,
    paddingTop: 8,
    borderTop: `1 solid ${colors.border}`,
  },
  
  termsText: {
    fontSize: 8,
    color: colors.lightText,
    marginBottom: 2,
  },
  
  // Footer - absolute positioning to stick to bottom
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    paddingTop: 6,
    borderTop: `1 solid ${colors.border}`,
    textAlign: 'center',
  },
  
  footerText: {
    fontSize: 8,
    color: colors.lightText,
  },
});

export interface QuotePDFProps {
  quoteData: {
    quoteNumber: string | number;
    date: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerId?: string;
    productName: string;
    horsepower: string;
    category: string;
    modelYear: string | number;
    msrp: string;
    dealerDiscount: string;
    promoSavings: string;
    subtotal: string;
    tax: string;
    total: string;
    totalSavings: string;
    selectedPackage?: {
      id: string;
      label: string;
      coverageYears: number;
      features: string[];
    };
    warrantyTargets?: Array<{
      targetYears: number;
      oneTimePrice: number;
      monthlyDelta: number;
      label?: string;
    }>;
    monthlyPayment?: number;
    financingTerm?: number;
    financingRate?: number;
  };
}

export const ProfessionalQuotePDF: React.FC<QuotePDFProps> = ({ quoteData }) => {
  // Calculate valid until date (30 days from now)
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);
  const validUntilString = validUntil.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Generate motor code breakdown - decode each letter/number in the model code
  const generateMotorCodeBreakdown = (productName: string): Array<{ code: string; meaning: string }> => {
    const breakdown: Array<{ code: string; meaning: string }> = [];
    const upperName = productName.toUpperCase();
    
    // Extract the model code part (before family name like FourStroke, SeaPro, etc.)
    const codeMatch = productName.match(/^([\d.]+[A-Z]*)/i);
    const modelCode = codeMatch ? codeMatch[1].toUpperCase() : '';
    
    // 1. Extract HP from the number at the start
    const hpMatch = productName.match(/^(\d+\.?\d*)/);
    if (hpMatch) {
      breakdown.push({ code: hpMatch[1], meaning: `${hpMatch[1]} Horsepower` });
    }
    
    // Parse rigging codes for shaft inference
    const rigAttrs = parseMercuryRigCodes(productName);
    
    // 2. Manual vs Electric start (M or E)
    if (modelCode.includes('M') && !modelCode.includes('MH')) {
      breakdown.push({ code: 'M', meaning: 'Manual start' });
    } else if (modelCode.includes('E')) {
      breakdown.push({ code: 'E', meaning: 'Electric start' });
    }
    
    // 3. Control type - H (Tiller) or R (Remote)
    if (modelCode.includes('H')) {
      breakdown.push({ code: 'H', meaning: 'Tiller handle' });
    } else if (modelCode.includes('R')) {
      breakdown.push({ code: 'R', meaning: 'Remote control' });
    }
    
    // 4. Shaft length codes (L, XL, XXL)
    if (modelCode.includes('XXL')) {
      breakdown.push({ code: 'XXL', meaning: 'Extra extra long shaft (30")' });
    } else if (modelCode.includes('XL')) {
      breakdown.push({ code: 'XL', meaning: 'Extra long shaft (25")' });
    } else if (modelCode.includes('L') && !modelCode.includes('XL')) {
      breakdown.push({ code: 'L', meaning: 'Long shaft (20")' });
    } else {
      // No L in code = standard shaft
      breakdown.push({ code: '', meaning: `Standard ${rigAttrs.shaft_inches}" shaft` });
    }
    
    // 5. Power Trim (PT)
    if (modelCode.includes('PT') || upperName.includes('PT')) {
      breakdown.push({ code: 'PT', meaning: 'Power Trim & Tilt' });
    }
    
    // 6. Command Thrust (CT)
    if (modelCode.includes('CT') || upperName.includes('CT')) {
      breakdown.push({ code: 'CT', meaning: 'Command Thrust gearcase' });
    }
    
    // 7. EFI (Electronic Fuel Injection)
    if (upperName.includes('EFI')) {
      breakdown.push({ code: 'EFI', meaning: 'Electronic Fuel Injection' });
    }
    
    return breakdown;
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              src={harrisLogo} 
              style={{ 
                width: 80, 
                height: 40, 
                objectFit: 'contain', 
                objectPosition: 'center' 
              }} 
            />
            <Image 
              src={mercuryLogo} 
              style={{ 
                width: 100, 
                height: 35, 
                objectFit: 'contain', 
                objectPosition: 'center' 
              }} 
            />
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quoteTitle}>Your Mercury Motor Quote</Text>
            <Text style={styles.dealerText}>Mercury Marine Premier Dealer</Text>
          </View>
        </View>

        {/* Main Content - Two Columns */}
        <View style={styles.mainContent}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Product Information */}
            <View style={styles.productSection}>
              <Text style={styles.productName}>{quoteData.productName}</Text>
              <Text style={styles.productDetails}>• Quiet, low-vibration four-stroke performance</Text>
              <Text style={styles.productDetails}>• Excellent fuel economy & range</Text>
              <Text style={styles.productDetails}>• Factory-backed service at Harris Boat Works</Text>
            </View>

            {/* Motor Code Breakdown Box */}
            <View style={styles.motorCodeBox}>
              <Text style={styles.motorCodeTitle}>Motor Code Breakdown</Text>
              <Text style={styles.motorCodeContent}>
                {quoteData.productName}:
              </Text>
              {generateMotorCodeBreakdown(quoteData.productName).map((item, idx) => (
                <Text key={idx} style={styles.motorCodeItem}>
                  {item.code ? `• ${item.code} = ${item.meaning}` : `• ${item.meaning}`}
                </Text>
              ))}
            </View>

            {/* Pricing Breakdown */}
            <View style={styles.pricingTableContainer}>
              <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
              
              <View style={styles.pricingHeader}>
                <Text style={styles.pricingHeaderText}>Item</Text>
                <Text style={styles.pricingHeaderText}>Price</Text>
              </View>
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>MSRP - {quoteData.productName}</Text>
                <Text style={[styles.pricingValue, styles.strikethrough]}>${quoteData.msrp}</Text>
              </View>
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Dealer Discount</Text>
                <Text style={[styles.pricingValue, styles.discountValue]}>-${quoteData.dealerDiscount}</Text>
              </View>
              
              {parseFloat(quoteData.promoSavings) > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Promotional Savings</Text>
                  <Text style={[styles.pricingValue, styles.discountValue]}>-${quoteData.promoSavings}</Text>
                </View>
              )}
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Subtotal</Text>
                <Text style={styles.pricingValue}>${quoteData.subtotal}</Text>
              </View>
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>HST (13%)</Text>
                <Text style={styles.pricingValue}>${quoteData.tax}</Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Price</Text>
                <Text style={styles.totalValue}>${quoteData.total}</Text>
              </View>
            </View>

            {/* Total Savings Below Table */}
            <Text style={styles.savingsText}>
              Total savings of ${quoteData.totalSavings} vs MSRP
            </Text>
            {parseFloat(quoteData.promoSavings || '0') > 0 && (
              <Text style={styles.promoUrgency}>
                Limited time offer - expires {validUntilString}
              </Text>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* SAVINGS CALLOUT BOX - TOP */}
            <View style={styles.savingsCalloutBox}>
              <Text style={styles.savingsCalloutSavings}>
                YOU SAVE ${quoteData.totalSavings}
              </Text>
              <Text style={styles.savingsCalloutLabel}>Total Price</Text>
              <Text style={styles.savingsCalloutPrice}>
                ${quoteData.total}
              </Text>
              {quoteData.monthlyPayment && (
                <Text style={styles.savingsCalloutMonthly}>
                  or ${quoteData.monthlyPayment}/month*
                </Text>
              )}
            </View>

            {/* CUSTOMER INFO BOX */}
            <View style={styles.infoBox}>
              <Text style={styles.summaryTitle}>Customer Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{quoteData.customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{quoteData.customerEmail}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{quoteData.customerPhone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quote #:</Text>
                <Text style={styles.infoValue}>{quoteData.quoteNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>{quoteData.date}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valid Until:</Text>
                <Text style={styles.infoValue}>{validUntilString}</Text>
              </View>
            </View>

          {/* COVERAGE BOX */}
          <View style={styles.summaryBox}>
            <Text style={styles.coverageTitle}>
              {quoteData.selectedPackage?.label || 'COMPLETE COVERAGE'}
            </Text>
            <Text style={styles.summaryItem}>
              Coverage: {quoteData.selectedPackage?.coverageYears || 5} years total
            </Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.text, marginTop: 6, marginBottom: 4 }}>
                What's Included:
              </Text>
              <>
                <Text style={styles.summaryItem}>• 7-year comprehensive warranty coverage</Text>
                <Text style={styles.summaryItem}>• Mercury motor & all controls covered</Text>
                <Text style={styles.summaryItem}>• Installation hardware included</Text>
                <Text style={styles.summaryItem}>• Priority installation service</Text>
                <Text style={styles.summaryItem}>• Extended coverage ($350 value)</Text>
              </>
              
            {/* BONUS OFFER (if promo warranty exists) */}
            {quoteData.selectedPackage?.coverageYears && quoteData.selectedPackage.coverageYears > 3 && (
              <View style={{ marginTop: 8, paddingTop: 8, borderTop: `1.5 solid ${colors.border}` }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.text, marginBottom: 2 }}>
                  BONUS OFFER
                </Text>
                  <Text style={{ fontSize: 9, color: colors.text }}>
                    +2 Years Extended Warranty FREE
                  </Text>
                  <Text style={{ fontSize: 8, color: colors.lightText }}>
                    (Limited time offer)
                  </Text>
                </View>
              )}
            </View>

            {/* FINANCING BOX */}
            {quoteData.monthlyPayment && (
              <View style={styles.financingBox}>
                <Text style={styles.summaryTitle}>Monthly Financing Available</Text>
                <Text style={styles.summaryItem}>
                  Starting from ${quoteData.monthlyPayment}/mo
                </Text>
                <Text style={{ fontSize: 8, color: colors.lightText, marginTop: 2 }}>
                  OAC. Terms at checkout.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            • This quote is valid for 30 days from date of issue • Prices subject to change without notice after expiry
          </Text>
          <Text style={styles.termsText}>
            • Installation and PDI included where specified • All prices in Canadian dollars
          </Text>
          <Text style={styles.termsText}>
            • Financing options available subject to credit approval • Ask your sales representative for details
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Harris Boat Works • 5369 Harris Boat Works Rd, Gore's Landing, ON K0K 2E0 • (905) 342-2153 • www.harrisboatworks.com
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProfessionalQuotePDF;