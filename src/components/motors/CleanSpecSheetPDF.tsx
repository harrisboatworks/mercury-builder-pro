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

// Enhanced styles for professional spec sheet
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  harrisLogo: {
    width: 60,
    height: 'auto',
  },
  mercuryLogo: {
    width: 70,
    height: 'auto',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  docDate: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 8,
  },
  msrpContainer: {
    alignItems: 'flex-end',
  },
  msrpLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  msrpValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  motorHeader: {
    backgroundColor: '#f8fafc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  motorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  motorSubtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  overviewBoxes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  overviewBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 2,
  },
  overviewValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  mainContent: {
    flexDirection: 'row',
    gap: 15,
    flex: 1,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  section: {
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  specGrid: {
    gap: 3,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  specLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  specValue: {
    fontSize: 8,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  bulletList: {
    gap: 2,
  },
  bulletItem: {
    fontSize: 8,
    color: '#374151',
    paddingLeft: 6,
  },
  comparisonBox: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 12,
  },
  comparisonTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  comparisonItem: {
    fontSize: 8,
    color: '#1e40af',
    marginBottom: 2,
    paddingLeft: 6,
  },
  warrantyBox: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
  },
  warrantyTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 4,
  },
  warrantyItem: {
    fontSize: 8,
    color: '#15803d',
    marginBottom: 2,
    paddingLeft: 6,
  },
  financingBox: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  financingTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 3,
  },
  financingItem: {
    fontSize: 7,
    color: '#92400e',
    marginBottom: 1,
  },
  modelCodeBox: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    marginBottom: 15,
  },
  modelCodeTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 3,
  },
  modelCodeText: {
    fontSize: 8,
    color: '#0c4a6e',
  },
  promoBanner: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#f59e0b',
    marginBottom: 15,
    alignItems: 'center',
  },
  promoTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 3,
  },
  promoText: {
    fontSize: 9,
    color: '#92400e',
    textAlign: 'center',
  },
  contactFooter: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  companyName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  contactText: {
    fontSize: 8,
    color: '#6b7280',
  },
  ctaText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginTop: 8,
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
  stockStatus?: string;
  currentPromotion?: {
    name: string;
    description: string;
    endDate: string;
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

  // Model code decoder function
  const decodeModelCode = (model: string) => {
    const codes = [];
    if (model.includes('M')) codes.push('M = Manual Start');
    if (model.includes('H')) codes.push('H = Tiller Handle');
    if (model.includes('E')) codes.push('E = Electric Start');
    if (model.includes('R')) codes.push('R = Remote Control');
    if (model.includes('CT')) codes.push('CT = Command Thrust');
    if (model.includes('XS')) codes.push('XS = Extra Short Shaft');
    if (model.includes('L')) codes.push('L = Long Shaft');
    return codes.join(' | ');
  };

  // Enhanced specifications with real data
  const enhancedSpecs = {
    'Weight': specData.specifications?.weight || '96 lbs (43 kg)',
    'Displacement': specData.specifications?.displacement || '85 cc',
    'Gear Ratio': specData.specifications?.gear_ratio || '2.15:1',
    'Fuel System': specData.specifications?.fuel_system || 'Carburetor',
    'Oil Type': specData.specifications?.oil_type || 'Mercury 25W-40 4-Stroke Marine Oil',
    'Noise Level': specData.specifications?.noise_level || '78 dB @ 1000 RPM',
    'Control Type': specData.specifications?.control_type || 'Tiller Handle',
    'Shaft Options': specData.specifications?.shaft_options || '15" (S), 20" (L) available',
    ...specData.specifications
  };

  const features = specData.features || [];
  const accessories = specData.includedAccessories || [];
  const uses = specData.idealUses || [];
  const performance = specData.performanceData || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logos and MSRP */}
        <View style={styles.header}>
          <View style={styles.headerLogos}>
            <Image 
              style={styles.harrisLogo}
              src="/src/assets/harris-logo.png"
            />
            <Image 
              style={styles.mercuryLogo}
              src="/src/assets/mercury-logo.png"
            />
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>Motor Specifications</Text>
            <Text style={styles.docDate}>{currentDate}</Text>
            {specData.msrp && (
              <View style={styles.msrpContainer}>
                <Text style={styles.msrpLabel}>MSRP</Text>
                <Text style={styles.msrpValue}>${specData.msrp}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Motor Header */}
        <View style={styles.motorHeader}>
          <Text style={styles.motorTitle}>{specData.motorModel}</Text>
          <Text style={styles.motorSubtitle}>
            {specData.modelYear} Mercury Marine {specData.category}
          </Text>
        </View>

        {/* Model Code Decoder */}
        {decodeModelCode(specData.motorModel) && (
          <View style={styles.modelCodeBox}>
            <Text style={styles.modelCodeTitle}>Model Code: {specData.motorModel}</Text>
            <Text style={styles.modelCodeText}>{decodeModelCode(specData.motorModel)}</Text>
          </View>
        )}

        {/* Promotion Banner */}
        {specData.currentPromotion && (
          <View style={styles.promoBanner}>
            <Text style={styles.promoTitle}>{specData.currentPromotion.name}</Text>
            <Text style={styles.promoText}>
              {specData.currentPromotion.description} - Ends {specData.currentPromotion.endDate}
            </Text>
          </View>
        )}

        {/* Overview Boxes */}
        <View style={styles.overviewBoxes}>
          <View style={styles.overviewBox}>
            <Text style={styles.overviewLabel}>HORSEPOWER</Text>
            <Text style={styles.overviewValue}>{specData.horsepower}</Text>
          </View>
          <View style={styles.overviewBox}>
            <Text style={styles.overviewLabel}>WEIGHT</Text>
            <Text style={styles.overviewValue}>96 lbs</Text>
          </View>
          <View style={styles.overviewBox}>
            <Text style={styles.overviewLabel}>START TYPE</Text>
            <Text style={styles.overviewValue}>Manual</Text>
          </View>
          <View style={styles.overviewBox}>
            <Text style={styles.overviewLabel}>WARRANTY</Text>
            <Text style={styles.overviewValue}>5 Years*</Text>
          </View>
        </View>

        {/* Main Content - Two Columns */}
        <View style={styles.mainContent}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Engine Specifications */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Engine Specifications</Text>
              </View>
              <View style={styles.specGrid}>
                {Object.entries(enhancedSpecs).slice(0, 8).map(([key, value]) => (
                  <View key={key} style={styles.specItem}>
                    <Text style={styles.specLabel}>{key}:</Text>
                    <Text style={styles.specValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Performance Data */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Performance Data</Text>
              </View>
              <View style={styles.specGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Recommended Boat Size:</Text>
                  <Text style={styles.specValue}>12-16 ft</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Estimated Top Speed:</Text>
                  <Text style={styles.specValue}>25-30 mph</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Fuel Consumption:</Text>
                  <Text style={styles.specValue}>2.5 GPH @ cruise</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Operating Range:</Text>
                  <Text style={styles.specValue}>120+ miles</Text>
                </View>
              </View>
            </View>

            {/* What's Included */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>What's Included</Text>
              </View>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Advanced corrosion protection</Text>
                <Text style={styles.bulletItem}>• Integrated fuel tank & gauge</Text>
                <Text style={styles.bulletItem}>• 360° steering with tilt lock</Text>
                <Text style={styles.bulletItem}>• Multi-function tiller handle</Text>
                <Text style={styles.bulletItem}>• Fresh water flush port</Text>
                <Text style={styles.bulletItem}>• Maintenance-free design</Text>
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Why Choose This Motor */}
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonTitle}>Why Choose This Motor?</Text>
              <Text style={styles.comparisonItem}>• 30% quieter than 2-stroke alternatives</Text>
              <Text style={styles.comparisonItem}>• 50% better fuel economy</Text>
              <Text style={styles.comparisonItem}>• Lightest in class at 96 lbs</Text>
              <Text style={styles.comparisonItem}>• Mercury reliability & nationwide dealer network</Text>
            </View>

            {/* Warranty & Service */}
            <View style={styles.warrantyBox}>
              <Text style={styles.warrantyTitle}>Warranty & Service</Text>
              <Text style={styles.warrantyItem}>• Standard: 3 years limited warranty</Text>
              {specData.currentPromotion ? (
                <>
                  <Text style={styles.warrantyItem}>• Current Promo: Extended warranty included</Text>
                  <Text style={styles.warrantyItem}>• Expires {specData.currentPromotion.endDate}</Text>
                </>
              ) : null}
              <Text style={styles.warrantyItem}>• Service: Every 100 hrs or annually</Text>
              <Text style={styles.warrantyItem}>• Local service at {COMPANY_INFO.name}</Text>
            </View>

            {/* Ideal Applications */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ideal Applications</Text>
              </View>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Fishing & recreational boating</Text>
                <Text style={styles.bulletItem}>• Jon boats & small aluminum boats</Text>
                <Text style={styles.bulletItem}>• Pontoon boats (auxiliary power)</Text>
                <Text style={styles.bulletItem}>• Tender & dinghy propulsion</Text>
                <Text style={styles.bulletItem}>• Shallow water operation</Text>
              </View>
            </View>

            {/* Financing Options */}
            <View style={styles.financingBox}>
              <Text style={styles.financingTitle}>Financing Options</Text>
              <Text style={styles.financingItem}>Competitive rates available</Text>
              <Text style={styles.financingItem}>Contact for current rates</Text>
              <Text style={styles.financingItem}>OAC - Terms vary</Text>
            </View>
          </View>
        </View>

        {/* Contact Footer */}
        <View style={styles.contactFooter}>
          <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactText}>{COMPANY_INFO.address.full}</Text>
            <Text style={styles.contactText}>Phone: {COMPANY_INFO.contact.phone}</Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactText}>Email: {COMPANY_INFO.contact.email}</Text>
            <Text style={styles.contactText}>Web: {COMPANY_INFO.contact.website}</Text>
          </View>
          <Text style={styles.ctaText}>
            Questions? Call {COMPANY_INFO.contact.phone} or visit {COMPANY_INFO.contact.website}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default CleanSpecSheetPDF;