import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import React from 'https://esm.sh/react@18.2.0';
import { renderToStream } from 'https://esm.sh/@react-pdf/renderer@3.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch motor details and active promotions in parallel
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

    // Generate PDF using basic HTML to PDF conversion
    // For now, return a simple HTML that can be converted client-side
    const htmlContent = generateBasicSpecSheet(motor, promotions || []);
    
    return new Response(
      JSON.stringify({ 
        htmlContent,
        motorModel: motor.model 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating spec sheet:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function generateBasicSpecSheet(motor: any, promotions: any[]): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const specs = motor.specifications || {};
  const hpNumber = motor.horsepower || 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: white;
      color: #111;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1e40af;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 5px;
    }
    .tagline {
      font-size: 14px;
      color: #666;
    }
    .motor-title {
      font-size: 32px;
      font-weight: bold;
      margin: 20px 0 10px 0;
      color: #111;
    }
    .motor-subtitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 20px;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .spec-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .spec-item {
      padding: 10px;
      background: #f9fafb;
      border-left: 3px solid #1e40af;
    }
    .spec-label {
      font-weight: bold;
      color: #374151;
      font-size: 14px;
    }
    .spec-value {
      color: #111;
      font-size: 14px;
      margin-top: 5px;
    }
    .price-box {
      background: #1e40af;
      color: white;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
      border-radius: 8px;
    }
    .price-label {
      font-size: 16px;
      opacity: 0.9;
    }
    .price-value {
      font-size: 36px;
      font-weight: bold;
      margin-top: 5px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .contact-info {
      margin-top: 10px;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      padding: 8px 0;
      padding-left: 20px;
      position: relative;
    }
    li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #059669;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">HARRIS BOAT WORKS</div>
    <div class="tagline">Authorized Mercury Marine Dealer - Gores Landing, ON</div>
  </div>

  <div class="motor-title">${motor.model || 'Motor'}</div>
  <div class="motor-subtitle">${motor.model_year || 2025} Mercury Marine • ${motor.horsepower || ''}HP</div>

  ${motor.dealer_price || motor.msrp ? `
  <div class="price-box">
    <div class="price-label">MSRP</div>
    <div class="price-value">$${motor.msrp || motor.dealer_price || 'Contact for Pricing'}</div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Technical Specifications</div>
    <div class="spec-grid">
      <div class="spec-item">
        <div class="spec-label">Horsepower</div>
        <div class="spec-value">${hpNumber} HP</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">Engine Type</div>
        <div class="spec-value">${specs['Engine Type'] || 'FourStroke'}</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">Cylinders</div>
        <div class="spec-value">${specs['Cylinders'] || (hpNumber <= 15 ? '2' : '4')}</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">Displacement</div>
        <div class="spec-value">${specs['Displacement'] || 'Contact dealer'}</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">Starting</div>
        <div class="spec-value">${specs['Starting'] || 'Electric'}</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">Fuel System</div>
        <div class="spec-value">${specs['Fuel System'] || 'EFI'}</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">Weight</div>
        <div class="spec-value">${specs['Weight'] || 'Contact dealer'}</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">Shaft Length</div>
        <div class="spec-value">${specs['Shaft Length'] || '20"'}</div>
      </div>
    </div>
  </div>

  ${promotions && promotions.length > 0 ? `
  <div class="section">
    <div class="section-title">Special Offers</div>
    <ul>
      ${promotions.map(promo => `
        <li><strong>${promo.name}</strong>: ${promo.bonus_description || promo.description || ''}</li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="footer">
    <strong>Harris Boat Works</strong><br>
    5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0<br>
    <div class="contact-info">
      Phone: (905) 342-2153 | Email: info@harrisboatworks.ca<br>
      quote.harrisboatworks.ca
    </div>
    <div style="margin-top: 20px; font-size: 12px;">
      Generated on ${currentDate}
    </div>
  </div>
</body>
</html>
  `.trim();
}
