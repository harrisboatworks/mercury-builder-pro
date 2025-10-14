import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  
  // Header with logos
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
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
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  
  dealerText: {
    fontSize: 9,
    color: colors.lightText,
  },
  
  // Main content in two columns
  mainContent: {
    flexDirection: 'row',
    gap: 24,
  },
  
  leftColumn: {
    flex: 1.2,
  },
  
  rightColumn: {
    flex: 1,
  },
  
  // Product section
  productSection: {
    marginBottom: 18,
  },
  
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  
  productDetails: {
    fontSize: 9,
    color: colors.lightText,
    marginBottom: 3,
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
    padding: 10,
    marginBottom: 18,
  },
  
  pricingSection: {
    marginBottom: 18,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  
  pricingHeader: {
    backgroundColor: colors.tableBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    marginBottom: 6,
  },
  
  pricingHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text,
  },
  
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
    paddingVertical: 8,
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
    padding: 12,
    marginBottom: 20,
  },
  
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
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
    padding: 12,
    border: `1 solid ${colors.border}`,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  
  // Financing callout box (outline style)
  financingBox: {
    padding: 12,
    border: `1 solid ${colors.border}`,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },

  // Large savings callout box (right column top)
  savingsCalloutBox: {
    border: `2 solid ${colors.border}`,
    padding: 16,
    backgroundColor: 'transparent',
    marginBottom: 20,
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
  
  summaryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  
  summaryItem: {
    fontSize: 9,
    color: colors.text,
    marginBottom: 3,
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
  
  // Terms section
  termsSection: {
    marginTop: 18,
    paddingTop: 12,
    borderTop: `1 solid ${colors.border}`,
  },
  
  termsText: {
    fontSize: 8,
    color: colors.lightText,
    marginBottom: 2,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    paddingTop: 10,
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
              <Text style={styles.productDetails}>✓ Quiet, low-vibration four-stroke performance</Text>
              <Text style={styles.productDetails}>✓ Excellent fuel economy & range</Text>
              <Text style={styles.productDetails}>✓ Factory-backed service at Harris Boat Works</Text>
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
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Promotional Savings</Text>
                <Text style={[styles.pricingValue, styles.discountValue]}>-${quoteData.promoSavings}</Text>
              </View>
              
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
              <Text style={styles.summaryTitle}>
                {quoteData.selectedPackage?.label || 'COMPLETE COVERAGE'}
              </Text>
              <Text style={styles.summaryItem}>
                Coverage: {quoteData.selectedPackage?.coverageYears || 5} years total
              </Text>
              <Text style={{ fontSize: 9, color: colors.text, marginTop: 6, marginBottom: 4 }}>
                Includes:
              </Text>
              {quoteData.selectedPackage?.features?.map((feature, index) => (
                <Text key={index} style={styles.summaryItem}>✓ {feature}</Text>
              )) || (
                <>
                  <Text style={styles.summaryItem}>✓ Mercury motor</Text>
                  <Text style={styles.summaryItem}>✓ Premium controls & rigging</Text>
                  <Text style={styles.summaryItem}>✓ Marine starting battery</Text>
                </>
              )}
              
              {/* BONUS OFFER (if promo warranty exists) */}
              {quoteData.selectedPackage?.coverageYears && quoteData.selectedPackage.coverageYears > 3 && (
                <View style={{ marginTop: 8, paddingTop: 8, borderTop: `1 solid ${colors.border}` }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.text, marginBottom: 2 }}>
                    🎁 BONUS OFFER
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