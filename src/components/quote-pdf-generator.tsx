import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

// Register fonts for better typography
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.ttf' },
    { src: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4uaVc.ttf', fontWeight: 'bold' },
  ],
});

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    backgroundColor: '#1a365d',
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
    gap: 15,
  },
  harrisLogo: {
    width: 140,
    height: 45,
  },
  mercuryLogo: {
    width: 60,
    height: 30,
  },
  companyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
  },
  tagline: {
    fontSize: 11,
    color: '#a0aec0',
    marginLeft: 15,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  quoteNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  date: {
    fontSize: 11,
    color: '#a0aec0',
  },
  companyInfo: {
    fontSize: 10,
    color: '#a0aec0',
    textAlign: 'right',
    lineHeight: 1.4,
    marginTop: 8,
  },
  content: {
    padding: 30,
  },
  customerSection: {
    marginBottom: 25,
  },
  customerBox: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderLeftWidth: 5,
    borderLeftColor: '#1a365d',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  customerRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  customerLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#1a365d',
    fontSize: 11,
  },
  customerValue: {
    flex: 1,
    color: '#2d3748',
    fontSize: 11,
  },
  motorSection: {
    marginBottom: 30,
  },
  motorHeader: {
    backgroundColor: '#2d3748',
    color: 'white',
    padding: 15,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  motorDetails: {
    backgroundColor: '#f7fafc',
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderTopWidth: 0,
  },
  motorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 10,
  },
  motorSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 8,
  },
  specItem: {
    backgroundColor: '#1a365d',
    color: 'white',
    padding: '6 12',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
  },
  table: {
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a365d',
    color: 'white',
    padding: 12,
    fontWeight: 'bold',
    fontSize: 11,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    fontSize: 11,
    minHeight: 35,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  col1: { 
    width: '50%',
    paddingRight: 10,
  },
  col2: { 
    width: '25%', 
    textAlign: 'right',
    paddingRight: 10,
  },
  col3: { 
    width: '25%', 
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalRow: {
    backgroundColor: '#1a365d',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
    minHeight: 40,
  },
  savingsRow: {
    backgroundColor: '#059669',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  subtotalRow: {
    backgroundColor: '#e2e8f0',
    fontWeight: 'bold',
    fontSize: 12,
  },
  termsSection: {
    marginTop: 30,
    marginBottom: 30,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  termsList: {
    fontSize: 10,
    color: '#4a5568',
    lineHeight: 1.6,
  },
  footer: {
    backgroundColor: '#1a365d',
    padding: 20,
    marginTop: 'auto',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    lineHeight: 1.5,
    color: 'white',
    fontSize: 10,
  },
  website: {
    color: '#63b3ed',
    fontWeight: 'bold',
    fontSize: 11,
  },
  mercuryFooterLogo: {
    width: 50,
    height: 25,
  },
});

interface QuotePDFProps {
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
    specs?: Array<{ label: string; value: string }>;
  };
}

export const QuotePDF: React.FC<QuotePDFProps> = ({ quoteData }) => {
  const currentDate = new Date().toLocaleDateString('en-CA');
  const hasTradeIn = quoteData.tradeInValue && quoteData.tradeInValue > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoSection}>
              <Image src={harrisLogo} style={styles.harrisLogo} />
              <Image src={mercuryLogo} style={styles.mercuryLogo} />
              <View>
                <Text style={styles.companyTitle}>Harris Boat Works</Text>
                <Text style={styles.tagline}>Authorized Mercury Dealer Since 1947</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.quoteNumber}>Quote #{quoteData.quoteNumber}</Text>
              <Text style={styles.date}>{currentDate}</Text>
              <Text style={styles.companyInfo}>
                705-XXX-XXXX{'\n'}
                info@harrisboatworks.com{'\n'}
                www.harrisboatworks.com
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>

        {/* Customer Information */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerBox}>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Name:</Text>
              <Text style={styles.customerValue}>{quoteData.customerName}</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Email:</Text>
              <Text style={styles.customerValue}>{quoteData.customerEmail}</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Phone:</Text>
              <Text style={styles.customerValue}>{quoteData.customerPhone}</Text>
            </View>
          </View>
        </View>

        {/* Motor Details */}
        <View style={styles.motorSection}>
          <View style={styles.motorHeader}>
            <Text>MERCURY OUTBOARD MOTOR</Text>
          </View>
          <View style={styles.motorDetails}>
            <Text style={styles.motorName}>
              {quoteData.motor.year ? `${quoteData.motor.year} ` : ''}
              Mercury {quoteData.motor.model} - {quoteData.motor.hp}HP
            </Text>
            {quoteData.motor.sku && (
              <Text style={{ fontSize: 9, color: '#666666', marginBottom: 8 }}>
                SKU: {quoteData.motor.sku}
              </Text>
            )}
            {quoteData.specs && quoteData.specs.length > 0 && (
              <View style={styles.motorSpecs}>
                {quoteData.specs.map((spec, index) => (
                  <Text key={index} style={styles.specItem}>
                    {spec.label}: {spec.value}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Pricing Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Unit Price</Text>
            <Text style={styles.col3}>Total</Text>
          </View>

          {/* MSRP Row */}
          <View style={styles.tableRow}>
            <Text style={styles.col1}>
              {quoteData.motor.model} {quoteData.motor.hp}HP Motor (MSRP)
            </Text>
            <Text style={styles.col2}>${quoteData.totals.msrp.toLocaleString()}</Text>
            <Text style={styles.col3}>${quoteData.totals.msrp.toLocaleString()}</Text>
          </View>

          {/* Discount Row */}
          {quoteData.totals.discount > 0 && (
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={styles.col1}>Dealer Discount</Text>
              <Text style={styles.col2}>-${quoteData.totals.discount.toLocaleString()}</Text>
              <Text style={styles.col3}>-${quoteData.totals.discount.toLocaleString()}</Text>
            </View>
          )}

          {/* Promo Value Row */}
          {quoteData.totals.promoValue > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.col1}>Promotional Savings</Text>
              <Text style={styles.col2}>-${quoteData.totals.promoValue.toLocaleString()}</Text>
              <Text style={styles.col3}>-${quoteData.totals.promoValue.toLocaleString()}</Text>
            </View>
          )}

          {/* Trade-in Row */}
          {hasTradeIn && (
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={styles.col1}>Trade-in Credit (Estimated)*</Text>
              <Text style={styles.col2}>-${quoteData.tradeInValue!.toLocaleString()}</Text>
              <Text style={styles.col3}>-${quoteData.tradeInValue!.toLocaleString()}</Text>
            </View>
          )}

          {/* Subtotal Row */}
          <View style={[styles.tableRow, styles.subtotalRow]}>
            <Text style={styles.col1}>Subtotal</Text>
            <Text style={styles.col2}></Text>
            <Text style={styles.col3}>
              ${(quoteData.totals.subtotalAfterTrade || quoteData.totals.subtotal).toLocaleString()}
            </Text>
          </View>

          {/* Tax Row */}
          <View style={styles.tableRow}>
            <Text style={styles.col1}>HST (13%)</Text>
            <Text style={styles.col2}></Text>
            <Text style={styles.col3}>
              ${(quoteData.totals.hst || quoteData.totals.tax).toLocaleString()}
            </Text>
          </View>

          {/* Total Row */}
          <View style={[styles.tableRow, styles.totalRow]}>
            <Text style={styles.col1}>TOTAL PRICE</Text>
            <Text style={styles.col2}></Text>
            <Text style={styles.col3}>
              ${(quoteData.totals.totalCashPrice || quoteData.totals.total).toLocaleString()}
            </Text>
          </View>

          {/* Savings Row */}
          {quoteData.totals.savings > 0 && (
            <View style={[styles.tableRow, styles.savingsRow]}>
              <Text style={styles.col1}>YOUR TOTAL SAVINGS</Text>
              <Text style={styles.col2}></Text>
              <Text style={styles.col3}>${quoteData.totals.savings.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms and Conditions</Text>
          <Text style={styles.termsList}>
            • This quote is valid for 30 days from the date above{'\n'}
            • All prices are in Canadian dollars and include applicable taxes{'\n'}
            • *Trade-in values are estimates and subject to physical inspection{'\n'}
            • Installation and rigging services available at additional cost{'\n'}
            • Mercury factory warranty applies to all new motors{'\n'}
            • Financing options available (OAC) - contact us for details{'\n'}
            • Prices subject to change without notice
          </Text>
        </View>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.contactInfo}>
              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Harris Boat Works - Your Trusted Mercury Dealer</Text>
              <Text>Phone: 705-XXX-XXXX | Email: info@harrisboatworks.com</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Image src={mercuryLogo} style={styles.mercuryFooterLogo} />
              <Text style={styles.website}>www.harrisboatworks.com</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default QuotePDF;