import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import React from 'https://esm.sh/react@18.2.0';
import { Document, Page, Text, View, StyleSheet, renderToStream } from 'https://esm.sh/@react-pdf/renderer@3.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PDF Styles
const colors = {
  primary: '#1e40af',
  text: '#111827',
  lightText: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  white: '#ffffff',
  green: '#059669'
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: `3 solid ${colors.primary}`,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  tagline: {
    fontSize: 14,
    color: colors.lightText,
  },
  motorTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: colors.text,
  },
  motorSubtitle: {
    fontSize: 16,
    color: colors.lightText,
    marginBottom: 20,
  },
  priceBox: {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: 20,
    textAlign: 'center',
    marginVertical: 20,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 16,
    opacity: 0.9,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 5,
  },
  section: {
    marginVertical: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: `2 solid ${colors.border}`,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  specItem: {
    width: '48%',
    padding: 10,
    backgroundColor: colors.background,
    borderLeft: `3 solid ${colors.primary}`,
  },
  specLabel: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 14,
  },
  specValue: {
    color: colors.text,
    fontSize: 14,
    marginTop: 5,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: `2 solid ${colors.border}`,
    textAlign: 'center',
    color: colors.lightText,
    fontSize: 14,
  },
  contactInfo: {
    marginTop: 10,
  },
  promoList: {
    marginTop: 10,
  },
  promoItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 20,
  },
  checkmark: {
    color: colors.green,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

// PDF Document Component
const SpecSheetDocument = ({ motor, promotions }: any) => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const specs = motor.specifications || {};
  const hpNumber = motor.horsepower || 0;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>HARRIS BOAT WORKS</Text>
          <Text style={styles.tagline}>Authorized Mercury Marine Dealer - Gores Landing, ON</Text>
        </View>

        {/* Motor Title */}
        <Text style={styles.motorTitle}>{motor.model || 'Motor'}</Text>
        <Text style={styles.motorSubtitle}>
          {motor.model_year || 2025} Mercury Marine • {motor.horsepower || ''}HP
        </Text>

        {/* Price Box */}
        {(motor.dealer_price || motor.msrp) && (
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>MSRP</Text>
            <Text style={styles.priceValue}>
              ${motor.msrp || motor.dealer_price || 'Contact for Pricing'}
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
              <Text style={styles.specValue}>{specs['Engine Type'] || 'FourStroke'}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Cylinders</Text>
              <Text style={styles.specValue}>{specs['Cylinders'] || (hpNumber <= 15 ? '2' : '4')}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Displacement</Text>
              <Text style={styles.specValue}>{specs['Displacement'] || 'Contact dealer'}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Starting</Text>
              <Text style={styles.specValue}>{specs['Starting'] || 'Electric'}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Fuel System</Text>
              <Text style={styles.specValue}>{specs['Fuel System'] || 'EFI'}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Weight</Text>
              <Text style={styles.specValue}>{specs['Weight'] || 'Contact dealer'}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Shaft Length</Text>
              <Text style={styles.specValue}>{specs['Shaft Length'] || '20"'}</Text>
            </View>
          </View>
        </View>

        {/* Special Offers */}
        {promotions && promotions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <View style={styles.promoList}>
              {promotions.map((promo: any, index: number) => (
                <View key={index} style={styles.promoItem}>
                  <Text style={styles.checkmark}>✓</Text>
                  <Text>
                    <Text style={{ fontWeight: 'bold' }}>{promo.name}</Text>
                    {': '}
                    {promo.bonus_description || promo.description || ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontWeight: 'bold' }}>Harris Boat Works</Text>
          <Text>5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</Text>
          <View style={styles.contactInfo}>
            <Text>Phone: (905) 342-2153 | Email: info@harrisboatworks.ca</Text>
            <Text>quote.harrisboatworks.ca</Text>
          </View>
          <Text style={{ marginTop: 20, fontSize: 12 }}>
            Generated on {currentDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { motorId } = await req.json();

    if (!motorId) {
      return new Response(
        JSON.stringify({ error: 'Motor ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch motor details and active promotions
    const [
      { data: motor, error: motorError },
      { data: promotions, error: promoError }
    ] = await Promise.all([
      supabase
        .from('motor_models')
        .select('*')
        .eq('id', motorId)
        .single(),
      supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .or('end_date.is.null,end_date.gte.now()')
        .order('priority', { ascending: false })
        .limit(3)
    ]);

    if (motorError || !motor) {
      console.error('Motor fetch error:', motorError);
      return new Response(
        JSON.stringify({ error: 'Motor not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (promoError) {
      console.warn('Promotions fetch error:', promoError);
    }

    console.log('Generating PDF for motor:', motor.model);

    // Generate PDF using React PDF Renderer
    const stream = await renderToStream(
      React.createElement(SpecSheetDocument, { motor, promotions: promotions || [] })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Return PDF as binary
    return new Response(buffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Motor-Spec-${motor.model || 'Sheet'}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating spec sheet:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
