import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { motorId } = await req.json()

    if (!motorId) {
      return new Response(
        JSON.stringify({ error: 'Motor ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch motor details
    const { data: motor, error: motorError } = await supabase
      .from('motor_models')
      .select('*')
      .eq('id', motorId)
      .single()

    if (motorError || !motor) {
      console.error('Motor fetch error:', motorError)
      return new Response(
        JSON.stringify({ error: 'Motor not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Generate HTML content for client-side PDF generation
    const htmlContent = generateSpecSheetHTML(motor)
    
    console.log('Returning HTML content for client-side PDF generation for motor:', motor.model)
    
    return new Response(
      JSON.stringify({ 
        htmlContent: htmlContent,
        motorModel: motor.model 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating spec sheet:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function generateSpecSheetHTML(motor: any): string {
  const specs = motor.specifications || {}
  const features = motor.features || []
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${motor.model} - Specification Sheet</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #0066cc;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 10px;
        }
        .motor-title {
            font-size: 28px;
            font-weight: bold;
            margin: 10px 0;
            color: #333;
        }
        .motor-subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 20px;
        }
        .specs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .spec-section {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            background: #f9f9f9;
        }
        .spec-section h3 {
            margin-top: 0;
            color: #0066cc;
            border-bottom: 1px solid #0066cc;
            padding-bottom: 10px;
        }
        .spec-item {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
        }
        .spec-label {
            font-weight: bold;
            color: #333;
        }
        .spec-value {
            color: #555;
        }
        .features-section {
            margin: 30px 0;
            padding: 20px;
            background: #f0f8ff;
            border-radius: 8px;
            border: 1px solid #0066cc;
        }
        .features-section h3 {
            color: #0066cc;
            margin-top: 0;
        }
        .features-list {
            columns: 2;
            column-gap: 30px;
        }
        .feature-item {
            margin: 10px 0;
            padding: 5px 0;
            break-inside: avoid;
        }
        .feature-item::before {
            content: "✓ ";
            color: #0066cc;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Mercury Marine</div>
        <div class="motor-title">${motor.model}</div>
        <div class="motor-subtitle">${motor.horsepower}HP ${motor.motor_type} Motor</div>
    </div>

    <div class="specs-grid">
        <div class="spec-section">
            <h3>Engine Specifications</h3>
            <div class="spec-item">
                <span class="spec-label">Horsepower:</span>
                <span class="spec-value">${motor.horsepower} HP</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Engine Type:</span>
                <span class="spec-value">${motor.engine_type || 'Four Stroke'}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Motor Type:</span>
                <span class="spec-value">${motor.motor_type}</span>
            </div>
            ${specs.displacement ? `
            <div class="spec-item">
                <span class="spec-label">Displacement:</span>
                <span class="spec-value">${specs.displacement}</span>
            </div>` : ''}
            ${specs.cylinders ? `
            <div class="spec-item">
                <span class="spec-label">Cylinders:</span>
                <span class="spec-value">${specs.cylinders}</span>
            </div>` : ''}
        </div>

        <div class="spec-section">
            <h3>Physical Specifications</h3>
            ${specs.dryWeight ? `
            <div class="spec-item">
                <span class="spec-label">Dry Weight:</span>
                <span class="spec-value">${specs.dryWeight}</span>
            </div>` : ''}
            ${specs.shaftLength ? `
            <div class="spec-item">
                <span class="spec-label">Shaft Length:</span>
                <span class="spec-value">${specs.shaftLength}</span>
            </div>` : ''}
            ${specs.steering ? `
            <div class="spec-item">
                <span class="spec-label">Steering:</span>
                <span class="spec-value">${specs.steering}</span>
            </div>` : ''}
            ${specs.startingType ? `
            <div class="spec-item">
                <span class="spec-label">Starting:</span>
                <span class="spec-value">${specs.startingType}</span>
            </div>` : ''}
        </div>

        <div class="spec-section">
            <h3>Performance & Fuel</h3>
            ${specs.fuelType ? `
            <div class="spec-item">
                <span class="spec-label">Fuel Type:</span>
                <span class="spec-value">${specs.fuelType}</span>
            </div>` : ''}
            ${specs.fuelCapacity ? `
            <div class="spec-item">
                <span class="spec-label">Fuel Capacity:</span>
                <span class="spec-value">${specs.fuelCapacity}</span>
            </div>` : ''}
            ${specs.gearRatio ? `
            <div class="spec-item">
                <span class="spec-label">Gear Ratio:</span>
                <span class="spec-value">${specs.gearRatio}</span>
            </div>` : ''}
            ${specs.maxRpm ? `
            <div class="spec-item">
                <span class="spec-label">Max RPM:</span>
                <span class="spec-value">${specs.maxRpm}</span>
            </div>` : ''}
        </div>

        <div class="spec-section">
            <h3>Pricing Information</h3>
            <div class="spec-item">
                <span class="spec-label">MSRP:</span>
                <span class="spec-value">$${motor.base_price?.toLocaleString() || 'Contact for pricing'}</span>
            </div>
            ${motor.sale_price ? `
            <div class="spec-item">
                <span class="spec-label">Sale Price:</span>
                <span class="spec-value">$${motor.sale_price.toLocaleString()}</span>
            </div>` : ''}
            <div class="spec-item">
                <span class="spec-label">Model Year:</span>
                <span class="spec-value">${motor.year}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Availability:</span>
                <span class="spec-value">${motor.availability || 'Contact Dealer'}</span>
            </div>
        </div>
    </div>

    ${features.length > 0 ? `
    <div class="features-section">
        <h3>Key Features & Benefits</h3>
        <div class="features-list">
            ${features.map((feature: string) => `<div class="feature-item">${feature}</div>`).join('')}
        </div>
    </div>` : ''}

    ${motor.description ? `
    <div class="spec-section" style="grid-column: 1 / -1; margin: 30px 0;">
        <h3>Description</h3>
        <p style="line-height: 1.8; color: #555;">${motor.description}</p>
    </div>` : ''}

    <div class="footer">
        <p>Mercury Marine - ${motor.model} Specification Sheet</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <p>Specifications subject to change without notice. Contact your dealer for the most current information.</p>
    </div>
</body>
</html>`
}