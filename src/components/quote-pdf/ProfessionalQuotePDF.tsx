import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

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

// Register professional fonts (optional - will use Helvetica by default)
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf'
// });

// Professional color scheme
const colors = {
  primary: '#003f7f',      // Deep blue for headers
  secondary: '#0066cc',    // Bright blue for accents
  success: '#00a651',      // Green for savings
  dark: '#2c3e50',         // Dark gray for text
  gray: '#7f8c8d',         // Medium gray for secondary text
  light: '#ecf0f1',        // Light gray for backgrounds
  border: '#dfe4e6',       // Border color
  white: '#ffffff'
};

// Create styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: 'Helvetica',
  },
  
  // Header Styles
  header: {
    marginBottom: 30,
    borderBottom: `2 solid ${colors.primary}`,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  logoSection: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 10,
    color: colors.gray,
    marginBottom: 2,
  },
  dealerBadge: {
    backgroundColor: colors.primary,
    padding: '6 12',
    borderRadius: 4,
    marginTop: 8,
  },
  dealerBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quoteInfo: {
    alignItems: 'flex-end',
  },
  quoteNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  quoteDate: {
    fontSize: 10,
    color: colors.dark,
    marginBottom: 2,
  },
  validUntil: {
    fontSize: 10,
    color: colors.success,
    fontWeight: 'bold',
    marginTop: 4,
    padding: '4 8',
    backgroundColor: '#e8f5e9',
    borderRadius: 3,
  },
  
  // Customer Section
  customerSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerField: {
    fontSize: 10,
    color: colors.dark,
    marginBottom: 4,
  },
  customerLabel: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  
  // Product Section
  productSection: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productDetailBlock: {
    flex: 1,
  },
  productLabel: {
    fontSize: 10,
    color: '#b3d4fc',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  productValue: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
  },
  mercuryLogo: {
    width: 80,
    height: 30,
    marginTop: 10,
  },
  
  // Pricing Section
  pricingSection: {
    marginBottom: 25,
  },
  pricingTable: {
    borderRadius: 6,
    overflow: 'hidden',
    border: `1 solid ${colors.border}`,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '12 15',
    borderBottom: `1 solid ${colors.border}`,
  },
  pricingRowAlt: {
    backgroundColor: '#f8f9fa',
  },
  pricingLabel: {
    fontSize: 11,
    color: colors.dark,
  },
  pricingValue: {
    fontSize: 11,
    color: colors.dark,
    fontWeight: 'bold',
  },
  discountValue: {
    color: colors.success,
  },
  subtotalRow: {
    backgroundColor: '#f1f3f4',
    fontWeight: 'bold',
  },
  taxRow: {
    backgroundColor: colors.white,
  },
  totalRow: {
    backgroundColor: colors.primary,
    padding: '15 15',
  },
  totalLabel: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },
  
  // Savings Badge
  savingsBadge: {
    backgroundColor: colors.success,
    padding: 20,
    borderRadius: 6,
    marginBottom: 30,
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: 12,
    color: colors.white,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  savingsAmount: {
    fontSize: 28,
    color: colors.white,
    fontWeight: 'bold',
  },
  
  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 30,
    borderTop: `1 solid ${colors.border}`,
  },
  footerContent: {
    alignItems: 'center',
  },
  footerCompanyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  footerAddress: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 2,
    textAlign: 'center',
  },
  footerContact: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 2,
  },
  footerWebsite: {
    fontSize: 9,
    color: colors.secondary,
    marginTop: 4,
  },
  
  // Terms section (optional)
  termsSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 5,
  },
  termsText: {
    fontSize: 8,
    color: colors.gray,
    lineHeight: 1.4,
  },
});

