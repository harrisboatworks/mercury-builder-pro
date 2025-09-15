import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Motor parsing function
async function parseMotorsFromHTML(html: string, markdown: string = '') {
  console.log('🔍 Starting motor parsing...')
  console.log('🔍 HTML Sample:', html.substring(0, 2000))
  console.log('📝 Markdown Sample:', markdown.substring(0, 1000))
  
  const motors = []
  const debugInfo = {
    html_length: html.length,
    markdown_length: markdown.length,
    patterns_found: [],
    search_results: {}
  }
  
  // Search for common motor-related terms (case insensitive)
  const searchTerms = ['mercury', 'hp', 'horsepower', 'outboard', 'engine', 'motor']
  
  searchTerms.forEach(term => {
    const regex = new RegExp(term, 'gi')
    const matches = html.match(regex) || []
    debugInfo.search_results[term] = matches.length
    console.log(`🔍 Found "${term}": ${matches.length} occurrences`)
  })
  
  // Try multiple parsing approaches
  console.log('🎯 Trying different parsing patterns...')
  
  // Pattern 1: Original Mercury + HP pattern
  const pattern1 = /(?:Mercury|MERCURY).*?(\d+)\s*(?:HP|hp|Hp).*?(?:\$([0-9,]+))?/gi
  const matches1 = Array.from(html.matchAll(pattern1))
  console.log('🎯 Pattern 1 (Mercury + HP):', matches1.length, 'matches')
  
  // Pattern 2: Just HP numbers
  const pattern2 = /(\d+)\s*(?:HP|hp|Hp)/gi
  const matches2 = Array.from(html.matchAll(pattern2))
  console.log('🎯 Pattern 2 (Just HP):', matches2.length, 'matches')
  
  // Pattern 3: Horsepower spelled out
  const pattern3 = /(\d+)\s*(?:horsepower|Horsepower|HORSEPOWER)/gi
  const matches3 = Array.from(html.matchAll(pattern3))
  console.log('🎯 Pattern 3 (Horsepower):', matches3.length, 'matches')
  
  // Pattern 4: Mercury in markdown
  const pattern4 = /(?:Mercury|MERCURY).*?(\d+)\s*(?:HP|hp|Hp)/gi
  const matches4 = Array.from(markdown.matchAll(pattern4))
  console.log('🎯 Pattern 4 (Mercury in markdown):', matches4.length, 'matches')
  
  // Try to find any motor-related content
  const motorKeywords = ['outboard', 'engine', 'motor', 'marine']
  motorKeywords.forEach(keyword => {
    const regex = new RegExp(`${keyword}[^.]{0,100}`, 'gi')
    const matches = html.match(regex) || []
    if (matches.length > 0) {
      console.log(`🔍 ${keyword} context:`, matches.slice(0, 3))
      debugInfo.patterns_found.push(`${keyword}: ${matches.length} matches`)
    }
  })
  
  // Look for price patterns
  const pricePattern = /\$[\d,]+(?:\.\d{2})?/g
  const priceMatches = html.match(pricePattern) || []
  console.log('💰 Price patterns found:', priceMatches.length)
  if (priceMatches.length > 0) {
    console.log('💰 Sample prices:', priceMatches.slice(0, 5))
  }
  
  // Use the most promising pattern for actual parsing
  let bestMatches = matches1
  if (matches2.length > bestMatches.length) bestMatches = matches2
  if (matches4.length > bestMatches.length) bestMatches = matches4
  
  console.log('🏆 Using best pattern with', bestMatches.length, 'matches')
  
  for (const match of bestMatches) {
    const fullMatch = match[0]
    const horsepower = parseInt(match[1])
    const priceStr = match[2]
    
    // Skip invalid horsepower values
    if (horsepower < 5 || horsepower > 500) {
      console.log('⚠️ Skipping invalid HP:', horsepower)
      continue
    }
    
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
    
    console.log(`🔍 Context for ${horsepower}HP:`, context.substring(0, 150))
    
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
  
  return { motors: uniqueMotors, debugInfo }
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
        const markdownData = firecrawlData.data?.markdown || ''
        const parseResult = await parseMotorsFromHTML(htmlData, markdownData)
        const parsedMotors = parseResult.motors
        const debugInfo = parseResult.debugInfo
        
        console.log('🏗️ Parsed motors count:', parsedMotors.length)
        console.log('🔍 Debug info:', JSON.stringify(debugInfo, null, 2))
        
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
          debug_info: debugInfo,
          html_sample: firecrawlData.data?.html?.substring(0, 500) || '',
          markdown_sample: firecrawlData.data?.markdown?.substring(0, 300) || '',
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