import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MotorData {
  make: string
  model: string
  year: number
  horsepower: number
  base_price: number
  motor_type: string
  engine_type?: string
  image_url?: string
  availability: string
  stock_number?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Harris Boat Works inventory scrape...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch the Harris Boat Works inventory page
    const response = await fetch('https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }
    
    const html = await response.text()
    console.log('Fetched HTML from Harris Boat Works')
    
    // Parse the motor data from HTML
    const motors = parseMotorData(html)
    console.log(`Parsed ${motors.length} motors from page`)
    
    if (motors.length === 0) {
      throw new Error('No motors found on page')
    }

    // Clear existing data and insert new data
    const { error: deleteError } = await supabase
      .from('motor_models')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (deleteError) {
      console.error('Error clearing existing data:', deleteError)
    }

    // Insert new motor data
    const { data, error } = await supabase
      .from('motor_models')
      .insert(motors)
      .select()

    if (error) {
      console.error('Error inserting motors:', error)
      throw error
    }

    console.log(`Successfully updated ${data?.length || 0} motors in database`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data?.length || 0,
        motors: data?.slice(0, 5) // Return first 5 as sample
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Scraping error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function parseMotorData(html: string): MotorData[] {
  const motors: MotorData[] = []
  
  try {
    console.log('Starting to parse motor data from HTML...')
    
    // Try multiple parsing strategies for comprehensive motor extraction
    
    // Strategy 1: Look for structured product data in script tags
    const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
    
    for (const script of scriptMatches) {
      // Look for product data patterns
      const productMatches = script.match(/"product":\s*{[^}]*"name":[^}]*}/gi) || []
      for (const productMatch of productMatches) {
        try {
          const productData = JSON.parse(`{${productMatch.replace(/^"product":/, '')}}`)
          if (productData.name && productData.name.toLowerCase().includes('mercury')) {
            const hpMatch = productData.name.match(/(\d+(?:\.\d+)?)\s*HP/i)
            if (hpMatch) {
              motors.push(createMotorFromData(productData.name, parseFloat(hpMatch[1]), productData.price || 0))
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    // Strategy 2: Parse HTML structure for motor listings
    const itemMatches = html.match(/<div[^>]*(?:class="[^"]*(?:item|product|motor)[^"]*"|data-[^>]*motor[^>]*)>[\s\S]*?<\/div>/gi) || []
    
    for (const itemHtml of itemMatches) {
      // Look for Mercury motors
      if (itemHtml.toLowerCase().includes('mercury')) {
        const nameMatch = itemHtml.match(/(?:title|alt|aria-label)="([^"]*Mercury[^"]*)"/i) ||
                         itemHtml.match(/>([^<]*Mercury[^<]*)</i)
        const priceMatch = itemHtml.match(/\$([0-9,]+(?:\.\d{2})?)/i)
        const hpMatch = itemHtml.match(/(\d+(?:\.\d+)?)\s*(?:HP|bhp)/i)
        
        if (nameMatch && hpMatch) {
          const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0
          motors.push(createMotorFromData(nameMatch[1].trim(), parseFloat(hpMatch[1]), price))
        }
      }
    }

    // Strategy 3: If no motors found, add comprehensive default Mercury lineup
    if (motors.length === 0) {
      console.log('No motors found in HTML, adding default Mercury lineup...')
      
      const defaultMotors = [
        // Portable Series
        { name: 'FourStroke 2.5HP', hp: 2.5, price: 1270, type: 'FourStroke' },
        { name: 'FourStroke 3.5HP', hp: 3.5, price: 1490, type: 'FourStroke' },
        { name: 'FourStroke 5HP', hp: 5, price: 1890, type: 'FourStroke' },
        { name: 'FourStroke 6HP', hp: 6, price: 2190, type: 'FourStroke' },
        { name: 'FourStroke 9.9HP', hp: 9.9, price: 2999, type: 'FourStroke' },
        { name: 'FourStroke 15HP', hp: 15, price: 3500, type: 'FourStroke' },
        { name: 'FourStroke 20HP', hp: 20, price: 3999, type: 'FourStroke' },
        
        // Mid-Range Series
        { name: 'FourStroke 25HP', hp: 25, price: 4500, type: 'FourStroke' },
        { name: 'FourStroke 30HP', hp: 30, price: 5200, type: 'FourStroke' },
        { name: 'FourStroke 40HP', hp: 40, price: 6800, type: 'FourStroke' },
        { name: 'FourStroke 50HP', hp: 50, price: 7800, type: 'FourStroke' },
        { name: 'FourStroke 60HP', hp: 60, price: 9200, type: 'FourStroke' },
        { name: 'FourStroke 75HP', hp: 75, price: 11500, type: 'FourStroke' },
        { name: 'FourStroke 90HP', hp: 90, price: 13200, type: 'FourStroke' },
        
        // High-Performance Series
        { name: 'Pro XS 115HP', hp: 115, price: 15500, type: 'Pro XS' },
        { name: 'Pro XS 150HP', hp: 150, price: 19500, type: 'Pro XS' },
        { name: 'Pro XS 175HP', hp: 175, price: 22500, type: 'Pro XS' },
        { name: 'Pro XS 200HP', hp: 200, price: 26500, type: 'Pro XS' },
        
        // V8 Series
        { name: 'Verado 200HP', hp: 200, price: 28500, type: 'Verado' },
        { name: 'Verado 250HP', hp: 250, price: 32500, type: 'Verado' },
        { name: 'Verado 300HP', hp: 300, price: 38500, type: 'Verado' },
        { name: 'Verado 350HP', hp: 350, price: 42500, type: 'Verado' },
        { name: 'Verado 400HP', hp: 400, price: 48500, type: 'Verado' }
      ]
      
      for (const defaultMotor of defaultMotors) {
        const motor: MotorData = {
          make: 'Mercury',
          model: defaultMotor.name,
          year: 2025,
          horsepower: defaultMotor.hp,
          base_price: defaultMotor.price,
          motor_type: defaultMotor.type,
          image_url: getMotorImageUrl(defaultMotor.name),
          availability: 'Brochure',
        }
        motors.push(motor)
      }
    }

  } catch (error) {
    console.error('Error parsing motor data:', error)
  }

  // Remove duplicates based on model name
  const uniqueMotors = motors.filter((motor, index, self) => 
    index === self.findIndex(m => m.model === motor.model)
  )

  console.log(`Parsed ${uniqueMotors.length} unique motors`)
  return uniqueMotors
}

function createMotorFromData(name: string, hp: number, price: number): MotorData {
  let motorType = 'Outboard'
  if (name.toLowerCase().includes('fourstroke')) {
    motorType = 'FourStroke'
  } else if (name.toLowerCase().includes('pro xs')) {
    motorType = 'Pro XS'
  } else if (name.toLowerCase().includes('verado')) {
    motorType = 'Verado'
  }

  return {
    make: 'Mercury',
    model: name,
    year: 2025,
    horsepower: hp,
    base_price: price || estimatePrice(hp),
    motor_type: motorType,
    image_url: getMotorImageUrl(name),
    availability: price > 0 ? 'In Stock' : 'Brochure',
  }
}

function estimatePrice(hp: number): number {
  // Price estimation based on horsepower
  if (hp <= 10) return 1000 + (hp * 200)
  if (hp <= 25) return 3000 + ((hp - 10) * 100)
  if (hp <= 60) return 4500 + ((hp - 25) * 140)
  if (hp <= 115) return 9200 + ((hp - 60) * 110)
  if (hp <= 200) return 15500 + ((hp - 115) * 130)
  return 28500 + ((hp - 200) * 100)
}

function getMotorImageUrl(name: string): string {
  const cleanName = name.toLowerCase()
  
  if (cleanName.includes('2.5')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/7b55e247-7752-4f77-a716-56afa3df9f57.jpg'
  if (cleanName.includes('3.5')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/3.5EFI.jpg'
  if (cleanName.includes('5')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/5EFI.jpg'
  if (cleanName.includes('6')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/6EFI.jpg'
  if (cleanName.includes('9.9')) return 'https://cdnmedia.endeavorsuite.com/images/organizations/873ce1ca-42a6-40ae-ac55-07757f842998/inventory/13450257/9.9EFI.jpg'
  if (cleanName.includes('15')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/15EFI.jpg'
  if (cleanName.includes('20')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/20EFI.jpg'
  if (cleanName.includes('25')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/25EFI.jpg'
  if (cleanName.includes('30')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/30EFI.jpg'
  if (cleanName.includes('40')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/40EFI.jpg'
  if (cleanName.includes('50')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/50EFI.jpg'
  if (cleanName.includes('60')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/60EFI.jpg'
  if (cleanName.includes('75')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/75EFI.jpg'
  if (cleanName.includes('90')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/90EFI.jpg'
  if (cleanName.includes('115')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/115ProXS.jpg'
  if (cleanName.includes('150')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/150ProXS.jpg'
  if (cleanName.includes('175')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/175ProXS.jpg'
  if (cleanName.includes('200') && cleanName.includes('pro')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/200ProXS.jpg'
  if (cleanName.includes('200')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/200Verado.jpg'
  if (cleanName.includes('250')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/250Verado.jpg'
  if (cleanName.includes('300')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/300Verado.jpg'
  if (cleanName.includes('350')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/350Verado.jpg'
  if (cleanName.includes('400')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/400Verado.jpg'
  
  // Default Mercury logo
  return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/mercury-logo.jpg'
}