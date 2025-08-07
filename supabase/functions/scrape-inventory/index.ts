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

    // Fetch all pages of Harris Boat Works inventory
    let allMotors: MotorData[] = []
    let pageNumber = 1
    let hasMorePages = true
    
    while (hasMorePages && pageNumber <= 10) { // Safety limit of 10 pages
      const url = pageNumber === 1 
        ? 'https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low'
        : `https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low/page/${pageNumber}`
      
      console.log(`Fetching page ${pageNumber}: ${url}`)
      
      const response = await fetch(url)
      if (!response.ok) {
        console.log(`Failed to fetch page ${pageNumber}: ${response.status}`)
        break
      }
      
      const html = await response.text()
      const pageMotors = parseMotorData(html)
      
      if (pageMotors.length === 0) {
        console.log(`No motors found on page ${pageNumber}, stopping`)
        hasMorePages = false
      } else {
        console.log(`Found ${pageMotors.length} motors on page ${pageNumber}`)
        allMotors = allMotors.concat(pageMotors)
        pageNumber++
        
        // Check if there are more results (looking for pagination indicators)
        if (!html.includes('next') && !html.includes(`page/${pageNumber}`)) {
          hasMorePages = false
        }
      }
      
      // Small delay between requests to be respectful
      if (hasMorePages) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log(`Total motors collected from all pages: ${allMotors.length}`)
    const motors = allMotors
    
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
    
    // Strategy 1: Extract structured JSON data from hidden datasource spans
    const datasourceMatches = html.match(/<span class="datasource hidden[^>]*>[\s\S]*?<\/span>/gi) || []
    
    for (const spanMatch of datasourceMatches) {
      try {
        // Extract JSON from the span content
        const jsonMatch = spanMatch.match(/>\s*({.*})\s*</s)
        if (jsonMatch) {
          const motorData = JSON.parse(jsonMatch[1])
          
          // Extract horsepower from the name or item field
          const motorName = motorData.name || motorData.item || ''
          const hpMatch = motorName.match(/(\d+(?:\.\d+)?)\s*(?:HP|bhp)/i)
          const hp = hpMatch ? parseFloat(hpMatch[1]) : 0
          
          if (hp > 0 && motorData.itemMake === 'Mercury') {
            const availability = motorData.stockNumber ? 'In Stock' : 'Brochure'
            const imageUrl = motorData.itemThumbNailUrl ? 
              `https:${motorData.itemThumbNailUrl}` : 
              getMotorImageUrl(motorName)
            
            const motor: MotorData = {
              make: 'Mercury',
              model: motorName.replace(/ - Mercury$/, ''),
              year: motorData.itemYear || 2025,
              horsepower: hp,
              base_price: motorData.itemPrice || 0,
              motor_type: getMotorType(motorName),
              image_url: imageUrl,
              availability: availability,
              stock_number: motorData.stockNumber || null,
            }
            motors.push(motor)
          }
        }
      } catch (e) {
        console.error('Error parsing datasource JSON:', e)
      }
    }

    // Strategy 2: Parse title and price from HTML structure if JSON fails
    if (motors.length === 0) {
      console.log('JSON parsing failed, trying HTML structure parsing...')
      
      const unitCardMatches = html.match(/<div class="row unit-card">[\s\S]*?(?=<div class="row unit-card">|$)/gi) || []
      
      for (const cardHtml of unitCardMatches) {
        try {
          // Extract title
          const titleMatch = cardHtml.match(/<h3[^>]*results-heading[^>]*>[\s\S]*?<a[^>]*title="([^"]*Mercury[^"]*)"[^>]*>/i)
          if (!titleMatch) continue
          
          const fullTitle = titleMatch[1]
          const hpMatch = fullTitle.match(/(\d+(?:\.\d+)?)\s*(?:HP|bhp)/i)
          if (!hpMatch) continue
          
          const hp = parseFloat(hpMatch[1])
          
          // Extract price
          const priceMatch = cardHtml.match(/<span[^>]*itemprop="price"[^>]*>\$([0-9,]+(?:\.\d{2})?)<\/span>/i)
          const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0
          
          // Extract availability
          const availabilityMatch = cardHtml.match(/<span class="label[^"]*"[^>]*>([^<]+)</i)
          const availability = availabilityMatch ? availabilityMatch[1].trim() : 'Brochure'
          
          // Extract image URL
          const imageMatch = cardHtml.match(/src="([^"]*ThumbGenerator[^"]*)"/) || 
                           cardHtml.match(/data-srcset="([^"]*ThumbGenerator[^"]*)"/)
          const imageUrl = imageMatch ? imageMatch[1] : getMotorImageUrl(fullTitle)
          
          const motor: MotorData = {
            make: 'Mercury',
            model: fullTitle.replace(/ - Mercury$/, ''),
            year: 2025,
            horsepower: hp,
            base_price: price,
            motor_type: getMotorType(fullTitle),
            image_url: imageUrl,
            availability: availability,
            stock_number: null,
          }
          motors.push(motor)
          
        } catch (e) {
          console.error('Error parsing unit card:', e)
        }
      }
    }

  } catch (error) {
    console.error('Error parsing motor data:', error)
  }

  // Remove duplicates based on model name and horsepower
  const uniqueMotors = motors.filter((motor, index, self) => 
    index === self.findIndex(m => m.model === motor.model && m.horsepower === motor.horsepower)
  )

  console.log(`Parsed ${uniqueMotors.length} unique motors from page`)
  return uniqueMotors
}

function getMotorType(name: string): string {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('verado')) return 'Verado'
  if (lowerName.includes('pro xs')) return 'Pro XS'
  if (lowerName.includes('fourstroke')) return 'FourStroke'
  return 'Outboard'
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