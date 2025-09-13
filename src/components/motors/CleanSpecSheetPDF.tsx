import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { getStartType } from '@/lib/motor-helpers';
import { calculateMonthlyPayment, getFinancingDisplay } from '@/lib/finance';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

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
    width: 80,
    height: 'auto',
  },
  mercuryLogo: {
    width: 100,
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
  motorHeaderWithImage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  motorInfo: {
    flex: 1,
  },
  motorImageContainer: {
    width: 180,
    height: 120,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  motorImagePlaceholder: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  motorImageText: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 2,
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
  financingSection: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  financingTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  financingItem: {
    fontSize: 8,
    color: '#4b5563',
    marginBottom: 2,
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
  promoLine: {
    fontSize: 9,
    color: '#ea580c',
    marginBottom: 12,
    fontWeight: 'medium',
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  dealerPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  savingsText: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 4,
  },
  featureIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  featureText: {
    fontSize: 8,
    color: '#374151',
  },
  advantageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  advantageItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 4,
  },
  advantagePercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  advantageText: {
    fontSize: 7,
    color: '#1e40af',
    textAlign: 'center',
  },
  comparisonNote: {
    fontSize: 6,
    color: '#6b7280',
    fontStyle: 'italic',
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
  motorPrice?: number; // Add motor price for financing calculations
  image_url?: string; // Add motor image URL
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
    rate?: number; // Add promo rate for financing
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

  // Model code decoder function - fixed order and no duplicates
  const decodeModelCode = (model: string) => {
    const codes = [];
    // Decode in the order they appear (ELPT)
    if (model.includes('E')) codes.push('E = Electric Start');
    if (model.includes('L')) codes.push('L = Long Shaft');
    if (model.includes('P')) codes.push('P = Power Trim');
    if (model.includes('T')) codes.push('T = Tiller Handle');
    // Additional specific codes (check more specific first)
    if (model.includes('CT')) codes.push('CT = Command Thrust');
    if (model.includes('XS')) codes.push('XS = Extra Short Shaft');
    if (model.includes('H') && !model.includes('CT') && !model.includes('XS')) codes.push('H = High Output');
    if (model.includes('M') && !model.includes('Command')) codes.push('M = Manual Start');
    if (model.includes('R')) codes.push('R = Remote Control');
    return codes.join(' | ');
  };

  // Dynamic specifications based on motor HP
  const hp = parseInt(specData.horsepower);
  const getMotorSpecs = (horsepower: number) => {
    if (horsepower <= 15) {
      return {
        weight: '121 lbs (55 kg)',
        displacement: '209.5 cc',
        gearRatio: '2.29:1',
        fuelSystem: 'EFI (Electronic Fuel Injection)',
        topSpeed: '22-28 mph',
        boatSize: '12-16 ft',
        fuelConsumption: '1.8 GPH @ cruise'
      };
    } else if (horsepower <= 50) {
      return {
        weight: '267 lbs (121 kg)',
        displacement: '526 cc',
        gearRatio: '2.38:1',
        fuelSystem: 'EFI (Electronic Fuel Injection)',
        topSpeed: '35-42 mph',
        boatSize: '16-20 ft',
        fuelConsumption: '3.2 GPH @ cruise'
      };
    } else if (horsepower <= 115) {
      return {
        weight: '395 lbs (179 kg)',
        displacement: '1350 cc',
        gearRatio: '2.33:1',
        fuelSystem: 'EFI (Electronic Fuel Injection)',
        topSpeed: '45-55 mph',
        boatSize: '18-24 ft',
        fuelConsumption: '5.8 GPH @ cruise'
      };
    } else {
      return {
        weight: '635 lbs (288 kg)',
        displacement: '2100 cc',
        gearRatio: '2.07:1',
        fuelSystem: 'Advanced EFI',
        topSpeed: '65-75 mph',
        boatSize: '22-28 ft',
        fuelConsumption: '12.5 GPH @ cruise'
      };
    }
  };

  const motorSpecs = getMotorSpecs(hp);
  const actualWeight = specData.specifications?.weight || motorSpecs.weight;
  const enhancedSpecs = {
    'Weight': actualWeight,
    'Displacement': specData.specifications?.displacement || motorSpecs.displacement,
    'Gear Ratio': specData.specifications?.gear_ratio || motorSpecs.gearRatio,
    'Fuel System': specData.specifications?.fuel_system || motorSpecs.fuelSystem,
    'Oil Type': specData.specifications?.oil_type || '25W-40 4-Stroke Marine Oil',
    'Noise Level': specData.specifications?.noise_level || '68 dB @ WOT',
    'Control Type': specData.specifications?.control_type || 'Tiller Handle with Power Trim',
    'Shaft Length': specData.specifications?.shaft_options || '25" (X-Long)',
    ...specData.specifications
  };

  const features = specData.features || [];
  const accessories = specData.includedAccessories || [];
  const uses = specData.idealUses || [];
  const performance = specData.performanceData || {};

  // HP-based ideal applications
  const getIdealApplicationsByHP = (hp: number): string[] => {
    if (hp <= 9.9) {
      return [
        'Jon boats & dinghies',
        'Shallow water trolling',
        'Tender propulsion',
        'Small aluminum boats',
        'Auxiliary power'
      ];
    } else if (hp <= 40) {
      return [
        'Small fishing boats',
        'Aluminum boats 14-16ft',
        'Pontoon boats',
        'Recreational boating',
        'Light trolling'
      ];
    } else if (hp <= 115) {
      return [
        'Mid-size fishing boats',
        'Aluminum boats 16-20ft',
        'Recreational watersports',
        'Bay & inland waters',
        'Family boating'
      ];
    } else {
      return [
        'Larger fishing boats',
        'High-performance applications',
        'Offshore fishing',
        'Heavy-duty commercial use',
        'Multi-engine setups'
      ];
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logos and MSRP */}
        <View style={styles.header}>
          <View style={styles.headerLogos}>
            <Image 
              style={styles.harrisLogo}
              src={harrisLogo}
            />
            <Image 
              style={styles.mercuryLogo}
              src={mercuryLogo}
            />
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>Motor Specifications</Text>
            <Text style={styles.docDate}>{currentDate}</Text>
            <View style={styles.priceSection}>
              {specData.msrp && specData.motorPrice && specData.motorPrice < parseInt(specData.msrp.replace(/[^0-9]/g, '')) ? (
                <>
                  <Text style={styles.priceLabel}>MSRP: ${specData.msrp}</Text>
                  <Text style={styles.dealerPrice}>Our Price: ${specData.motorPrice?.toLocaleString()}</Text>
                  <Text style={styles.savingsText}>You Save: ${(parseInt(specData.msrp.replace(/[^0-9]/g, '')) - specData.motorPrice).toLocaleString()}</Text>
                </>
              ) : specData.msrp ? (
                <>
                  <Text style={styles.priceLabel}>MSRP</Text>
                  <Text style={styles.priceValue}>${specData.msrp}</Text>
                </>
              ) : null}
            </View>
          </View>
        </View>

        {/* Motor Header with Image */}
        <View style={styles.motorHeaderWithImage}>
          <View style={styles.motorInfo}>
            <Text style={styles.motorTitle}>{specData.motorModel}</Text>
            <Text style={styles.motorSubtitle}>
              {specData.modelYear} Mercury Marine {specData.category}
            </Text>
          </View>
          <View style={styles.motorImageContainer}>
            {specData.image_url ? (
              <Image 
                style={{ width: 180, height: 120, objectFit: 'contain' }}
                src={specData.image_url}
              />
            ) : (
              <>
                <Text style={styles.motorImagePlaceholder}>{specData.horsepower} HP Motor</Text>
                <Text style={styles.motorImageText}>Mercury Marine</Text>
              </>
            )}
          </View>
        </View>

        {/* Model Code Decoder */}
        {decodeModelCode(specData.motorModel) && (
          <View style={styles.modelCodeBox}>
            <Text style={styles.modelCodeTitle}>Model Code: {specData.motorModel}</Text>
            <Text style={styles.modelCodeText}>{decodeModelCode(specData.motorModel)}</Text>
          </View>
        )}

        {/* Subtle Promo Line */}
        {specData.currentPromotion && (
          <Text style={styles.promoLine}>
            CURRENT PROMO: {specData.currentPromotion.description} - Ends {specData.currentPromotion.endDate}
          </Text>
        )}

        {/* Overview Boxes with Clean Labels */}
        <View style={styles.overviewBoxes}>
          <View style={styles.overviewBox}>
            <Text style={styles.overviewLabel}>HORSEPOWER</Text>
            <Text style={styles.overviewValue}>{specData.horsepower} HP</Text>
          </View>
          <View style={styles.overviewBox}>
            <Text style={styles.overviewLabel}>WEIGHT</Text>
            <Text style={styles.overviewValue}>{actualWeight}</Text>
          </View>
          <View style={styles.overviewBox}>
            <Text style={styles.overviewLabel}>START TYPE</Text>
            <Text style={styles.overviewValue}>{getStartType(specData.motorModel)}</Text>
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

            {/* Performance Data - Dynamic */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Performance Data</Text>
              </View>
              <View style={styles.specGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Recommended Boat Size:</Text>
                  <Text style={styles.specValue}>{performance.recommendedBoatSize || motorSpecs.boatSize}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Estimated Top Speed:</Text>
                  <Text style={styles.specValue}>{performance.estimatedTopSpeed || motorSpecs.topSpeed}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Fuel Consumption:</Text>
                  <Text style={styles.specValue}>{performance.fuelConsumption || motorSpecs.fuelConsumption}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Operating Range:</Text>
                  <Text style={styles.specValue}>{performance.operatingRange || '120+ miles'}</Text>
                </View>
              </View>
            </View>

            {/* Key Features - Clean Format */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Key Features</Text>
              </View>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>✓ Low Maintenance - Easy access service points</Text>
                <Text style={styles.bulletItem}>✓ 360° Steering - Full rotation control</Text>
                <Text style={styles.bulletItem}>✓ Electric Start - Push-button convenience</Text>
                <Text style={styles.bulletItem}>✓ Tilt & Lock - Multiple positions</Text>
                <Text style={styles.bulletItem}>✓ Advanced Protection - Corrosion resistant</Text>
                <Text style={styles.bulletItem}>✓ Fresh Water Flush - Built-in port</Text>
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Competitive Advantages - Dynamic */}
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonTitle}>Competitive Advantages</Text>
              <View style={styles.advantageGrid}>
                {(() => {
                  // Dynamic advantages based on HP class
                  const advantages = hp <= 15 ? [
                    { percent: '35%', text: 'Better Fuel Economy' },
                    { percent: '28%', text: 'Quieter Operation' },
                    { percent: '15%', text: 'Lighter Weight' },
                    { percent: '40%', text: 'Lower Emissions' }
                  ] : hp <= 50 ? [
                    { percent: '25%', text: 'More Displacement' },
                    { percent: '30%', text: 'Better Fuel Economy' },
                    { percent: '20%', text: 'Quieter Operation' },
                    { percent: '18%', text: 'Faster Acceleration' }
                  ] : hp <= 115 ? [
                    { percent: '22%', text: 'More Power/Weight' },
                    { percent: '35%', text: 'Better Fuel Economy' },
                    { percent: '15%', text: 'Quieter Operation' },
                    { percent: '28%', text: 'Advanced Technology' }
                  ] : [
                    { percent: '45%', text: 'Superior Power' },
                    { percent: '38%', text: 'Advanced Features' },
                    { percent: '25%', text: 'Better Reliability' },
                    { percent: '30%', text: 'Fuel Technology' }
                  ];
                  
                  return advantages.map((adv, index) => (
                    <View key={index} style={styles.advantageItem}>
                      <Text style={styles.advantagePercent}>{adv.percent}</Text>
                      <Text style={styles.advantageText}>{adv.text}</Text>
                    </View>
                  ));
                })()}
              </View>
              <Text style={styles.comparisonNote}>*Compared to leading competitors in {specData.horsepower}HP class</Text>
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

            {/* Ideal Applications - HP-based */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ideal Applications</Text>
              </View>
              <View style={styles.bulletList}>
                {getIdealApplicationsByHP(parseInt(specData.horsepower)).map((app, index) => (
                  <Text key={index} style={styles.bulletItem}>• {app}</Text>
                ))}
              </View>
            </View>

            {/* Professional Financing Section */}
            <View style={styles.financingSection}>
              <Text style={styles.financingTitle}>Financing Available</Text>
              {specData.motorPrice && specData.motorPrice > 5000 ? (
                <>
                  {(() => {
                    const priceWithHST = specData.motorPrice * 1.13;
                    const promoRate = specData.currentPromotion?.rate || null;
                    const { payment, termMonths, rate } = calculateMonthlyPayment(priceWithHST, promoRate);
                    
                    return (
                      <>
                        <Text style={styles.financingItem}>Financing available from ${payment}/month</Text>
                        {promoRate === 0 && (
                          <Text style={styles.financingItem}>0% interest for 12 months OAC</Text>
                        )}
                        <Text style={styles.financingItem}>Terms up to {termMonths} months available</Text>
                        <Text style={styles.financingItem}>*Price includes HST • OAC</Text>
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  <Text style={styles.financingItem}>From $60/month - 0% for 12 months OAC</Text>
                  <Text style={styles.financingItem}>Contact us for complete financing options</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Contact Footer with Trust Badges */}
        <View style={styles.contactFooter}>
          {/* Trust Badges */}
          <View style={styles.contactRow}>
            <Text style={styles.contactText}>Award-Winning Service Team</Text>
            <Text style={styles.contactText}>Certified Repower Center</Text>
          </View>
          
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