import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { COMPANY_INFO } from '@/lib/companyInfo';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { decodeModelName } from '@/lib/motor-helpers';
import {
  generateDisplacement,
  generateCylinders,
  generateBoreStroke,
  generateRPMRange,
  generateFuelSystem,
  generateWeight,
  generateGearRatio,
  generateAlternator
} from '@/lib/motor-spec-generators';

const colors = {
  text: '#111827',
  lightText: '#6b7280',
  discount: '#059669',
  border: '#cccccc',
  tableBg: '#f3f4f6',
  infoBg: '#e5e7eb',
  white: '#ffffff'
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    padding: 14,
    paddingBottom: 50,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: '1.5 solid #cccccc',
  },
  
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  logo: {
    width: 60,
    height: 'auto',
  },
  
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  
  tagline: {
    fontSize: 7,
    color: colors.lightText,
  },
  
  // Two-column layout
  mainContent: {
    flexDirection: 'row',
    gap: 14,
  },
  
  leftColumn: {
    flex: 1.2,
  },
  
  rightColumn: {
    flex: 1,
  },
  
  // Title section
  titleSection: {
    marginBottom: 6,
  },
  
  motorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  
  motorSubtitle: {
    fontSize: 9,
    color: colors.lightText,
  },
  
  // Price box
  priceBox: {
    border: '1.5 solid #059669',
    padding: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  
  priceLabel: {
    fontSize: 8,
    color: colors.lightText,
  },
  
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  
  section: {
    marginBottom: 6,
  },
  
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
    paddingBottom: 3,
    borderBottom: '0.5 solid #cccccc',
  },
  
  // Compact spec grid
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  specItem: {
    width: '50%',
    paddingVertical: 3,
    paddingRight: 4,
    borderBottom: '0.5 solid #e5e7eb',
  },
  
  specLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.lightText,
  },
  
  specValue: {
    fontSize: 8,
    color: colors.text,
  },
  
  // Features grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  
  featureItem: {
    width: '48%',
    padding: 4,
    backgroundColor: colors.tableBg,
    borderLeft: '1.5 solid #cccccc',
  },
  
  featureCode: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.text,
  },
  
  featureMeaning: {
    fontSize: 7,
    color: colors.text,
  },
  
  // Warranty box
  warrantyBox: {
    padding: 6,
    backgroundColor: colors.infoBg,
    borderLeft: '1.5 solid #059669',
    marginBottom: 6,
  },
  
  warrantyTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  
  warrantyText: {
    fontSize: 7,
    color: colors.text,
    marginBottom: 2,
  },
  
  // Included list
  includedList: {
    marginTop: 4,
  },
  
  includedItem: {
    fontSize: 7,
    color: colors.text,
    marginBottom: 2,
  },
  
  // Promos
  promoList: {
    marginTop: 4,
  },
  
  promoItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  
  promoBullet: {
    width: 10,
    color: colors.discount,
    fontWeight: 'bold',
    fontSize: 8,
  },
  
  promoText: {
    flex: 1,
    fontSize: 7,
    color: colors.text,
  },
  
  // Insights section - "Why Boaters Love It"
  insightsBox: {
    padding: 6,
    backgroundColor: '#f0f9ff',
    borderLeft: '1.5 solid #3b82f6',
    marginBottom: 6,
  },
  
  insightsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  
  insightItem: {
    fontSize: 7,
    color: '#374151',
    marginBottom: 3,
    paddingLeft: 6,
  },
  
  // Footer - fixed at bottom
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    paddingTop: 6,
    borderTop: '0.5 solid #cccccc',
  },
  
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  footerLeft: {
    flex: 1,
  },
  
  footerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  
  footerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  
  footerText: {
    fontSize: 7,
    color: colors.lightText,
    marginBottom: 1,
  },
  
  footerBold: {
    fontWeight: 'bold',
    color: colors.text,
  },
  
  trustBadge: {
    fontSize: 6,
    color: colors.lightText,
  },
  
  generatedDate: {
    fontSize: 6,
    color: colors.lightText,
  },
});

interface CleanSpecSheetPDFProps {
  motorData: {
    motor: any;
    promotions: any[];
    motorModel: string;
    insights?: string[];
  };
}

export function CleanSpecSheetPDF({ motorData }: CleanSpecSheetPDFProps) {
  const { motor, promotions, motorModel, insights } = motorData;
  
  // Extract HP from model name
  const modelName = motor.model || motorModel;
  const hpMatch = modelName.match(/(\d+(?:\.\d+)?)\s*(?:HP|MH|ELH|ELPT|EXLPT)/i);
  const hpNumber = hpMatch ? parseFloat(hpMatch[1]) : (motor.hp || 0);
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Generate all specs from HP
  const engineType = generateCylinders(hpNumber);
  const displacement = generateDisplacement(hpNumber);
  const weight = generateWeight(hpNumber);
  const gearRatio = generateGearRatio(hpNumber);
  const fuelSystem = generateFuelSystem(hpNumber);
  const alternator = generateAlternator(hpNumber);
  const boreStroke = generateBoreStroke(hpNumber);
  const rpmRange = generateRPMRange(hpNumber);

  // Decode model features for starting type and shaft length
  const decodedFeatures = decodeModelName(modelName, hpNumber);
  const startFeature = decodedFeatures.find(f => f.code === 'E' || f.code === 'M');
  const startType = startFeature?.meaning || 'Electric Start';
  const shaftFeature = decodedFeatures.find(f => ['S', 'L', 'X', 'XL', 'XX', 'XXL'].includes(f.code));
  const shaftLength = shaftFeature?.meaning || '20"';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={harrisLogo} style={styles.logo} />
            <Image src={mercuryLogo} style={styles.logo} />
          </View>
          <View>
            <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
            <Text style={styles.tagline}>{COMPANY_INFO.tagline}</Text>
          </View>
        </View>

        {/* Two-Column Layout */}
        <View style={styles.mainContent}>
          {/* LEFT COLUMN */}
          <View style={styles.leftColumn}>
            {/* Motor Title */}
            <View style={styles.titleSection}>
              <Text style={styles.motorTitle}>{motor.model || motorModel}</Text>
              <Text style={styles.motorSubtitle}>
                {motor.model_year || 2025} Mercury Marine • {hpNumber} HP
              </Text>
            </View>

            {/* Model Features Grid */}
            {decodedFeatures.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Model Configuration</Text>
                <View style={styles.featuresGrid}>
                  {decodedFeatures.slice(0, 6).map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Text style={styles.featureCode}>{feature.code}</Text>
                      <Text style={styles.featureMeaning}>{feature.meaning}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Technical Specifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Technical Specifications</Text>
              <View style={styles.specGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Horsepower</Text>
                  <Text style={styles.specValue}>{hpNumber} HP</Text>
                </View>
                
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Engine Type</Text>
                  <Text style={styles.specValue}>{engineType}</Text>
                </View>
                
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Cylinders</Text>
                  <Text style={styles.specValue}>{hpNumber <= 15 ? '2' : '4'}</Text>
                </View>
                
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Displacement</Text>
                  <Text style={styles.specValue}>{displacement}</Text>
                </View>
                
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Starting</Text>
                  <Text style={styles.specValue}>{startType}</Text>
                </View>
                
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Fuel System</Text>
                  <Text style={styles.specValue}>{fuelSystem}</Text>
                </View>
                
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Weight</Text>
                  <Text style={styles.specValue}>{weight}</Text>
                </View>
                
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Shaft Length</Text>
                  <Text style={styles.specValue}>{shaftLength}</Text>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Gear Ratio</Text>
                  <Text style={styles.specValue}>{gearRatio}</Text>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Bore & Stroke</Text>
                  <Text style={styles.specValue}>{boreStroke}</Text>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Max RPM</Text>
                  <Text style={styles.specValue}>{rpmRange} RPM</Text>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Alternator</Text>
                  <Text style={styles.specValue}>{alternator}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* RIGHT COLUMN */}
          <View style={styles.rightColumn}>
            {/* Price Box */}
            {(motor.dealer_price || motor.msrp) && (
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>MSRP</Text>
                <Text style={styles.priceValue}>
                  ${((motor.msrp || motor.dealer_price || 0)).toLocaleString()}
                </Text>
              </View>
            )}

            {/* Warranty & Service */}
            <View style={styles.warrantyBox}>
              <Text style={styles.warrantyTitle}>Warranty & Service</Text>
              <Text style={styles.warrantyText}>
                • Standard 3-Year Limited Warranty
                {promotions.length > 0 && promotions[0].bonus_years ? ` + ${promotions[0].bonus_years} Bonus Years` : ''}
              </Text>
              <Text style={styles.warrantyText}>
                • Service: Every 100 hours or annually
              </Text>
              <Text style={styles.warrantyText}>
                • Certified Service Available Locally
              </Text>
            </View>

            {/* What's Included */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's Included</Text>
              <View style={styles.includedList}>
                <Text style={styles.includedItem}>✓ Standard Propeller</Text>
                <Text style={styles.includedItem}>✓ Owner's Manual & Warranty Docs</Text>
                <Text style={styles.includedItem}>✓ Fuel Tank & Hose (Portable)</Text>
                <Text style={styles.includedItem}>✓ Complete Rigging Hardware</Text>
              </View>
            </View>

            {/* Special Offers */}
            {promotions && promotions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Special Offers</Text>
                <View style={styles.promoList}>
                  {promotions.slice(0, 4).map((promo, index) => (
                    <View key={index} style={styles.promoItem}>
                      <Text style={styles.promoBullet}>✓</Text>
                      <Text style={styles.promoText}>
                        <Text style={{ fontWeight: 'bold' }}>{promo.name}</Text>
                        {promo.bonus_description || promo.description ? 
                          `: ${promo.bonus_description || promo.description}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Why Boaters Love This Motor - Perplexity Insights */}
            {insights && insights.length > 0 && (
              <View style={styles.insightsBox}>
                <Text style={styles.insightsTitle}>Why Boaters Love This Motor</Text>
                {insights.slice(0, 3).map((insight, idx) => (
                  <Text key={idx} style={styles.insightItem}>• {insight}</Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Footer - Fixed at bottom */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerText}>
                <Text style={styles.footerBold}>{COMPANY_INFO.name}</Text>
              </Text>
              <Text style={styles.footerText}>{COMPANY_INFO.address.full}</Text>
            </View>
            <View style={styles.footerCenter}>
              <Text style={styles.trustBadge}>Mercury CSI Award Winner</Text>
              <Text style={styles.trustBadge}>Certified Repower Center</Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerText}>{COMPANY_INFO.contact.phone}</Text>
              <Text style={styles.footerText}>{COMPANY_INFO.contact.website}</Text>
              <Text style={styles.generatedDate}>Generated: {currentDate}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
