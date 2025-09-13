import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { COMPANY_INFO } from '@/lib/companyInfo';

// Register Helvetica font family
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v1/Helvetica.ttf' },
    { src: 'https://fonts.gstatic.com/s/helvetica/v1/Helvetica-Bold.ttf', fontWeight: 'bold' }
  ]
});

// Clean minimal styles matching quote PDF design
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  docDate: {
    fontSize: 10,
    color: '#6b7280',
  },
  motorHeader: {
    backgroundColor: '#f8fafc',
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  motorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
  },
  motorSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  motorHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  highlightLabel: {
    fontSize: 9,
    color: '#64748b',
    marginRight: 4,
  },
  highlightValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingVertical: 2,
  },
  specLabel: {
    fontSize: 9,
    color: '#6b7280',
    flex: 1,
  },
  specValue: {
    fontSize: 9,
    color: '#1f2937',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  featureList: {
    paddingLeft: 10,
  },
  featureItem: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 3,
    paddingLeft: 8,
    position: 'relative',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  footerBold: {
    fontSize: 8,
    color: '#374151',
    fontWeight: 'bold',
  },
});

export interface CleanSpecSheetData {
  motorModel: string;
  horsepower: string;
  category: string;
  modelYear: string | number;
  sku?: string;
  msrp?: string;
  specifications?: Record<string, any>;
  features?: string[];
  includedAccessories?: string[];
  idealUses?: string[];
  performanceData?: {
    recommendedBoatSize?: string;
    estimatedTopSpeed?: string;
    fuelConsumption?: string;
    operatingRange?: string;
  };
}

interface CleanSpecSheetPDFProps {
  specData: CleanSpecSheetData;
}

const CleanSpecSheetPDF: React.FC<CleanSpecSheetPDFProps> = ({ specData }) => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const specs = specData.specifications || {};
  const features = specData.features || [];
  const accessories = specData.includedAccessories || [];
  const uses = specData.idealUses || [];
  const performance = specData.performanceData || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
            <Text style={styles.tagline}>{COMPANY_INFO.tagline}</Text>
            <View style={styles.contactInfo}>
              <Text>{COMPANY_INFO.contact.phone} • {COMPANY_INFO.contact.email}</Text>
              <Text>{COMPANY_INFO.address.full}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>Motor Specifications</Text>
            <Text style={styles.docDate}>{currentDate}</Text>
          </View>
        </View>

        {/* Motor Header */}
        <View style={styles.motorHeader}>
          <Text style={styles.motorTitle}>{specData.motorModel}</Text>
          <Text style={styles.motorSubtitle}>
            {specData.modelYear} Mercury Marine {specData.category}
          </Text>
          <View style={styles.motorHighlights}>
            <View style={styles.highlight}>
              <Text style={styles.highlightLabel}>Power:</Text>
              <Text style={styles.highlightValue}>{specData.horsepower}</Text>
            </View>
            {specData.sku && (
              <View style={styles.highlight}>
                <Text style={styles.highlightLabel}>SKU:</Text>
                <Text style={styles.highlightValue}>{specData.sku}</Text>
              </View>
            )}
            {specData.msrp && (
              <View style={styles.highlight}>
                <Text style={styles.highlightLabel}>MSRP:</Text>
                <Text style={styles.highlightValue}>${specData.msrp}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Technical Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Specifications</Text>
          <View style={styles.specGrid}>
            {Object.entries(specs).map(([key, value]) => (
              <View key={key} style={styles.specItem}>
                <Text style={styles.specLabel}>{key}:</Text>
                <Text style={styles.specValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Data */}
        {Object.keys(performance).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Data</Text>
            <View style={styles.specGrid}>
              {performance.recommendedBoatSize && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Recommended Boat Size:</Text>
                  <Text style={styles.specValue}>{performance.recommendedBoatSize}</Text>
                </View>
              )}
              {performance.estimatedTopSpeed && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Estimated Top Speed:</Text>
                  <Text style={styles.specValue}>{performance.estimatedTopSpeed}</Text>
                </View>
              )}
              {performance.fuelConsumption && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Fuel Consumption:</Text>
                  <Text style={styles.specValue}>{performance.fuelConsumption}</Text>
                </View>
              )}
              {performance.operatingRange && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Operating Range:</Text>
                  <Text style={styles.specValue}>{performance.operatingRange}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Key Features */}
        {features.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featureList}>
              {features.slice(0, 8).map((feature, index) => (
                <Text key={index} style={styles.featureItem}>• {feature}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Included Accessories */}
        {accessories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Included Accessories</Text>
            <View style={styles.featureList}>
              {accessories.slice(0, 6).map((accessory, index) => (
                <Text key={index} style={styles.featureItem}>• {accessory}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Ideal Uses */}
        {uses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ideal Applications</Text>
            <View style={styles.featureList}>
              {uses.slice(0, 5).map((use, index) => (
                <Text key={index} style={styles.featureItem}>• {use}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerBold}>{COMPANY_INFO.name}</Text>
            <Text style={styles.footerText}>Authorized Mercury Marine Dealer</Text>
          </View>
          <View>
            <Text style={styles.footerText}>Contact us for pricing and availability</Text>
            <Text style={styles.footerBold}>{COMPANY_INFO.contact.phone}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CleanSpecSheetPDF;