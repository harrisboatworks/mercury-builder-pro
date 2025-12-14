import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

// Register professional fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.ttf' },
    { src: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4uaVc.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#1e40af',
    padding: 25,
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  harrisLogo: {
    width: 160,
    height: 50,
  },
  mercuryLogo: {
    width: 70,
    height: 35,
  },
  companyInfo: {
    marginLeft: 20,
  },
  companyTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 12,
    color: '#93c5fd',
    fontStyle: 'italic',
  },
  quoteInfo: {
    alignItems: 'flex-end',
    color: 'white',
  },
  quoteNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  dateInfo: {
    fontSize: 11,
    color: '#93c5fd',
    textAlign: 'right',
    lineHeight: 1.4,
  },
  content: {
    padding: 35,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 15,
    marginTop: 25,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    paddingBottom: 8,
  },
  customerSection: {
    marginBottom: 25,
  },
  customerGrid: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
  },
  customerRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  customerLabel: {
    width: 120,
    fontSize: 10,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },
  customerValue: {
    flex: 1,
    fontSize: 12,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  motorHighlight: {
    backgroundColor: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    padding: 25,
    borderRadius: 12,
    marginVertical: 25,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  motorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  motorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  motorModel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 25,
    marginTop: 15,
  },
  specItem: {
    width: '30%',
    minWidth: 120,
  },
  specLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  specValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  priceSection: {
    marginTop: 30,
  },
  priceTable: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 40,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  itemDescription: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'right',
    width: 100,
  },
  subtotalRow: {
    backgroundColor: '#e5e7eb',
    fontWeight: 'bold',
  },
  totalRow: {
    backgroundColor: '#1e40af',
    color: 'white',
    paddingVertical: 15,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  savingsBox: {
    backgroundColor: '#059669',
    color: 'white',
    padding: 20,
    textAlign: 'center',
    marginTop: 15,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  financingSection: {
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  financingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 10,
  },
  financingAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#92400e',
  },
  termsSection: {
    marginTop: 30,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  termsList: {
    fontSize: 10,
    color: '#4b5563',
    lineHeight: 1.6,
  },
  footer: {
    backgroundColor: '#1f2937',
    padding: 25,
    marginTop: 'auto',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 10,
    color: '#d1d5db',
    lineHeight: 1.5,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerLogo: {
    width: 60,
    height: 30,
    marginBottom: 8,
  },
  website: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: 'bold',
  },
});

interface ProfessionalQuotePDFProps {
  quoteData: {
    quoteNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    motor: {
      model: string;
      hp: number;
      year?: number;
      sku?: string;
      cylinders?: string;
      fuelSystem?: string;
      weight?: string;
      shaftLength?: string;
    };
    totals: {
      msrp: number;
      discount: number;
      promoValue: number;
      subtotal: number;
      tax: number;
      total: number;
      savings: number;
      subtotalAfterTrade?: number;
      hst?: number;
      totalCashPrice?: number;
    };
    tradeInValue?: number;
    monthlyPayment?: number;
    specs?: Array<{ label: string; value: string }>;
  };
}

