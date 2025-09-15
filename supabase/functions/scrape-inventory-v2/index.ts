import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Motor parsing function
async function parseMotorsFromHTML(html: string) {
  console.log('🔍 Starting motor parsing...')
  const motors = []
  
  // Horsepower patterns to look for
  const hpPatterns = [
    '15 HP', '20 HP', '25 HP', '30 HP', '40 HP', '50 HP',
    '60 HP', '75 HP', '90 HP', '115 HP', '150 HP', '175 HP',
    '200 HP', '225 HP', '250 HP', '300 HP', '350 HP', '400 HP'
  ]
  
  // Create a more flexible regex to find motor information
  const motorRegex = /(?:Mercury|MERCURY).*?(\d+)\s*(?:HP|hp|Hp).*?(?:\$([0-9,]+))?/gi
  const matches = html.matchAll(motorRegex)
  
  for (const match of matches) {
    const fullMatch = match[0]
    const horsepower = parseInt(match[1])
    const priceStr = match[2]
    
    // Parse price if found
    let price = null
    if (priceStr) {
      price = parseFloat(priceStr.replace(/,/g, ''))
    }
    
    // Extract model information from the surrounding context
    let model = `Mercury ${horsepower}HP`
    let motorType = 'Outboard'
    
    // Try to get more context around the match
    const matchIndex = html.indexOf(fullMatch)
    const contextStart = Math.max(0, matchIndex - 200)
    const contextEnd = Math.min(html.length, matchIndex + 200)
    const context = html.substring(contextStart, contextEnd)
    
    // Look for common Mercury model names in context
    const modelPatterns = [
      /FourStroke/i,
      /SeaPro/i,
      /Pro XS/i,
      /Verado/i,
      /OptiMax/i,
      /EFI/i
    ]
    
    for (const pattern of modelPatterns) {
      if (pattern.test(context)) {
        const modelMatch = context.match(pattern)
        if (modelMatch) {
          model = `Mercury ${horsepower}HP ${modelMatch[0]}`
          break
        }
      }
    }
    
    // Determine motor type based on HP
    if (horsepower >= 200) {
      motorType = 'High Performance Outboard'
    } else if (horsepower >= 75) {  
      motorType = 'Mid Range Outboard'
    } else {
      motorType = 'Portable Outboard'
    }
    
    const motor = {
      make: 'Mercury',
      model: model,
      horsepower: horsepower,
      motor_type: motorType,
      base_price: price,
      year: 2025,
      availability: 'Available',
      inventory_source: 'firecrawl_v2',
      last_scraped: new Date().toISOString(),
      data_sources: {
        harris: {
          success: true,
          scraped_at: new Date().toISOString()
        }
      }
    }
    
    motors.push(motor)
    console.log('🎯 Found motor:', model, `${horsepower}HP`, price ? `$${price}` : 'No price')
  }
  
  // Remove duplicates based on model and horsepower
  const uniqueMotors = motors.filter((motor, index, self) => 
    index === self.findIndex(m => m.model === motor.model && m.horsepower === motor.horsepower)
  )
  
  console.log('🧹 Unique motors after deduplication:', uniqueMotors.length)
  return uniqueMotors
}

// Database save function
async function saveMotorsToDatabase(motors: any[]) {
  console.log('💾 Attempting to save motors to database...')
  let savedCount = 0
  
  for (const motor of motors) {
    try {
      // Check if motor already exists
      const { data: existing } = await supabase
        .from('motor_models')
        .select('id')
        .eq('make', motor.make)
        .eq('model', motor.model)
        .eq('horsepower', motor.horsepower)
        .maybeSingle()
      
      if (existing) {
        // Update existing motor
        const { error: updateError } = await supabase
          .from('motor_models')
          .update({
            base_price: motor.base_price,
            last_scraped: motor.last_scraped,
            data_sources: motor.data_sources,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        
        if (updateError) {
          console.error('❌ Error updating motor:', updateError)
        } else {
          console.log('🔄 Updated existing motor:', motor.model)
          savedCount++
        }
      } else {
        // Insert new motor
        const { error: insertError } = await supabase
          .from('motor_models')
          .insert([motor])
        
        if (insertError) {
          console.error('❌ Error inserting motor:', insertError)
        } else {
          console.log('✅ Inserted new motor:', motor.model)
          savedCount++
        }
      }
    } catch (error) {
      console.error('❌ Database error for motor:', motor.model, error)
    }
  }
  
  return savedCount
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://quote.harrisboatworks.ca',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  
  // Health check endpoint
  if (url.pathname.endsWith('/health')) {
    return new Response(
      JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'Function is running correctly'
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }

  try {
    // Get request body for POST requests
    const body = req.method === 'POST' ? await req.json() : {}
    const pagesToScrape = body.pages_to_scrape || 1

    console.log('🔥 Starting scrape with pages:', pagesToScrape)

    // Test Firecrawl API
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    console.log('🔑 FIRECRAWL_API_KEY exists:', !!firecrawlApiKey)
    
    if (firecrawlApiKey) {
      console.log('🔑 API key starts with:', firecrawlApiKey.substring(0, 8) + '...')
      
      // Test Firecrawl v1 API
      const testUrl = 'https://www.harrisboatworks.ca'
      console.log('🌐 Testing Firecrawl v1 with URL:', testUrl)
      
      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testUrl,
          formats: ['html', 'markdown']
        })
      })
      
      console.log('📊 Firecrawl response status:', firecrawlResponse.status)
      
      if (firecrawlResponse.ok) {
        const firecrawlData = await firecrawlResponse.json()
        console.log('✅ Firecrawl raw response keys:', Object.keys(firecrawlData))
        console.log('📄 HTML length:', firecrawlData.data?.html?.length || 0)
        console.log('📄 Markdown length:', firecrawlData.data?.markdown?.length || 0)
        console.log('🔍 HTML preview:', firecrawlData.data?.html?.substring(0, 200) || 'No HTML')
        
        // Parse motors from HTML
        const htmlData = firecrawlData.data?.html || ''
        const parsedMotors = await parseMotorsFromHTML(htmlData)
        console.log('🏗️ Parsed motors count:', parsedMotors.length)
        
        // Save motors to database if any found
        let savedMotors = 0
        if (parsedMotors.length > 0) {
          savedMotors = await saveMotorsToDatabase(parsedMotors)
          console.log('💾 Saved motors to database:', savedMotors)
        }
        
        const result = {
          success: true,
          message: `Firecrawl v1 successful! Found ${parsedMotors.length} motors, saved ${savedMotors} to database`,
          firecrawl_status: firecrawlResponse.status,
          html_length: firecrawlData.data?.html?.length || 0,
          markdown_length: firecrawlData.data?.markdown?.length || 0,
          motors_found: parsedMotors.length,
          motors_saved: savedMotors,
          api_version: 'v1',
          timestamp: new Date().toISOString()
        }
        
        return new Response(
          JSON.stringify(result),
          { 
            status: 200,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      } else {
        const errorText = await firecrawlResponse.text()
        console.error('❌ Firecrawl error:', errorText)
        throw new Error(`Firecrawl API error: ${firecrawlResponse.status} - ${errorText}`)
      }
    } else {
      throw new Error('FIRECRAWL_API_KEY not found in environment variables')
    }

  } catch (error) {
    console.error('💥 Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})