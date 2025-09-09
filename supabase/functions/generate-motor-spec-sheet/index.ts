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
  
  // Motor helper functions (inline implementation for edge function)
  const decodeModelName = (modelName: string) => {
    const decoded: Array<{code: string, meaning: string, benefit: string}> = []
    const name = modelName || ''
    const upper = name.toUpperCase()
    const added = new Set<string>()
    const add = (code: string, meaning: string, benefit: string) => {
      if (!added.has(code)) {
        decoded.push({ code, meaning, benefit })
        added.add(code)
      }
    }
    const hasWord = (w: string) => new RegExp(`\\b${w}\\b`).test(upper)
    const hpMatch = upper.match(/(\d+(?:\.\d+)?)HP/)
    const hp = hpMatch ? parseFloat(hpMatch[1]) : 0

    // Engine family & special designations
    if (/FOUR\s*STROKE|FOURSTROKE/i.test(name)) add('FourStroke', '4-Stroke Engine', 'Quiet, fuel-efficient')
    if (/SEAPRO/i.test(name)) add('SeaPro', 'Commercial Grade', 'Built for heavy use')
    if (/PROKICKER/i.test(name)) add('ProKicker', 'Kicker Motor', 'Optimized for trolling')
    if (/JET\b/i.test(name)) add('Jet', 'Jet Drive', 'Great for shallow water')
    if (/BIGFOOT/i.test(name)) add('BigFoot', 'High Thrust', 'Ideal for pontoons')

    // Handle combinations
    if (upper.includes('MLH')) {
      add('M', 'Manual Start', 'Pull cord — simple & reliable')
      add('L', 'Long Shaft (20")', 'For 20" transom boats')
      add('H', 'Tiller Handle', 'Steer directly from motor')
    } else if (upper.includes('MH')) {
      add('M', 'Manual Start', 'Pull cord — simple & reliable')
      add('H', 'Tiller Handle', 'Steer directly from motor')
    } else if (upper.includes('EH')) {
      add('E', 'Electric Start', 'Push-button convenience')
      add('H', 'Tiller Handle', 'Direct steering control')
    }

    // Shaft length (if not handled in combos)
    if (!added.has('L') && !added.has('S')) {
      if (hasWord('L')) add('L', 'Long Shaft (20")', 'For 20" transom boats')
      else add('S', 'Short Shaft (15")', 'For 15" transom boats')
    }

    return decoded
  }

  const getIncludedAccessories = (motor: any) => {
    const accessories = []
    const hp = motor.horsepower
    const model = (motor.model || '').toUpperCase()
    const isTiller = /(MH|MLH|EH|ELH|TILLER)/i.test(model)
    
    // Fuel tank inclusion
    if (isTiller || (hp >= 9.9 && hp <= 20)) {
      if (isTiller) {
        accessories.push('Internal fuel tank')
      } else {
        accessories.push('12L portable fuel tank')
        accessories.push('Fuel line & primer bulb')
      }
    }
    
    // Propeller inclusion
    if (isTiller) {
      accessories.push('Standard propeller')
    }
    
    // Standard items
    accessories.push('Owner\'s manual & warranty')
    accessories.push('Tool kit')
    
    return accessories
  }

  const getIdealUses = (hp: number) => {
    if (hp <= 6) return ['Dinghies & tenders', 'Canoes & kayaks', 'Emergency backup', 'Trolling']
    if (hp <= 30) return ['Aluminum fishing boats', 'Small pontoons', 'Day cruising', 'Lake fishing']
    if (hp <= 90) return ['Family pontoons', 'Bass boats', 'Runabouts', 'Water sports']
    if (hp <= 150) return ['Large pontoons', 'Offshore fishing', 'Performance boats', 'Tournament fishing']
    return ['High-performance boats', 'Commercial use', 'Offshore racing', 'Heavy loads']
  }

  const getKeyAdvantages = (hp: number) => {
    if (hp <= 6) return ['Lightweight & portable', 'Fuel efficient operation', 'Quiet performance', 'Manual start reliability']
    if (hp <= 30) return ['Versatile performance', 'Easy maintenance', 'Fuel efficient', 'Compact design']
    if (hp <= 90) return ['Balanced power & efficiency', 'Advanced fuel injection', 'Smooth operation', 'SmartCraft ready']
    return ['Maximum performance', 'Advanced technology', 'High-speed capability', 'Professional grade']
  }
  
  // Generate comprehensive specifications with smart defaults
  const generateEngineSpecs = (motor: any) => {
    const hp = motor.horsepower
    const engineType = motor.engine_type || (hp >= 40 ? 'Four Stroke' : 'Four Stroke')
    const displacement = specs.displacement || generateDisplacement(hp)
    const cylinders = specs.cylinders || generateCylinders(hp)
    const bore_stroke = specs.bore_stroke || generateBoreStroke(hp)
    const rpm_range = specs.full_throttle_rpm || generateRPMRange(hp)
    const fuel_system = specs.fuel_induction || generateFuelSystem(hp)
    
    return { engineType, displacement, cylinders, bore_stroke, rpm_range, fuel_system }
  }
  
  const generatePhysicalSpecs = (motor: any) => {
    const hp = motor.horsepower
    const weight = specs.dry_weight || generateWeight(hp)
    const gear_ratio = specs.gear_ratio || generateGearRatio(hp)
    const alternator = specs.alternator || generateAlternator(hp)
    const oil_type = specs.recommended_oil || 'Mercury 25W-40 4-Stroke Marine Oil'
    const fuel_octane = specs.recommended_fuel || '87 Octane Minimum'
    const shaft_options = specs.shaft_options || generateShaftOptions(motor.model)
    
    return { weight, gear_ratio, alternator, oil_type, fuel_octane, shaft_options }
  }
  
  const generatePerformanceData = (motor: any) => {
    const hp = motor.horsepower
    const fuel_economy = specs.fuel_economy || generateFuelEconomy(hp)
    const top_speed = specs.top_speed || generateTopSpeed(hp)
    const noise_level = specs.noise_level || generateNoiseLevel(hp)
    
    return { fuel_economy, top_speed, noise_level }
  }
  
  const engineSpecs = generateEngineSpecs(motor)
  const physicalSpecs = generatePhysicalSpecs(motor)
  const performanceData = generatePerformanceData(motor)
  const modelBreakdown = decodeModelName(motor.model)
  const includedItems = getIncludedAccessories(motor)
  const idealUses = getIdealUses(motor.horsepower)
  const keyAdvantages = getKeyAdvantages(motor.horsepower)
  
  // Use text-based logos as fallback for better PDF compatibility
  const harrisLogoHtml = `
    <div style="display: inline-block; background: #1e40af; color: white; padding: 8px 12px; border-radius: 4px; font-family: Arial, sans-serif;">
      <div style="font-size: 12px; font-weight: bold; line-height: 1.2;">HARRIS BOAT WORKS</div>
      <div style="font-size: 8px; line-height: 1.2;">Rice Lake, ON</div>
    </div>
  `
  const mercuryLogoHtml = `
    <div style="display: inline-block; background: #1e40af; color: white; padding: 8px 12px; border-radius: 4px; font-family: Arial, sans-serif;">
      <div style="font-size: 14px; font-weight: bold; line-height: 1.2;">MERCURY</div>
      <div style="font-size: 8px; line-height: 1.2;">MARINE</div>
    </div>
  `
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${motor.model} - Technical Specifications</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.2;
            background: white;
            color: #333;
            font-size: 10pt;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            margin: 0 auto;
            background: white;
        }
        
        /* Compact Header with Motor Image */
        .header {
            background: #000;
            color: white;
            padding: 15px 20px;
            margin: -10mm -10mm 15px -10mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 60px;
        }
        
        .header-logo {
            height: 30px;
            width: auto;
        }
        
        .header-content {
            flex: 1;
            text-align: center;
            padding: 0 15px;
        }
        
        .motor-title {
            font-size: 20pt;
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .header-subtitle {
            font-size: 10pt;
            color: #ccc;
            text-transform: uppercase;
        }
        
        .motor-image-header {
            position: absolute;
            right: 15px;
            top: 70px;
            width: 250px;
            text-align: center;
        }
        
        .motor-image {
            max-width: 200px;
            max-height: 120px;
            object-fit: contain;
        }
        
        /* Two Column Layout */
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 40px;
        }
        
        .column {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        /* Section Styling */
        .section {
            border: 1px solid #ddd;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .section-header {
            background: #007DC5;
            color: white;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 12pt;
        }
        
        .section-content {
            padding: 12px;
        }
        
        /* Model Breakdown */
        .model-codes {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 10px;
        }
        
        .model-code {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #f5f5f5;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 9pt;
        }
        
        .code-badge {
            background: #007DC5;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8pt;
            font-weight: bold;
        }
        
        /* Lists */
        .item-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .list-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 9pt;
        }
        
        .checkmark {
            color: #28a745;
            font-weight: bold;
        }
        
        .bullet {
            color: #007DC5;
            font-weight: bold;
        }
        
        /* Specification Tables */
        .spec-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .spec-row {
            border-bottom: 1px solid #eee;
        }
        
        .spec-row:nth-child(even) {
            background: #f9f9f9;
        }
        
        .spec-label {
            padding: 6px 8px;
            font-weight: 600;
            font-size: 9pt;
            width: 60%;
        }
        
        .spec-value {
            padding: 6px 8px;
            font-size: 9pt;
            text-align: right;
            width: 40%;
        }
        
        /* Full Width Sections */
        .full-width {
            grid-column: 1 / -1;
            margin: 15px 0;
        }
        
        .performance-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin: 10px 0;
        }
        
        .performance-item {
            text-align: center;
            padding: 8px;
            background: #f0f8ff;
            border-radius: 4px;
        }
        
        .performance-value {
            font-size: 14pt;
            font-weight: bold;
            color: #007DC5;
        }
        
        .performance-label {
            font-size: 8pt;
            color: #666;
            margin-top: 2px;
        }
        
        /* Footer */
        .footer {
            margin-top: 20px;
            padding: 15px;
            border-top: 2px solid #007DC5;
            text-align: center;
            font-size: 9pt;
        }
        
        .dealer-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 10px 0;
        }
        
        .contact-item {
            text-align: left;
        }
        
        .contact-label {
            font-weight: bold;
            color: #000;
        }
        
        .tagline {
            font-style: italic;
            color: #007DC5;
            margin: 10px 0;
            font-size: 11pt;
        }
        
        .disclaimer {
            font-size: 8pt;
            color: #777;
            margin-top: 15px;
        }
        
        @media print {
            body { margin: 0; }
            .page { margin: 0; padding: 8mm; }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Compact Header -->
        <div class="header">
            ${harrisLogoHtml}
            <div class="header-content">
                <div class="motor-title">MERCURY ${motor.horsepower}HP ${motor.motor_type?.toUpperCase() || ''}</div>
                <div class="header-subtitle">Technical Specifications</div>
            </div>
            ${mercuryLogoHtml}
        </div>
        
        <!-- Small Motor Image (Right Aligned) -->
        ${motor.image_url ? `
        <div class="motor-image-header">
            <img src="${motor.image_url}" alt="${motor.model}" class="motor-image">
            <div style="font-size: 8pt; color: #666; margin-top: 5px;">${motor.model}</div>
        </div>
        ` : ''}
        
        <!-- Two Column Content -->
        <div class="content-grid">
            <!-- LEFT COLUMN -->
            <div class="column">
                <!-- Understanding This Model -->
                <div class="section">
                    <div class="section-header">Understanding This Model</div>
                    <div class="section-content">
                        ${modelBreakdown.length > 0 ? `
                        <div class="model-codes">
                            ${modelBreakdown.map(item => `
                            <div class="model-code">
                                <span class="code-badge">${item.code}</span>
                                <div>
                                    <div style="font-weight: 600;">${item.meaning}</div>
                                    <div style="color: #666; font-size: 8pt;">${item.benefit}</div>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- What's Included -->
                <div class="section">
                    <div class="section-header" style="background: #28a745;">✓ What's Included</div>
                    <div class="section-content">
                        <div class="item-list">
                            ${includedItems.map(item => `
                            <div class="list-item">
                                <span class="checkmark">✓</span>
                                <span>${item}</span>
                            </div>
                            `).join('')}
                        </div>
                        ${motor.base_price ? `
                        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: bold;">MSRP:</span>
                                <span style="font-size: 14pt; font-weight: bold; color: #007DC5;">$${motor.base_price?.toLocaleString()}</span>
                            </div>
                            <div style="font-size: 8pt; color: #666; margin-top: 5px;">
                                Professional installation available • Contact for promotions
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Engine Specifications -->
                <div class="section">
                    <div class="section-header">Engine Specifications</div>
                    <div class="section-content">
                        <table class="spec-table">
                            <tr class="spec-row">
                                <td class="spec-label">Horsepower:</td>
                                <td class="spec-value">${motor.horsepower} HP</td>
                            </tr>
                            <tr class="spec-row">
                                <td class="spec-label">Displacement:</td>
                                <td class="spec-value">${engineSpecs.displacement}</td>
                            </tr>
                            <tr class="spec-row">
                                <td class="spec-label">Cylinders:</td>
                                <td class="spec-value">${engineSpecs.cylinders}</td>
                            </tr>
                            <tr class="spec-row">
                                <td class="spec-label">Bore & Stroke:</td>
                                <td class="spec-value">${engineSpecs.bore_stroke}</td>
                            </tr>
                            <tr class="spec-row">
                                <td class="spec-label">Fuel System:</td>
                                <td class="spec-value">${engineSpecs.fuel_system}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- RIGHT COLUMN -->
            <div class="column">
                <!-- Ideal Applications -->
                <div class="section">
                    <div class="section-header">Ideal Applications</div>
                    <div class="section-content">
                        <div class="item-list">
                            ${idealUses.map(use => `
                            <div class="list-item">
                                <span style="color: #007DC5;">🎯</span>
                                <span>${use}</span>
                            </div>
                            `).join('')}
                        </div>
                        <div style="margin-top: 10px; padding: 8px; background: #e8f4fd; border-radius: 4px;">
                            <strong style="color: #007DC5; font-size: 9pt;">Recommended Boat Size:</strong>
                            <span style="font-size: 9pt; margin-left: 5px;">
                                ${motor.horsepower <= 6 ? 'Up to 12ft' : 
                                  motor.horsepower <= 15 ? '12-16ft' : 
                                  motor.horsepower <= 30 ? '14-18ft' : 
                                  motor.horsepower <= 60 ? '16-20ft' : 
                                  motor.horsepower <= 90 ? '18-22ft' : 
                                  motor.horsepower <= 115 ? '20-24ft' : '22ft+'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Physical Specifications -->
                <div class="section">
                    <div class="section-header">Physical Specifications</div>
                    <div class="section-content">
                        <table class="spec-table">
                            <tr class="spec-row">
                                <td class="spec-label">Weight:</td>
                                <td class="spec-value">${physicalSpecs.weight}</td>
                            </tr>
                            <tr class="spec-row">
                                <td class="spec-label">Gear Ratio:</td>
                                <td class="spec-value">${physicalSpecs.gear_ratio}</td>
                            </tr>
                            <tr class="spec-row">
                                <td class="spec-label">Alternator:</td>
                                <td class="spec-value">${physicalSpecs.alternator}</td>
                            </tr>
                            <tr class="spec-row">
                                <td class="spec-label">Oil Type:</td>
                                <td class="spec-value">${physicalSpecs.oil_type}</td>
                            </tr>
                            <tr class="spec-row">
                                <td class="spec-label">Fuel Octane:</td>
                                <td class="spec-value">${physicalSpecs.fuel_octane}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <!-- Features & Technology -->
                <div class="section">
                    <div class="section-header">Features & Technology</div>
                    <div class="section-content">
                        <div class="item-list">
                            ${features.length > 0 ? features.map(feature => `
                            <div class="list-item">
                                <span class="bullet">•</span>
                                <span>${feature}</span>
                            </div>
                            `).join('') : keyAdvantages.slice(0, 4).map(advantage => `
                            <div class="list-item">
                                <span class="bullet">•</span>
                                <span>${advantage}</span>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Full Width Performance Data -->
        <div class="section full-width">
            <div class="section-header">Performance Data</div>
            <div class="section-content">
                <div class="performance-grid">
                    <div class="performance-item">
                        <div class="performance-value">${performanceData.fuel_economy}</div>
                        <div class="performance-label">Fuel Economy</div>
                    </div>
                    <div class="performance-item">
                        <div class="performance-value">${performanceData.top_speed}</div>
                        <div class="performance-label">Est. Top Speed</div>
                    </div>
                    <div class="performance-item">
                        <div class="performance-value">${performanceData.noise_level}</div>
                        <div class="performance-label">Noise Level</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Key Advantages (Full Width, Bullets Only) -->
        <div class="section full-width">
            <div class="section-header">Key Advantages</div>
            <div class="section-content">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                    ${keyAdvantages.map(advantage => `
                    <div class="list-item">
                        <span class="bullet">•</span>
                        <span>${advantage}</span>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Professional Footer -->
        <div class="footer">
            <div style="font-weight: bold; font-size: 12pt; color: #000;">Harris Boat Works</div>
            <div class="tagline">"Go Boldly" - Authorized Mercury Marine Dealer</div>
            
            <div class="dealer-info">
                <div class="contact-item">
                    <div class="contact-label">Address:</div>
                    <div>123 Boat Works Drive<br>Rice Lake, ON K0M 2H0</div>
                </div>
                <div class="contact-item">
                    <div class="contact-label">Contact:</div>
                    <div>Phone: (705) 555-BOAT<br>Email: info@harrisboatworks.ca</div>
                </div>
            </div>
            
            <div style="font-weight: bold; margin: 10px 0;">
                🌐 quote.harrisboatworks.ca - Get Your Quote Online
            </div>
            
            <div class="disclaimer">
                Specifications subject to change without notice. Consult your Harris Boat Works dealer for current specifications, warranty details, and promotional pricing. Professional installation recommended. All Mercury Marine warranties apply.
            </div>
            
            <div style="font-size: 8pt; color: #999; margin-top: 10px;">
                Generated: ${new Date().toLocaleDateString()} | Harris Boat Works - Your Mercury Marine Experts
            </div>
        </div>
    </div>
</body>
</html>`
}

// Helper functions for generating specifications
function generateDisplacement(hp: number): string {
  if (hp <= 6) return `${Math.round(hp * 24)}cc`
  if (hp <= 25) return `${Math.round(hp * 20)}cc / ${(hp * 1.22).toFixed(1)} cu in`
  if (hp <= 60) return `${Math.round(hp * 25)}cc / ${(hp * 1.53).toFixed(1)} cu in`
  if (hp <= 150) return `${Math.round(hp * 17)}cc / ${(hp * 1.04).toFixed(1)} cu in`
  return `${Math.round(hp * 14)}cc / ${(hp * 0.85).toFixed(1)} cu in`
}

function generateCylinders(hp: number): string {
  if (hp <= 6) return '1 Cylinder'
  if (hp <= 15) return '2 Cylinder Inline'
  if (hp <= 60) return '3 Cylinder Inline'
  if (hp <= 115) return '4 Cylinder Inline'
  if (hp <= 225) return 'V6'
  return 'V8'
}

function generateBoreStroke(hp: number): string {
  if (hp <= 6) return '2.36" x 2.13"'
  if (hp <= 15) return '2.36" x 2.36"'
  if (hp <= 60) return '3.05" x 3.05"'
  if (hp <= 115) return '3.5" x 3.05"'
  return '3.5" x 3.4"'
}

function generateRPMRange(hp: number): string {
  if (hp <= 6) return '4500-5500 RPM'
  if (hp <= 15) return '5000-6000 RPM'
  if (hp <= 60) return '5500-6500 RPM'
  return '5800-6400 RPM'
}

function generateFuelSystem(hp: number): string {
  if (hp <= 15) return 'Carburetor'
  if (hp <= 60) return 'Electronic Fuel Injection (EFI)'
  return 'Direct Fuel Injection (DFI)'
}

function generateWeight(hp: number): string {
  const weight = Math.round(hp * 4.2 + 85)
  return `${weight} lbs (${Math.round(weight * 0.45)} kg)`
}

function generateGearRatio(hp: number): string {
  if (hp <= 6) return '2.15:1'
  if (hp <= 25) return '2.08:1'
  if (hp <= 60) return '1.83:1'
  if (hp <= 150) return '1.75:1'
  return '1.75:1'
}

function generateAlternator(hp: number): string {
  if (hp <= 15) return 'Not Available'
  if (hp <= 60) return '12 Amp'
  if (hp <= 150) return '20 Amp'
  return '60 Amp'
}

function generateShaftOptions(model: string): string {
  if (model.includes('ELH') || model.includes('ELPT')) return '20" Long Shaft'
  if (model.includes('EH') || model.includes('MLH')) return '15" Short, 20" Long'
  return '15" Short, 20" Long, 25" Extra Long'
}

function generateStartingType(model: string): string {
  if (model.includes('E')) return 'Electric Start'
  return 'Manual Recoil Start'
}

function generateSteeringType(hp: number): string {
  if (hp >= 40) return 'Remote Control Required'
  return 'Tiller Handle or Remote Control'
}

function generateTrimTilt(hp: number): string {
  if (hp <= 15) return 'Manual Tilt'
  if (hp <= 60) return 'Power Tilt Available'
  return 'Power Trim & Tilt Standard'
}

function generateWarranty(hp: number): string {
  if (hp <= 15) return '3-Year Limited Warranty'
  if (hp <= 60) return '3-Year Limited Warranty'
  return '3-Year Limited Warranty + Extended Options'
}

function generateFuelEconomy(hp: number): string {
  const gph = (hp * 0.5).toFixed(1)
  return `${gph} GPH @ 4000 RPM`
}

function generateTopSpeed(hp: number): string {
  const speed = Math.round(hp * 0.85 + 15)
  return `${speed}+ MPH (conditions dependent)`
}

function generateNoiseLevel(hp: number): string {
  const db = Math.round(78 + (hp * 0.15))
  return `${db} dB @ 1000 RPM`
}