export const ProfessionalQuotePDF: React.FC<ProfessionalQuotePDFProps> = ({ quoteData }) => {
  const currentDate = new Date().toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const hasTradeIn = quoteData.tradeInValue && quoteData.tradeInValue > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Professional Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoSection}>
              <Image src={harrisLogo} style={styles.harrisLogo} />
              <Image src={mercuryLogo} style={styles.mercuryLogo} />
              <View style={styles.companyInfo}>
                <Text style={styles.companyTitle}>Harris Boat Works</Text>
                <Text style={styles.tagline}>Your Trusted Mercury Dealer Since 1965</Text>
              </View>
            </View>
            <View style={styles.quoteInfo}>
              <Text style={styles.quoteNumber}>Quote #{quoteData.quoteNumber}</Text>
              <Text style={styles.dateInfo}>
                Date: {currentDate}{'\n'}
                Valid Until: {validUntil}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Customer Information */}
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerGrid}>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Customer Name</Text>
              <Text style={styles.customerValue}>{quoteData.customerName}</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Email Address</Text>
              <Text style={styles.customerValue}>{quoteData.customerEmail}</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Phone Number</Text>
              <Text style={styles.customerValue}>{quoteData.customerPhone}</Text>
            </View>
          </View>

          {/* Motor Highlight */}
          <Text style={styles.sectionTitle}>Mercury Outboard Motor</Text>
          <View style={styles.motorHighlight}>
            <View style={styles.motorHeader}>
              <View>
                <Text style={styles.motorTitle}>
                  {quoteData.motor.year ? `${quoteData.motor.year} ` : ''}Mercury {quoteData.motor.model}
                </Text>
                <Text style={styles.motorModel}>{quoteData.motor.hp}HP Outboard Motor</Text>
                {quoteData.motor.sku && (
                  <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 5 }}>
                    SKU: {quoteData.motor.sku}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Horsepower</Text>
                <Text style={styles.specValue}>{quoteData.motor.hp}HP</Text>
              </View>
              {quoteData.motor.cylinders && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Engine Type</Text>
                  <Text style={styles.specValue}>{quoteData.motor.cylinders}</Text>
                </View>
              )}
              {quoteData.motor.fuelSystem && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Fuel System</Text>
                  <Text style={styles.specValue}>{quoteData.motor.fuelSystem}</Text>
                </View>
              )}
              {quoteData.motor.weight && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Dry Weight</Text>
                  <Text style={styles.specValue}>{quoteData.motor.weight}</Text>
                </View>
              )}
              {quoteData.motor.shaftLength && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Shaft Length</Text>
                  <Text style={styles.specValue}>{quoteData.motor.shaftLength}</Text>
                </View>
              )}
              {quoteData.specs && quoteData.specs.map((spec, index) => (
                <View key={index} style={styles.specItem}>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Investment Breakdown */}
          <Text style={styles.sectionTitle}>Investment Breakdown</Text>
          <View style={styles.priceTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Description</Text>
              <Text style={styles.tableHeaderText}>Amount</Text>
            </View>

            {/* MSRP */}
            <View style={styles.tableRow}>
              <Text style={styles.itemDescription}>
                {quoteData.motor.model} {quoteData.motor.hp}HP Motor (MSRP)
              </Text>
              <Text style={styles.itemPrice}>${quoteData.totals.msrp.toLocaleString()}</Text>
            </View>

            {/* Dealer Discount */}
            {quoteData.totals.discount > 0 && (
              <View style={[styles.tableRow, styles.tableRowAlt]}>
                <Text style={styles.itemDescription}>Harris Boat Works Discount</Text>
                <Text style={[styles.itemPrice, { color: '#059669' }]}>-${quoteData.totals.discount.toLocaleString()}</Text>
              </View>
            )}

            {/* Promotional Savings */}
            {quoteData.totals.promoValue > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.itemDescription}>Current Promotional Savings</Text>
                <Text style={[styles.itemPrice, { color: '#059669' }]}>-${quoteData.totals.promoValue.toLocaleString()}</Text>
              </View>
            )}

            {/* Estimated Trade Value */}
            {hasTradeIn && (
              <View style={[styles.tableRow, styles.tableRowAlt]}>
                <Text style={styles.itemDescription}>Estimated Trade Value*</Text>
                <Text style={[styles.itemPrice, { color: '#059669' }]}>-${quoteData.tradeInValue!.toLocaleString()}</Text>
              </View>
            )}

            {/* Subtotal */}
            <View style={[styles.tableRow, styles.subtotalRow]}>
              <Text style={[styles.itemDescription, { fontWeight: 'bold' }]}>Subtotal</Text>
              <Text style={[styles.itemPrice, { fontWeight: 'bold' }]}>
                ${(quoteData.totals.subtotalAfterTrade || quoteData.totals.subtotal).toLocaleString()}
              </Text>
            </View>

            {/* HST */}
            <View style={styles.tableRow}>
              <Text style={styles.itemDescription}>HST (13%)</Text>
              <Text style={styles.itemPrice}>
                ${(quoteData.totals.hst || quoteData.totals.tax).toLocaleString()}
              </Text>
            </View>

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={[styles.itemDescription, styles.totalText]}>TOTAL INVESTMENT</Text>
              <Text style={[styles.itemPrice, styles.totalText]}>
                ${(quoteData.totals.totalCashPrice || quoteData.totals.total).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Savings Highlight */}
          {quoteData.totals.savings > 0 && (
            <View style={styles.savingsBox}>
              <Text style={styles.savingsText}>
                YOUR TOTAL SAVINGS: ${quoteData.totals.savings.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Financing Option */}
          {quoteData.monthlyPayment && (
            <View style={styles.financingSection}>
              <Text style={styles.financingTitle}>Financing Available (O.A.C.)</Text>
              <Text style={styles.financingAmount}>
                As low as ${quoteData.monthlyPayment}/month*
              </Text>
              <Text style={{ fontSize: 10, color: '#92400e', marginTop: 5 }}>
                *Based on approved credit, terms and conditions apply
              </Text>
            </View>
          )}

          {/* Terms and Conditions */}
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsList}>
              • This quote is valid for 30 days from the date above and subject to motor availability{'\n'}
              • All prices are in Canadian dollars (CAD) and include applicable HST{'\n'}
              • *Estimated trade values subject to physical inspection and market conditions{'\n'}
              • Professional installation and rigging services available at additional cost{'\n'}
              • All new Mercury motors include comprehensive factory warranty coverage{'\n'}
              • Financing options available to qualified buyers (O.A.C.) - contact us for complete terms{'\n'}
              • Prices and specifications subject to change without notice{'\n'}
              • Additional fees may apply for delivery, prep, and documentation
            </Text>
          </View>
        </View>

        {/* Professional Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerTitle}>Harris Boat Works - Your Trusted Mercury Dealer Since 1947</Text>
              <Text style={styles.footerText}>
                Gore's Landing, Ontario | Phone: 705-XXX-XXXX{'\n'}
                Email: info@harrisboatworks.com | Service: service@harrisboatworks.com{'\n'}
                Hours: Mon-Fri 8AM-6PM, Sat 8AM-4PM, Sun by appointment
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Image src={mercuryLogo} style={styles.footerLogo} />
              <Text style={styles.website}>www.harrisboatworks.com</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ProfessionalQuotePDF;