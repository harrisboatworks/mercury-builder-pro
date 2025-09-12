import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

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
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1a365d',
  },
  logo: {
    width: 120,
    height: 40,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  quoteNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 5,
  },
  date: {
    fontSize: 10,
    color: '#666666',
  },
  companyInfo: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'right',
    lineHeight: 1.3,
  },
  customerSection: {
    marginBottom: 25,
  },
  customerBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 10,
  },
  customerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  customerLabel: {
    width: 80,
    fontWeight: 'bold',
    color: '#4a5568',
  },
  customerValue: {
    flex: 1,
    color: '#2d3748',
  },
  motorSection: {
    marginBottom: 25,
  },
  motorHeader: {
    backgroundColor: '#1a365d',
    color: 'white',
    padding: 12,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  motorDetails: {
    backgroundColor: '#f7fafc',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopWidth: 0,
  },
  motorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  motorSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  specItem: {
    backgroundColor: '#e2e8f0',
    padding: '4 8',
    marginRight: 8,
    marginBottom: 4,
    borderRadius: 3,
    fontSize: 8,
  },
  table: {
    marginBottom: 25,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4a5568',
    color: 'white',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: '#f8f9fa',
  },
  col1: { width: '50%' },
  col2: { width: '25%', textAlign: 'right' },
  col3: { width: '25%', textAlign: 'right' },
  totalRow: {
    backgroundColor: '#1a365d',
    color: 'white',
    fontWeight: 'bold',
  },
  savingsRow: {
    backgroundColor: '#22c55e',
    color: 'white',
  },
  subtotalRow: {
    backgroundColor: '#e2e8f0',
    fontWeight: 'bold',
  },
  termsSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  termsList: {
    fontSize: 8,
    color: '#4a5568',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
    fontSize: 8,
    color: '#666666',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    lineHeight: 1.4,
  },
  website: {
    color: '#1a365d',
    fontWeight: 'bold',
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
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a365d' }}>
              Harris Boat Works
            </Text>
            <Text style={styles.companyInfo}>
              Professional Marine Solutions{'\n'}
              Authorized Mercury Dealer
            </Text>
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

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.contactInfo}>
              <Text>Harris Boat Works - Your Trusted Mercury Dealer</Text>
              <Text>Phone: 705-XXX-XXXX | Email: info@harrisboatworks.com</Text>
            </View>
            <Text style={styles.website}>www.harrisboatworks.com</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default QuotePDF;