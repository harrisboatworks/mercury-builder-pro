import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface QuoteData {
  quoteNumber: string | number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  motor: {
    model: string;
    hp: number;
    year?: number;
    sku?: string;
    category?: string;
  };
  motorSpecs?: {
    cylinders?: string;
    displacement?: string;
    weight_kg?: number;
    fuel_system?: string;
    starting?: string;
    alternator?: string;
    gear_ratio?: string;
    max_rpm?: string;
  };
  pricing: {
    msrp: number;
    discount: number;
    promoValue: number;
    subtotal: number;
    tradeInValue?: number;
    subtotalAfterTrade: number;
    hst: number;
    totalCashPrice: number;
    savings: number;
  };
  accessories?: Array<{ name: string; price: number }>;
  specs?: Array<{ label: string; value: string }>;
  financing?: {
    monthlyPayment: number;
    term: number;
    rate: number;
  };
  customerReview?: {
    comment: string;
    reviewer: string;
    location: string;
    rating: number;
  };
}

const generateHTML = (data: QuoteData): string => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mercury Motor Quote - ${data.quoteNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: white;
        }
        .page { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px;
            background: white;
        }
        
        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1e40af;
        }
        .logo-section {
            flex: 1;
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .tagline {
            color: #6b7280;
            font-size: 14px;
        }
        .quote-info {
            text-align: right;
            flex: 1;
        }
        .quote-number {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .quote-date {
            color: #6b7280;
            font-size: 14px;
        }
        .validity {
            color: #dc2626;
            font-weight: bold;
            font-size: 12px;
            margin-top: 5px;
        }

        /* Customer Section */
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .customer-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1e40af;
        }
        .customer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .customer-field {
            font-size: 14px;
        }
        .field-label {
            color: #6b7280;
            font-weight: bold;
            margin-bottom: 2px;
        }
        .field-value {
            color: #111827;
        }

        /* Motor Highlight */
        .motor-highlight {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
            box-shadow: 0 8px 25px rgba(30, 64, 175, 0.3);
        }
        .motor-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
        }
        .motor-specs {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .spec-item {
            text-align: center;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
        }
        .spec-label {
            font-size: 11px;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 3px;
        }
        .spec-value {
            font-size: 16px;
            font-weight: bold;
        }

        /* Pricing Table */
        .pricing-section {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        .pricing-header {
            background: #f3f4f6;
            padding: 15px 20px;
            font-weight: bold;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
        }
        .pricing-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            border-bottom: 1px solid #f3f4f6;
        }
        .pricing-row:last-child {
            border-bottom: none;
        }
        .pricing-label {
            color: #374151;
        }
        .pricing-value {
            font-weight: bold;
            color: #111827;
        }
        .discount-value, .promo-value, .tradein-value {
            color: #10b981;
        }
        .total-row {
            background: #1e40af;
            color: white;
            font-weight: bold;
            font-size: 18px;
        }
        .total-row .pricing-label,
        .total-row .pricing-value {
            color: white;
        }

        /* Savings Badge */
        .savings-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .savings-text {
            font-size: 20px;
            font-weight: bold;
        }

        /* Financing Section */
        .financing-box {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .financing-title {
            color: #92400e;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .financing-details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        .financing-item {
            text-align: center;
        }
        .financing-label {
            font-size: 12px;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .financing-value {
            font-size: 18px;
            font-weight: bold;
            color: #451a03;
        }

        /* Footer */
        .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #1e40af;
            text-align: center;
        }
        .company-footer {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .contact-info {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 20px;
        }
        .terms {
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.4;
            text-align: left;
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
        .terms-title {
            font-weight: bold;
            color: #374151;
            margin-bottom: 8px;
        }

        /* Print Styles */
        @media print {
            .page { margin: 0; padding: 20px; }
            .header { margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                <img src="https://quote.harrisboatworks.ca/assets/harris-logo.png" alt="Harris Boat Works" style="height: 60px; margin-bottom: 10px;" />
                <div class="company-name">Harris Boat Works</div>
                <div class="tagline">Your Trusted Mercury Dealer Since 1947</div>
            </div>
            <div class="quote-info">
                <div class="quote-number">Quote #HBW-${String(data.quoteNumber).padStart(6, '0')}</div>
                <div class="quote-date">${currentDate}</div>
                <div class="validity">Valid for 30 days</div>
            </div>
        </div>

        <!-- Customer Information -->
        <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="customer-info">
                <div class="customer-grid">
                    <div class="customer-field">
                        <div class="field-label">Name:</div>
                        <div class="field-value">${data.customerName}</div>
                    </div>
                    <div class="customer-field">
                        <div class="field-label">Email:</div>
                        <div class="field-value">${data.customerEmail}</div>
                    </div>
                    <div class="customer-field">
                        <div class="field-label">Phone:</div>
                        <div class="field-value">${data.customerPhone}</div>
                    </div>
                    <div class="customer-field">
                        <div class="field-label">Quote Date:</div>
                        <div class="field-value">${currentDate}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Motor Highlight -->
        <div class="motor-highlight">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                <div class="motor-title">
                    ${data.motor.year ? data.motor.year + ' ' : ''}Mercury ${data.motor.model}
                </div>
                <img src="https://quote.harrisboatworks.ca/assets/mercury-logo.png" alt="Mercury Marine" style="height: 40px;" />
            </div>
            <div class="motor-specs">
                <div class="spec-item">
                    <div class="spec-label">Horsepower</div>
                    <div class="spec-value">${data.motor.hp}HP</div>
                </div>
                ${data.motor.category ? `
                <div class="spec-item">
                    <div class="spec-label">Category</div>
                    <div class="spec-value">${data.motor.category}</div>
                </div>
                ` : ''}
                ${data.motorSpecs?.cylinders ? `
                <div class="spec-item">
                    <div class="spec-label">Engine Type</div>
                    <div class="spec-value">${data.motorSpecs.cylinders}</div>
                </div>
                ` : ''}
                ${data.motorSpecs?.displacement ? `
                <div class="spec-item">
                    <div class="spec-label">Displacement</div>
                    <div class="spec-value">${data.motorSpecs.displacement}</div>
                </div>
                ` : ''}
                ${data.motorSpecs?.fuel_system ? `
                <div class="spec-item">
                    <div class="spec-label">Fuel System</div>
                    <div class="spec-value">${data.motorSpecs.fuel_system}</div>
                </div>
                ` : ''}
                ${data.motorSpecs?.starting ? `
                <div class="spec-item">
                    <div class="spec-label">Starting</div>
                    <div class="spec-value">${data.motorSpecs.starting}</div>
                </div>
                ` : ''}
                ${data.motorSpecs?.weight_kg ? `
                <div class="spec-item">
                    <div class="spec-label">Weight</div>
                    <div class="spec-value">${data.motorSpecs.weight_kg}kg</div>
                </div>
                ` : ''}
                ${data.motorSpecs?.alternator ? `
                <div class="spec-item">
                    <div class="spec-label">Alternator</div>
                    <div class="spec-value">${data.motorSpecs.alternator}</div>
                </div>
                ` : ''}
                ${data.motor.year ? `
                <div class="spec-item">
                    <div class="spec-label">Model Year</div>
                    <div class="spec-value">${data.motor.year}</div>
                </div>
                ` : ''}
                ${data.motor.sku ? `
                <div class="spec-item">
                    <div class="spec-label">SKU</div>
                    <div class="spec-value">${data.motor.sku}</div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Pricing Breakdown -->
        <div class="section">
            <div class="section-title">Investment Summary</div>
            <div class="pricing-section">
                <div class="pricing-header">Pricing Breakdown</div>
                
                <div class="pricing-row">
                    <div class="pricing-label">MSRP (Motor${data.accessories?.length ? ' + Accessories' : ''})</div>
                    <div class="pricing-value">$${data.pricing.msrp.toLocaleString()}</div>
                </div>
                
                ${data.accessories?.map(accessory => `
                <div class="pricing-row" style="font-size: 14px; color: #6b7280;">
                    <div class="pricing-label" style="padding-left: 20px;">• ${accessory.name}</div>
                    <div class="pricing-value">$${accessory.price.toLocaleString()}</div>
                </div>
                `).join('') || ''}
                
                ${data.pricing.discount > 0 ? `
                <div class="pricing-row">
                    <div class="pricing-label">Harris Discount</div>
                    <div class="pricing-value discount-value">-$${data.pricing.discount.toLocaleString()}</div>
                </div>
                ` : ''}
                
                ${data.pricing.promoValue > 0 ? `
                <div class="pricing-row">
                    <div class="pricing-label">Promotional Savings</div>
                    <div class="pricing-value promo-value">-$${data.pricing.promoValue.toLocaleString()}</div>
                </div>
                ` : ''}
                
                <div class="pricing-row">
                    <div class="pricing-label">Your Price (Before Tax)</div>
                    <div class="pricing-value">$${data.pricing.subtotal.toLocaleString()}</div>
                </div>
                
                ${data.pricing.tradeInValue && data.pricing.tradeInValue > 0 ? `
                <div class="pricing-row">
                    <div class="pricing-label">Trade-In Credit</div>
                    <div class="pricing-value tradein-value">-$${data.pricing.tradeInValue.toLocaleString()}</div>
                </div>
                
                <div class="pricing-row">
                    <div class="pricing-label">Subtotal After Trade</div>
                    <div class="pricing-value">$${data.pricing.subtotalAfterTrade.toLocaleString()}</div>
                </div>
                ` : ''}
                
                <div class="pricing-row">
                    <div class="pricing-label">HST (13%)</div>
                    <div class="pricing-value">$${data.pricing.hst.toLocaleString()}</div>
                </div>
                
                <div class="pricing-row total-row">
                    <div class="pricing-label">TOTAL CASH PRICE</div>
                    <div class="pricing-value">$${data.pricing.totalCashPrice.toLocaleString()}</div>
                </div>
            </div>
            
            ${data.pricing.savings > 0 ? `
            <div class="savings-badge">
                <div class="savings-text">YOU SAVE $${data.pricing.savings.toLocaleString()}!</div>
            </div>
            ` : ''}
        </div>

        <!-- Financing Options -->
        ${data.financing ? `
        <div class="section">
            <div class="section-title">Financing Options Available</div>
            <div class="financing-box">
                <div class="financing-title">As low as $${data.financing.monthlyPayment.toLocaleString()}/month OAC</div>
                <div class="financing-details">
                    <div class="financing-item">
                        <div class="financing-label">Monthly Payment</div>
                        <div class="financing-value">$${data.financing.monthlyPayment.toLocaleString()}</div>
                    </div>
                    <div class="financing-item">
                        <div class="financing-label">Term</div>
                        <div class="financing-value">${data.financing.term} months</div>
                    </div>
                    <div class="financing-item">
                        <div class="financing-label">Interest Rate</div>
                        <div class="financing-value">${data.financing.rate}%</div>
                    </div>
                </div>
                <div style="font-size: 12px; color: #92400e; margin-top: 10px; text-align: center;">
                    *On Approved Credit (OAC). Rates and terms subject to credit approval.
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Customer Review -->
        ${data.customerReview ? `
        <div class="section">
            <div class="section-title">Customer Review</div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                <div style="font-style: italic; font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 15px;">
                    "${data.customerReview.comment}"
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold; color: #111827;">${data.customerReview.reviewer}</div>
                        <div style="color: #6b7280; font-size: 14px;">${data.customerReview.location}</div>
                    </div>
                    <div style="display: flex; color: #fbbf24;">
                        ${'★'.repeat(data.customerReview.rating)}${'☆'.repeat(5 - data.customerReview.rating)}
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
            <div class="company-footer">Harris Boat Works</div>
            <div class="contact-info">
                5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0<br>
                (905) 342-2153 | info@harrisboatworks.ca<br>
                Visit us at: quote.harrisboatworks.ca
            </div>
            
            <!-- QR Code and Online Link -->
            <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                    View this quote online at:
                </div>
                <div style="font-size: 16px; font-weight: bold; color: #1e40af;">
                    quote.harrisboatworks.ca/quote/HBW-${String(data.quoteNumber).padStart(6, '0')}
                </div>
            </div>
            
            <div class="terms">
                <div class="terms-title">Terms & Conditions</div>
                This quote is valid for 30 days from the date above. All prices are in Canadian dollars and include applicable taxes where noted. 
                Motor installation, rigging, and commissioning are additional. Trade-in values are estimates and subject to physical inspection. 
                Financing is subject to credit approval. Some restrictions may apply. Harris Boat Works is an authorized Mercury Marine dealer.
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { quoteData } = await req.json() as { quoteData: QuoteData };
    
    if (!quoteData) {
      return new Response(
        JSON.stringify({ error: 'Quote data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get PDF.co API key from secrets
    const apiKey = Deno.env.get('PDF_CO_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'PDF.co API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate HTML content
    const htmlContent = generateHTML(quoteData);

    // Convert HTML to PDF using PDF.co API
    const pdfResponse = await fetch('https://api.pdf.co/v1/pdf/convert/from/html', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        name: `Mercury-Quote-${quoteData.quoteNumber}.pdf`,
        margins: "10mm",
        paperSize: "Letter",
        orientation: "Portrait",
        printBackground: true,
        header: "",
        footer: "",
        inline: false,  // This makes it downloadable instead of just viewable
        async: false    // This makes it return immediately
      }),
    });

    const pdfResult = await pdfResponse.json();

    if (!pdfResponse.ok || pdfResult.error) {
      console.error('PDF.co API Error:', pdfResult);
      return new Response(
        JSON.stringify({ error: 'Failed to generate PDF', details: pdfResult }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl: pdfResult.url
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});