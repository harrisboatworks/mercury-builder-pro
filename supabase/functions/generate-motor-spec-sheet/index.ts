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
    if (/FOUR\s*STROKE|FOURSTROKE/i.test(name)) add('FourStroke', '4-Stroke Engine', 'Quiet, fuel-efficient, no oil mixing')
    if (/SEAPRO/i.test(name)) add('SeaPro', 'Commercial Grade', 'Built for heavy use & durability')
    if (/PROKICKER/i.test(name)) add('ProKicker', 'Kicker Motor', 'Optimized for trolling & backup power')
    if (/JET\b/i.test(name)) add('Jet', 'Jet Drive', 'Great for shallow water operation')
    if (/BIGFOOT/i.test(name)) add('BigFoot', 'High Thrust', 'Ideal for pontoons & heavy boats')

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
    if (hp <= 6) return ['Lightweight & portable', 'Fuel efficient operation', 'Quiet performance', 'Manual start reliability', 'No battery required']
    if (hp <= 30) return ['Versatile performance', 'Easy maintenance', 'Fuel efficient', 'Compact design', 'Proven reliability']
    if (hp <= 90) return ['Balanced power & efficiency', 'Advanced fuel injection', 'Smooth operation', 'SmartCraft ready', 'Commercial grade durability']
    return ['Maximum performance', 'Advanced technology', 'High-speed capability', 'Professional grade', 'Tournament proven']
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
  
  // Harris and Mercury logos as base64 data URLs (embedded for PDF generation)
  const harrisLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIxMDAiIHk9IjM1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iYmxhY2siPkhBUlJJUzwvdGV4dD4KPHR4dCB4PSIxMDAiIHk9IjU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSJibGFjayI+Qk9BVCBXT1JLUzwvdGV4dD4KPHR4dCB4PSIxMDAiIHk9IjcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSJibGFjayI+UmljZSBMYWtlLCBPTjwvdGV4dD4KPC9zdmc+'
  const mercuryLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ3aGl0ZSIvPgo8Y2lyY2xlIGN4PSI0MCIgY3k9IjUwIiByPSIzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIi8+Cjx0ZXh0IHg9IjkwIiB5PSI1NSIgZm9udC1zaXplPSIyOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9ImJsYWNrIj5NRVJDVVJZPC90ZXh0Pgo8L3N2Zz4='
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${motor.model} - Technical Specifications</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4;
            background: white;
            color: #333;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            background: white;
            position: relative;
        }
        
        /* Professional Header */
        .header {
            background: #000000;
            color: white;
            padding: 20px;
            margin: -15mm -15mm 25px -15mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 80px;
        }
        
        .header-logo {
            height: 50px;
            width: auto;
        }
        
        .header-content {
            flex: 1;
            text-align: center;
            padding: 0 20px;
        }
        
        .motor-title {
            font-size: 28px;
            font-weight: bold;
            color: white;
            margin-bottom: 5px;
            letter-spacing: 1px;
        }
        
        .header-subtitle {
            font-size: 14px;
            color: #ccc;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        
        /* Motor Image Section */
        .motor-image-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .motor-image {
            max-width: 300px;
            max-height: 200px;
            object-fit: contain;
            border-radius: 8px;
        }
        
        /* Specifications Grid */
        .specs-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        
        .spec-section {
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .spec-header {
            background: #007DC5;
            color: white;
            padding: 12px 16px;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .spec-table {
            width: 100%;
        }
        
        .spec-row {
            display: flex;
            border-bottom: 1px solid #f1f3f4;
        }
        
        .spec-row:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .spec-row:last-child {
            border-bottom: none;
        }
        
        .spec-label {
            flex: 1;
            padding: 10px 16px;
            font-weight: 600;
            color: #333;
            font-size: 13px;
        }
        
        .spec-value {
            flex: 1;
            padding: 10px 16px;
            color: #555;
            font-size: 13px;
            text-align: right;
        }
        
        /* Features Section */
        .features-section {
            grid-column: 1 / -1;
            background: #f0f8ff;
            border: 2px solid #007DC5;
            border-radius: 8px;
            overflow: hidden;
            margin: 20px 0;
        }
        
        .features-header {
            background: #007DC5;
            color: white;
            padding: 12px 16px;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
        }
        
        .features-grid {
            padding: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            margin: 5px 0;
            font-size: 13px;
        }
        
        .feature-check {
            color: #007DC5;
            font-weight: bold;
            margin-right: 8px;
        }
        
        /* Full Width Sections */
        .full-width-section {
            grid-column: 1 / -1;
        }
        
        /* Performance Data Section */
        .performance-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 1px solid #dee2e6;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #007DC5;
            text-align: center;
        }
        
        .dealer-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .dealer-header {
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
        }
        
        .contact-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 15px 0;
        }
        
        .contact-item {
            font-size: 13px;
            color: #555;
        }
        
        .contact-label {
            font-weight: bold;
            color: #333;
        }
        
        .disclaimer {
            font-size: 11px;
            color: #777;
            margin-top: 20px;
            font-style: italic;
        }
        
        .generation-date {
            font-size: 10px;
            color: #999;
            text-align: right;
            margin-top: 10px;
        }
        
        @media print {
            body { margin: 0; }
            .page { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Professional Header -->
        <div class="header">
            <img src="${harrisLogo}" alt="Harris Boat Works" class="header-logo">
            <div class="header-content">
                <div class="motor-title">MERCURY ${motor.horsepower} HP ${motor.motor_type?.toUpperCase()}</div>
                <div class="header-subtitle">TECHNICAL SPECIFICATIONS</div>
            </div>
            <img src="${mercuryLogo}" alt="Mercury Marine" class="header-logo">
        </div>
        
        ${motor.image_url ? `
        <!-- Motor Image -->
        <div class="motor-image-section">
            <img src="${motor.image_url}" alt="${motor.model}" class="motor-image">
            <div style="margin-top: 10px; font-size: 14px; color: #666; font-style: italic;">${motor.model}</div>
        </div>
        ` : ''}
        
        <!-- Understanding This Model Section -->
        <div class="spec-section full-width-section" style="margin-bottom: 25px;">
            <div class="spec-header">Understanding This Model</div>
            <div style="padding: 20px;">
                ${modelBreakdown.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #333;">Model Code Breakdown:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                        ${modelBreakdown.map(item => `
                        <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                            <span style="background: #007DC5; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; min-width: fit-content;">
                                ${item.code}
                            </span>
                            <div>
                                <div style="font-size: 12px; font-weight: 600; color: #333;">${item.meaning}</div>
                                <div style="font-size: 10px; color: #666;">${item.benefit}</div>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${motor.horsepower <= 30 && /(MH|MLH|EH|ELH)/i.test(motor.model) ? `
                <div style="background: #e3f2fd; border: 1px solid #007DC5; border-radius: 6px; padding: 12px; margin-top: 15px;">
                    <strong style="color: #007DC5;">Tiller Handle Advantage:</strong>
                    <span style="font-size: 12px; color: #333;"> Perfect for precise boat control when fishing. Allows you to steer and control throttle from the back of the boat.</span>
                </div>
                ` : motor.horsepower >= 40 ? `
                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 12px; margin-top: 15px;">
                    <strong style="color: #856404;">Remote Control Required:</strong>
                    <span style="font-size: 12px; color: #333;"> This motor requires console steering with remote throttle and shift controls. Too powerful for tiller operation.</span>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- What's Included Section -->
        <div class="spec-section full-width-section" style="margin-bottom: 25px;">
            <div class="spec-header" style="background: #28a745; color: white;">
                <span style="margin-right: 8px;">✓</span> What's Included
            </div>
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 8px;">
                    ${includedItems.map(item => `
                    <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 13px;">
                        <span style="color: #28a745; font-weight: bold;">✓</span>
                        <span style="color: #333;">${item}</span>
                    </div>
                    `).join('')}
                </div>
                
                ${motor.base_price ? `
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 16px; font-weight: bold; color: #333;">MSRP:</span>
                        <span style="font-size: 20px; font-weight: bold; color: #007DC5;">$${motor.base_price?.toLocaleString()}</span>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        • Professional installation available<br>
                        • Contact for current promotions<br>
                        • Extended warranty options
                    </div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Key Advantages Section -->
        <div class="spec-section full-width-section" style="margin-bottom: 25px;">
            <div class="spec-header">Key Advantages</div>
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                    ${keyAdvantages.map(advantage => `
                    <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                        <span style="color: #007DC5; font-size: 14px;">•</span>
                        <span style="font-size: 12px; color: #333; font-weight: 500;">${advantage}</span>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Ideal Applications Section -->
        <div class="spec-section full-width-section" style="margin-bottom: 25px;">
            <div class="spec-header">Ideal Applications</div>
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                    ${idealUses.map(use => `
                    <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0;">
                        <span style="color: #007DC5; font-size: 16px;">🎯</span>
                        <span style="font-size: 13px; color: #333;">${use}</span>
                    </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 15px; padding: 12px; background: #e8f4fd; border-radius: 6px; border: 1px solid #007DC5;">
                    <strong style="color: #007DC5; font-size: 12px;">Recommended Boat Size:</strong>
                    <span style="font-size: 12px; color: #333; margin-left: 5px;">
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
        
        <!-- Specifications Grid -->
        <div class="specs-container">
            <!-- Engine Specifications -->
            <div class="spec-section">
                <div class="spec-header">Engine Specifications</div>
                <div class="spec-table">
                    <div class="spec-row">
                        <div class="spec-label">Horsepower:</div>
                        <div class="spec-value">${motor.horsepower} HP @ ${engineSpecs.rpm_range}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Displacement:</div>
                        <div class="spec-value">${engineSpecs.displacement}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Cylinder Configuration:</div>
                        <div class="spec-value">${engineSpecs.cylinders}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Bore & Stroke:</div>
                        <div class="spec-value">${engineSpecs.bore_stroke}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Full Throttle RPM:</div>
                        <div class="spec-value">${engineSpecs.rpm_range}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Fuel Induction System:</div>
                        <div class="spec-value">${engineSpecs.fuel_system}</div>
                    </div>
                </div>
            </div>
            
            <!-- Physical Specifications -->
            <div class="spec-section">
                <div class="spec-header">Physical Specifications</div>
                <div class="spec-table">
                    <div class="spec-row">
                        <div class="spec-label">Weight:</div>
                        <div class="spec-value">${physicalSpecs.weight}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Gear Ratio:</div>
                        <div class="spec-value">${physicalSpecs.gear_ratio}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Alternator:</div>
                        <div class="spec-value">${physicalSpecs.alternator}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Recommended Oil:</div>
                        <div class="spec-value">${physicalSpecs.oil_type}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Recommended Fuel:</div>
                        <div class="spec-value">${physicalSpecs.fuel_octane}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Shaft Length Options:</div>
                        <div class="spec-value">${physicalSpecs.shaft_options}</div>
                    </div>
                </div>
            </div>
            
            <!-- Features Section -->
            <div class="spec-section full-width-section">
                <div class="spec-header">Features & Technology</div>
                <div class="spec-table">
                    <div class="spec-row">
                        <div class="spec-label">Starting:</div>
                        <div class="spec-value">${generateStartingType(motor.model)}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Steering:</div>
                        <div class="spec-value">${generateSteeringType(motor.horsepower)}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Trim & Tilt:</div>
                        <div class="spec-value">${generateTrimTilt(motor.horsepower)}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Cooling System:</div>
                        <div class="spec-value">Water-cooled w/ thermostat</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Warranty:</div>
                        <div class="spec-value">${generateWarranty(motor.horsepower)}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">SmartCraft Compatible:</div>
                        <div class="spec-value">${motor.horsepower >= 40 ? 'Yes' : 'Available'}</div>
                    </div>
                </div>
            </div>
            
            <!-- Performance Data -->
            <div class="spec-section performance-section full-width-section">
                <div class="spec-header">Performance Data</div>
                <div class="spec-table">
                    <div class="spec-row">
                        <div class="spec-label">Fuel Economy at Cruise:</div>
                        <div class="spec-value">${performanceData.fuel_economy}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Top Speed Capability:</div>
                        <div class="spec-value">${performanceData.top_speed}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">Noise Level:</div>
                        <div class="spec-value">${performanceData.noise_level}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-label">MSRP:</div>
                        <div class="spec-value">$${motor.base_price?.toLocaleString() || 'Contact for pricing'}</div>
                    </div>
                </div>
            </div>
        </div>
        
        ${features.length > 0 ? `
        <!-- Key Features -->
        <div class="features-section">
            <div class="features-header">Key Features & Benefits</div>
            <div class="features-grid">
                ${features.map((feature: string) => `
                    <div class="feature-item">
                        <span class="feature-check">✓</span>
                        <span>${feature}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="footer">
            <div class="dealer-info">
                <div class="dealer-header">HARRIS BOAT WORKS - Authorized Mercury Marine Dealer</div>
                <div style="text-align: center; margin: 15px 0; padding: 12px; background: linear-gradient(135deg, #007DC5, #0056b3); border-radius: 8px; color: white;">
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">"Go Boldly"</div>
                    <div style="font-size: 12px;">Your Mercury Marine adventure starts here</div>
                </div>
                <div class="contact-info">
                    <div class="contact-item">
                        <span class="contact-label">Phone:</span> (705) 645-5274
                    </div>
                    <div class="contact-item">
                        <span class="contact-label">Website:</span> quote.harrisboatworks.ca
                    </div>
                    <div class="contact-item">
                        <span class="contact-label">Location:</span> Rice Lake, Ontario
                    </div>
                    <div class="contact-item">
                        <span class="contact-label">Email:</span> info@harrisboatworks.ca
                    </div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #007DC5;">
                    <div style="font-weight: bold; color: #007DC5; margin-bottom: 8px;">Why Choose Mercury Marine?</div>
                    <div style="font-size: 11px; color: #555; line-height: 1.4;">
                        • #1 Marine Engine Brand Worldwide<br>
                        • Unmatched Reliability & Performance<br>
                        • Comprehensive Warranty Coverage<br>
                        • Global Service Network Support<br>
                        • Proven Innovation Since 1939
                    </div>
                </div>
                <div class="disclaimer">
                    Specifications subject to change without notice. Mercury Marine warranty applies. 
                    Professional installation recommended. Contact dealer for current pricing and promotions.
                    <br><br>
                    <strong>Expert Installation & Service:</strong> Harris Boat Works provides professional installation, 
                    service, and parts for all Mercury Marine products. Our certified technicians ensure optimal performance and warranty compliance.
                </div>
                <div class="generation-date">
                    Generated: ${new Date().toLocaleDateString()} | Harris Boat Works Quote System v2.0
                </div>
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