// The PDF Document Component
export const ProfessionalQuotePDF: React.FC<QuotePDFProps> = ({ quoteData }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoSection}>
            <Text style={styles.companyName}>Harris Boat Works</Text>
            <Text style={styles.tagline}>Your Trusted Mercury Dealer Since 1947</Text>
            <View style={styles.dealerBadge}>
              <Text style={styles.dealerBadgeText}>⚓ AUTHORIZED MERCURY MARINE DEALER ⚓</Text>
            </View>
          </View>
          <View style={styles.quoteInfo}>
            <Text style={styles.quoteNumber}>Quote #{quoteData.quoteNumber}</Text>
            <Text style={styles.quoteDate}>{quoteData.date}</Text>
            <Text style={styles.validUntil}>Valid for 30 days</Text>
          </View>
        </View>
      </View>

      {/* Customer Information */}
      <View style={styles.customerSection}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.customerInfo}>
          <View>
            <Text style={styles.customerField}>
              <Text style={styles.customerLabel}>Name:</Text> {quoteData.customerName}
            </Text>
            <Text style={styles.customerField}>
              <Text style={styles.customerLabel}>Email:</Text> {quoteData.customerEmail}
            </Text>
          </View>
          <View>
            <Text style={styles.customerField}>
              <Text style={styles.customerLabel}>Phone:</Text> {quoteData.customerPhone}
            </Text>
            <Text style={styles.customerField}>
              <Text style={styles.customerLabel}>Customer ID:</Text> {quoteData.customerId || 'New Customer'}
            </Text>
          </View>
        </View>
      </View>

      {/* Product Section */}
      <View style={styles.productSection}>
        <Text style={styles.productTitle}>{quoteData.productName}</Text>
        <View style={styles.productDetails}>
          <View style={styles.productDetailBlock}>
            <Text style={styles.productLabel}>Horsepower</Text>
            <Text style={styles.productValue}>{quoteData.horsepower}</Text>
          </View>
          <View style={styles.productDetailBlock}>
            <Text style={styles.productLabel}>Category</Text>
            <Text style={styles.productValue}>{quoteData.category}</Text>
          </View>
          <View style={styles.productDetailBlock}>
            <Text style={styles.productLabel}>Model Year</Text>
            <Text style={styles.productValue}>{quoteData.modelYear}</Text>
          </View>
        </View>
      </View>

      {/* Pricing Section */}
      <View style={styles.pricingSection}>
        <Text style={styles.sectionTitle}>Investment Summary</Text>
        <View style={styles.pricingTable}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Manufacturer's Suggested Retail Price</Text>
            <Text style={styles.pricingValue}>${quoteData.msrp}</Text>
          </View>
          <View style={[styles.pricingRow, styles.pricingRowAlt]}>
            <Text style={styles.pricingLabel}>Harris Boat Works Discount</Text>
            <Text style={[styles.pricingValue, styles.discountValue]}>-${quoteData.dealerDiscount}</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Promotional Savings</Text>
            <Text style={[styles.pricingValue, styles.discountValue]}>-${quoteData.promoSavings}</Text>
          </View>
          <View style={[styles.pricingRow, styles.subtotalRow]}>
            <Text style={styles.pricingLabel}>Subtotal</Text>
            <Text style={styles.pricingValue}>${quoteData.subtotal}</Text>
          </View>
          <View style={[styles.pricingRow, styles.taxRow]}>
            <Text style={styles.pricingLabel}>HST (13%)</Text>
            <Text style={styles.pricingValue}>${quoteData.tax}</Text>
          </View>
          <View style={[styles.pricingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TOTAL INVESTMENT</Text>
            <Text style={styles.totalValue}>${quoteData.total}</Text>
          </View>
        </View>
      </View>

      {/* Savings Badge */}
      <View style={styles.savingsBadge}>
        <Text style={styles.savingsTitle}>Your Total Savings</Text>
        <Text style={styles.savingsAmount}>${quoteData.totalSavings}</Text>
      </View>

      {/* Terms & Conditions (Optional) */}
      <View style={styles.termsSection}>
        <Text style={styles.termsTitle}>Terms & Conditions</Text>
        <Text style={styles.termsText}>
          • This quote is valid for 30 days from the date of issue
          • Prices subject to change without notice after expiry
          • Installation and additional accessories not included unless specified
          • Financing options available - ask your sales representative
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Text style={styles.footerCompanyName}>Harris Boat Works</Text>
          <Text style={styles.footerAddress}>5369 Harris Boat Works Rd, Gore's Landing, ON K0K 2E0</Text>
          <Text style={styles.footerContact}>(905) 342-2153 | info@harrisboatworks.ca</Text>
          <Text style={styles.footerWebsite}>www.harrisboatworks.com</Text>
        </View>
      </View>
    </Page>
  </Document>
);

// Example usage component showing how to implement
export const QuoteGenerator: React.FC = () => {
  // Sample quote data - this would come from your form/database
  const quoteData = {
    quoteNumber: 'HBW-100222',
    date: 'September 12, 2025',
    customerName: 'Valued Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '(905) 555-0123',
    customerId: 'CUST-001',
    productName: '2025 Mercury FourStroke 9.9HP Command Thrust ProKicker EXLHPT',
    horsepower: '9.9HP',
    category: 'FourStroke',
    modelYear: '2025',
    msrp: '7,632',
    dealerDiscount: '546',
    promoSavings: '400',
    subtotal: '6,686',
    tax: '869.18',
    total: '7,555.18',
    totalSavings: '946'
  };

  return (
    <div>
      <PDFDownloadLink 
        document={<ProfessionalQuotePDF quoteData={quoteData} />} 
        fileName={`Quote-${quoteData.quoteNumber}.pdf`}
      >
        {({ blob, url, loading, error }) =>
          loading ? 'Generating PDF...' : 'Download Professional Quote PDF'
        }
      </PDFDownloadLink>
    </div>
  );
};

export default ProfessionalQuotePDF;