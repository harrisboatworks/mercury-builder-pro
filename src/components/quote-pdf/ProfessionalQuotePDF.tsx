import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Import logos
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

// Clean, professional color scheme matching the website
const colors = {
  text: '#2c3142',           // Dark gray text
  lightText: '#6b7280',      // Light gray for secondary text
  primary: '#0066cc',         // Blue for accents only
  success: '#10b981',         // Green for savings
  border: '#e5e7eb',          // Light border
  background: '#f9fafb',      // Very light gray background
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
    borderBottom: `1 solid ${colors.border}`,
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
    fontWeight: 'bold',
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
    gap: 20,
  },
  
  leftColumn: {
    flex: 1.2,
  },
  
  rightColumn: {
    flex: 1,
  },
  
  // Product section
  productSection: {
    marginBottom: 15,
  },
  
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  
  productDetails: {
    fontSize: 9,
    color: colors.lightText,
    marginBottom: 3,
  },
  
  // Pricing table
  pricingSection: {
    marginBottom: 15,
  },
  
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `1 solid ${colors.border}`,
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
    fontWeight: 'bold',
  },
  
  discountValue: {
    color: colors.success,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  
  // Customer info box
  infoBox: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 4,
    marginBottom: 15,
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
    backgroundColor: colors.background,
    borderRadius: 4,
    marginBottom: 15,
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
    fontSize: 10,
    color: colors.success,
    fontWeight: 'bold',
    marginTop: 4,
  },
  
  // Extended warranty section
  warrantySection: {
    marginTop: 10,
    padding: 8,
    backgroundColor: colors.background,
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
    marginTop: 15,
    paddingTop: 10,
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
  },
  
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  footerLeft: {
    fontSize: 8,
    color: colors.lightText,
  },
  
  footerRight: {
    fontSize: 8,
    color: colors.lightText,
    textAlign: 'right',
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
            <Image src={harrisLogo} style={{ width: 60, height: 35 }} />
            <Image src={mercuryLogo} style={{ width: 70, height: 25 }} />
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

            {/* Pricing Breakdown */}
            <View style={styles.pricingSection}>
              <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>MSRP - {quoteData.productName}</Text>
                <Text style={styles.pricingValue}>${quoteData.msrp}</Text>
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
              
              <Text style={styles.savingsText}>
                Total savings of ${quoteData.totalSavings} vs MSRP
              </Text>
            </View>

            {/* Extended Warranty Options */}
            <View style={styles.warrantySection}>
              <Text style={styles.warrantyTitle}>EXTENDED WARRANTY OPTIONS</Text>
              <Text style={{ fontSize: 8, color: colors.lightText, marginBottom: 6 }}>
                Current coverage: 5 years (base + promo)
              </Text>
              
              <View style={styles.warrantyOption}>
                <Text style={styles.warrantyText}>6 yrs total • +$899 • +$15/mo</Text>
              </View>
              <View style={styles.warrantyOption}>
                <Text style={styles.warrantyText}>7 yrs total • +$1,199 • +$20/mo</Text>
              </View>
              <View style={styles.warrantyOption}>
                <Text style={styles.warrantyText}>8 yrs total • +$1,499 • +$25/mo</Text>
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Customer Information */}
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

            {/* Coverage Summary */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>COMPLETE COVERAGE</Text>
              <Text style={styles.summaryItem}>Coverage: 5 years total</Text>
              <Text style={styles.summaryItem}>• Mercury motor</Text>
              <Text style={styles.summaryItem}>• Premium controls & rigging</Text>
              <Text style={styles.summaryItem}>• Marine starting battery</Text>
              <Text style={styles.summaryItem}>• Premium marine controls and installation hardware</Text>
            </View>

            {/* Bonus Offers */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Bonus Offers Included</Text>
              <Text style={styles.summaryItem}>
                • 2 Years Extended Warranty (+2 years warranty at no cost)
              </Text>
              <Text style={styles.summaryItem}>
                • Added Value for Free
              </Text>
              <Text style={{ fontSize: 8, color: colors.lightText, marginTop: 4 }}>
                Limited time offer
              </Text>
            </View>

            {/* Financing */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Monthly Financing Available</Text>
              <Text style={styles.summaryItem}>Starting from $271/mo</Text>
              <Text style={{ fontSize: 8, color: colors.lightText, marginTop: 2 }}>
                OAC. Final terms at checkout.
              </Text>
            </View>
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
          <View style={styles.footerContent}>
            <View>
              <Text style={styles.footerLeft}>Harris Boat Works</Text>
              <Text style={styles.footerLeft}>5369 Harris Boat Works Rd, Gore's Landing, ON K0K 2E0</Text>
            </View>
            <View>
              <Text style={styles.footerRight}>(905) 342-2153</Text>
              <Text style={styles.footerRight}>www.harrisboatworks.com</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ProfessionalQuotePDF;