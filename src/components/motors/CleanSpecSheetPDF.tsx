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
  primary: '#1e40af',
  discount: '#059669',
  border: '#cccccc',
  tableBg: '#f3f4f6',
  white: '#ffffff'
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: `3 solid ${colors.primary}`,
  },
  
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  
  logo: {
    width: 80,
    height: 'auto',
  },
  
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 3,
  },
  
  tagline: {
    fontSize: 9,
    color: colors.lightText,
  },
  
  motorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 15,
    marginBottom: 5,
  },
  
  motorSubtitle: {
    fontSize: 11,
    color: colors.lightText,
    marginBottom: 15,
  },
  
  priceBox: {
    backgroundColor: colors.primary,
    padding: 15,
    marginVertical: 15,
    borderRadius: 4,
  },
  
  priceLabel: {
    fontSize: 11,
    color: colors.white,
    opacity: 0.9,
  },
  
  priceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 5,
  },
  
  section: {
    marginTop: 20,
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: `2 solid ${colors.border}`,
  },
  
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  
  specItem: {
    width: '48%',
    backgroundColor: colors.tableBg,
    padding: 10,
    borderLeft: `3 solid ${colors.primary}`,
  },
  
  specLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 3,
  },
  
  specValue: {
    fontSize: 10,
    color: colors.text,
  },
  
  promoList: {
    marginTop: 10,
  },
  
  promoItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 15,
  },
  
  promoBullet: {
    width: 15,
    color: colors.discount,
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 5,
  },
  
  promoText: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
  },
  
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: `2 solid ${colors.border}`,
  },
  
  footerText: {
    fontSize: 9,
    color: colors.lightText,
    textAlign: 'center',
    marginBottom: 3,
  },
  
  footerBold: {
    fontWeight: 'bold',
    color: colors.text,
  },
  
  generatedDate: {
    fontSize: 8,
    color: colors.lightText,
    textAlign: 'center',
    marginTop: 10,
  },
});

interface CleanSpecSheetPDFProps {
  motorData: {
    motor: any;
    promotions: any[];
    motorModel: string;
  };
}

export function CleanSpecSheetPDF({ motorData }: CleanSpecSheetPDFProps) {
  const { motor, promotions, motorModel } = motorData;
  const specs = motor.specifications || {};
  
  // Extract HP from model name (e.g., "9.9HP FourStroke")
  const modelName = motor.model || motorModel;
  const hpMatch = modelName.match(/(\d+(?:\.\d+)?)\s*(?:HP|MH|ELH|ELPT|EXLPT)/i);
  const hpNumber = hpMatch ? parseFloat(hpMatch[1]) : (motor.horsepower || 0);
  
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

        {/* Motor Title */}
        <Text style={styles.motorTitle}>{motor.model || motorModel}</Text>
        <Text style={styles.motorSubtitle}>
          {motor.model_year || 2025} Mercury Marine • {hpNumber} HP
        </Text>

        {/* Price Box */}
        {(motor.dealer_price || motor.msrp) && (
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>MSRP</Text>
            <Text style={styles.priceValue}>
              ${((motor.msrp || motor.dealer_price || 0)).toLocaleString()}
            </Text>
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
              <Text style={styles.specValue}>
                {hpNumber <= 15 ? '2' : '4'}
              </Text>
            </View>
            
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Displacement</Text>
              <Text style={styles.specValue}>
                {displacement}
              </Text>
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
              <Text style={styles.specValue}>
                {weight}
              </Text>
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

        {/* Special Offers */}
        {promotions && promotions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <View style={styles.promoList}>
              {promotions.map((promo, index) => (
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Text style={styles.footerBold}>{COMPANY_INFO.name}</Text>
          </Text>
          <Text style={styles.footerText}>{COMPANY_INFO.address.full}</Text>
          <Text style={styles.footerText}>
            Phone: {COMPANY_INFO.contact.phone} | Email: {COMPANY_INFO.contact.email}
          </Text>
          <Text style={styles.footerText}>{COMPANY_INFO.contact.website}</Text>
          <Text style={styles.generatedDate}>Generated on {currentDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
