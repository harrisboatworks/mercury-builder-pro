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
    // Extract JSON data from script tags that contain motor information
    const jsonMatches = html.match(/"item":"[^"]*Mercury[^"]*","name":"[^"]*","locationid":[^}]*}/g)
    
    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const jsonData = JSON.parse(`{${match}}`)
          
          // Extract horsepower from the name or other fields
          const hpMatch = jsonData.name?.match(/(\d+(?:\.\d+)?)\s*HP/i)
          const hp = hpMatch ? parseFloat(hpMatch[1]) : 0
          
          // Determine motor type
          let motorType = 'Outboard'
          if (jsonData.name?.toLowerCase().includes('fourstroke')) {
            motorType = 'FourStroke'
          } else if (jsonData.name?.toLowerCase().includes('pro xs')) {
            motorType = 'Pro XS'
          } else if (jsonData.name?.toLowerCase().includes('verado')) {
            motorType = 'Verado'
          }

          const motor: MotorData = {
            make: jsonData.itemMake || 'Mercury',
            model: jsonData.name || jsonData.item || 'Unknown Model',
            year: jsonData.itemYear || 2025,
            horsepower: hp,
            base_price: jsonData.itemPrice || jsonData.unitPrice || 0,
            motor_type: motorType,
            image_url: jsonData.itemThumbNailUrl ? `https:${jsonData.itemThumbNailUrl}` : null,
            availability: 'In Stock', // Default, could be parsed from HTML if available
          }

          if (motor.horsepower > 0 && motor.base_price > 0) {
            motors.push(motor)
          }
        } catch (parseError) {
          console.warn('Failed to parse motor JSON:', parseError)
        }
      }
    }

    // Also try to parse from the main content structure
    const itemMatches = html.match(/<div[^>]*class="[^"]*item[^"]*"[^>]*>[\s\S]*?<\/div>/gi)
    
    if (itemMatches) {
      for (const itemHtml of itemMatches) {
        try {
          const nameMatch = itemHtml.match(/>([^<]*Mercury[^<]*)</i)
          const priceMatch = itemHtml.match(/\$([0-9,]+(?:\.\d{2})?)/i)
          const hpMatch = itemHtml.match(/(\d+(?:\.\d+)?)\s*(?:HP|bhp)/i)
          const imageMatch = itemHtml.match(/src="([^"]*(?:jpg|jpeg|png|gif)[^"]*)"/i)
          
          if (nameMatch && priceMatch && hpMatch) {
            const motor: MotorData = {
              make: 'Mercury',
              model: nameMatch[1].trim(),
              year: 2025,
              horsepower: parseFloat(hpMatch[1]),
              base_price: parseFloat(priceMatch[1].replace(/,/g, '')),
              motor_type: nameMatch[1].toLowerCase().includes('fourstroke') ? 'FourStroke' : 'Outboard',
              image_url: imageMatch ? `https:${imageMatch[1]}` : null,
              availability: 'In Stock',
            }
            
            motors.push(motor)
          }
        } catch (parseError) {
          console.warn('Failed to parse motor HTML:', parseError)
        }
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