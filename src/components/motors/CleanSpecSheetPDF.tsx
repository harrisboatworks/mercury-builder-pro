import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { decodeModelName, getRecommendedBoatSize, getEstimatedSpeed, getFuelConsumption } from '@/lib/motor-helpers';
import { findMotorSpecs as findMercurySpecs } from '@/lib/data/mercury-motors';
import { calculateMonthlyPayment, getFinancingDisplay } from '@/lib/finance';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

// Enhanced styles for professional spec sheet
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 12,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 8,
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
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  motorInfo: {
    flex: 1,
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
    marginBottom: 8,
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
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    padding: 6,
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
  warrantyBox: {
    backgroundColor: '#f0fdf4',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 8,
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
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
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
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    marginBottom: 8,
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
  contactFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 8,
  },
  trustBadge: {
    alignItems: 'center',
    backgroundColor: '#065f46',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  trustBadgeIcon: {
    fontSize: 10,
    color: '#ffffff',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  trustBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
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
    rate?: number; // Add promo rate for financing calculations
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

  // Get HP number for lookups
  const hpNumber = parseInt(specData.horsepower.replace(/[^\d]/g, ''));
  
  // Get actual Mercury motor specifications 
  const mercurySpecs = findMercurySpecs(hpNumber, specData.motorModel);
  
  // Model code decoder with XL, L, H
  const getModelCodeDecoding = (model: string) => {
    const decoded = decodeModelName(model);
    if (decoded.length === 0) return '';
    
    // Clean, simple mappings - no duplicates
    const uniqueCodes = new Map();
    decoded.forEach(item => {
      switch(item.code) {
        case 'E': uniqueCodes.set('E', 'E = Electric Start'); break;
        case 'M': uniqueCodes.set('M', 'M = Manual Start'); break;
        case 'H': uniqueCodes.set('H', 'H = Tiller Handle'); break;
        case 'L': uniqueCodes.set('L', 'L = Long Shaft'); break;
        case 'XL': uniqueCodes.set('XL', 'XL = Extra Long Shaft'); break;
        case 'S': uniqueCodes.set('S', 'S = Short Shaft'); break;
        case 'PT': uniqueCodes.set('PT', 'PT = Power Trim'); break;
      }
    });
    
    return Array.from(uniqueCodes.values()).join(' | ');
  };

  // Get correct start type based on model decoding
  const getStartType = (model: string) => {
    const decoded = decodeModelName(model);
    const manualStart = decoded.find(item => item.code === 'M');
    const electricStart = decoded.find(item => item.code === 'E');
    
    if (manualStart) return 'Manual';
    if (electricStart) return 'Electric';
    return 'Electric'; // Default for higher HP motors
  };

  // Dynamic specifications using actual selectedMotor data FIRST
  const getEnhancedSpecs = () => {
    // Start with selectedMotor specifications as primary source
    const selectedMotorSpecs = { ...specData.specifications };
    
    // Debug logging
    console.log('🔍 PDF Spec Debug:', {
      selectedMotorSpecs,
      mercurySpecs,
      hpNumber,
      motorModel: specData.motorModel
    });
    
    // Force populate critical specs from Mercury data if available
    if (mercurySpecs) {
      // Always populate weight if mercury specs available
      if (mercurySpecs.weight_kg) {
        selectedMotorSpecs['Weight'] = `${Math.round(mercurySpecs.weight_kg * 2.20462)} lbs (${mercurySpecs.weight_kg} kg)`;
      }
      // Always populate displacement if available
      if (mercurySpecs.displacement) {
        selectedMotorSpecs['Displacement'] = mercurySpecs.displacement;
      }
      // Always populate gear ratio if available
      if (mercurySpecs.gear_ratio) {
        selectedMotorSpecs['Gear Ratio'] = mercurySpecs.gear_ratio;
      }
      if (!selectedMotorSpecs['Cylinders']) {
        selectedMotorSpecs['Cylinders'] = mercurySpecs.cylinders || (hpNumber <= 15 ? '1' : hpNumber <= 50 ? '2-3' : '4-6');
      }
      if (!selectedMotorSpecs['Fuel System']) {
        selectedMotorSpecs['Fuel System'] = mercurySpecs.fuel_type || 'Regular Unleaded (91 RON)';
      }
      if (!selectedMotorSpecs['Control Type']) {
        selectedMotorSpecs['Control Type'] = mercurySpecs.steering === 'Tiller' ? 'Tiller Handle' : 'Remote Control';
      }
    }
    
    // Add standard specs only if missing
    if (!selectedMotorSpecs['Oil Type']) {
      selectedMotorSpecs['Oil Type'] = 'Mercury 25W-40 4-Stroke Marine Oil';
    }
    if (!selectedMotorSpecs['Noise Level']) {
      selectedMotorSpecs['Noise Level'] = '78 dB @ 1000 RPM';
    }
    if (!selectedMotorSpecs['Shaft Length']) {
      selectedMotorSpecs['Shaft Length'] = getShaftLength(specData.motorModel);
    }
    if (!selectedMotorSpecs['Control Type']) {
      selectedMotorSpecs['Control Type'] = getControlType(specData.motorModel);
    }
    
    return selectedMotorSpecs;
  };
   
  // Get shaft length from model code
  const getShaftLength = (model: string) => {
    const decoded = decodeModelName(model);
    const shaftInfo = decoded.find(item => item.code === 'XL' || item.code === 'L' || item.code === 'S' || item.code === 'XX');
    
    if (shaftInfo) {
      if (shaftInfo.code === 'S') return '15" (Short)';
      if (shaftInfo.code === 'L') return '20" (Long)';  
      if (shaftInfo.code === 'XL') return '25" (X-Long)';
      if (shaftInfo.code === 'XX') return '30" (XX-Long)';
    }
    
    // Default based on HP if no shaft info in model
    return hpNumber <= 5 ? '15" (Short)' : '20" (Long)';
  };
  
  // Get control type from model code
  const getControlType = (model: string) => {
    const decoded = decodeModelName(model);
    const tillerHandle = decoded.find(item => item.code === 'H');
    return tillerHandle ? 'Tiller Handle' : 'Remote Control';
  };

  const enhancedSpecs = getEnhancedSpecs();
  
  // Debug final specs
  console.log('✅ Final Enhanced Specs:', enhancedSpecs);
  console.log('📊 First 8 specs for display:', Object.entries(enhancedSpecs).slice(0, 8));

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

        {/* Motor Header */}
        <View style={styles.motorHeader}>
          <Text style={styles.motorTitle}>{specData.motorModel}</Text>
          <Text style={styles.motorSubtitle}>
            {specData.modelYear} Mercury Marine {specData.category}
          </Text>
        </View>

        {/* Model Code Decoder */}
        {getModelCodeDecoding(specData.motorModel) && (
          <View style={styles.modelCodeBox}>
            <Text style={styles.modelCodeTitle}>Model Code: {specData.motorModel}</Text>
            <Text style={styles.modelCodeText}>{getModelCodeDecoding(specData.motorModel)}</Text>
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
            <Text style={styles.overviewValue}>{specData.horsepower}</Text>
          </View>
          <View style={styles.overviewBox}>
            <Text style={styles.overviewLabel}>WEIGHT</Text>
            <Text style={styles.overviewValue}>{enhancedSpecs['Weight']}</Text>
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

            {/* Performance Data - Only show if real data exists */}
            {(performance.recommendedBoatSize || performance.estimatedTopSpeed || performance.fuelConsumption || performance.operatingRange) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Performance Data</Text>
                </View>
                <View style={styles.specGrid}>
                  {performance.recommendedBoatSize && (
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>Recommended Boat Size:</Text>
                      <Text style={styles.specValue}>{performance.recommendedBoatSize}</Text>
                    </View>
                  )}
                  {performance.estimatedTopSpeed && (
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>Top Speed:</Text>
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

            {/* Key Features - Motor Specific */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Key Features</Text>
              </View>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>✓ Low Maintenance - Easy access service points</Text>
                <Text style={styles.bulletItem}>✓ Advanced Protection - Corrosion resistant</Text>
                {getStartType(specData.motorModel) === 'Electric' && (
                  <Text style={styles.bulletItem}>✓ Electric Start - Push-button convenience</Text>
                )}
                {getControlType(specData.motorModel) === 'Tiller Handle' ? (
                  <Text style={styles.bulletItem}>✓ Tiller Handle - Direct steering control</Text>
                ) : (
                  <Text style={styles.bulletItem}>✓ Remote Control - 360° steering</Text>
                )}
                <Text style={styles.bulletItem}>✓ Tilt & Lock - Multiple positions</Text>
                {hpNumber >= 9.9 && (
                  <Text style={styles.bulletItem}>✓ Fresh Water Flush - Built-in port</Text>
                )}
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>

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


            {/* Dynamic Motor-Specific Financing Section */}
            <View style={styles.financingSection}>
              <Text style={styles.financingTitle}>Financing Available</Text>
              {specData.motorPrice && specData.motorPrice > 1000 ? (
                <>
                  <Text style={styles.financingItem}>From ${Math.round(specData.motorPrice * 0.027)}/month</Text>
                  {specData.currentPromotion?.rate === 0 ? (
                    <Text style={styles.financingItem}>0% interest promo available OAC</Text>
                  ) : (
                    <Text style={styles.financingItem}>Low rates available OAC</Text>
                  )}
                  <Text style={styles.financingItem}>*Price plus HST • OAC</Text>
                </>
              ) : (
                <Text style={styles.financingItem}>Contact for pricing and financing options</Text>
              )}
            </View>
          </View>
        </View>

        {/* Contact Footer with Trust Badges */}
        <View style={styles.contactFooter}>
          {/* Trust Badges */}
          <View style={styles.trustBadgesRow}>
            <Image 
              src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png"
              style={{ width: 80, height: 40 }}
            />
            <Image 
              src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png"
              style={{ width: 80, height: 40 }}
            />
          </View>
          
          <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
          <Text style={styles.contactText}>{COMPANY_INFO.address.full}</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactText}>Phone: {COMPANY_INFO.contact.phone}</Text>
            <Text style={styles.contactText}>Email: {COMPANY_INFO.contact.email}</Text>
          </View>
          <Text style={styles.contactText}>Web: {COMPANY_INFO.contact.website}</Text>
          <Text style={styles.ctaText}>
            Questions? Call {COMPANY_INFO.contact.phone} or visit {COMPANY_INFO.contact.website}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default CleanSpecSheetPDF;