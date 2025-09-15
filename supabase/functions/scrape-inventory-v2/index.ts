import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Motor parsing function
async function parseMotorsFromHTML(html: string, markdown: string = '') {
  console.log('🔍 Starting simple motor parsing...')
  
  const motors = []
  
  // Simple pattern: Mercury + any text + number + HP
  const simplePattern = /mercury.*?(\d+).*?hp/gi
  const matches = Array.from(html.matchAll(simplePattern))
  
  console.log('Simple Mercury HP pattern matches:', matches.length)
  
  // Also check markdown
  const markdownMatches = Array.from(markdown.matchAll(simplePattern))
  console.log('Markdown Mercury HP matches:', markdownMatches.length)
  
  // Combine matches
  const allMatches = [...matches, ...markdownMatches]
  
  for (const match of allMatches) {
    const horsepower = parseInt(match[1])
    
    // Skip invalid horsepower values
    if (horsepower < 5 || horsepower > 500) {
      continue
    }
    
    const motor = {
      make: 'Mercury',
      model: `${horsepower}HP FourStroke`,
      horsepower: horsepower,
      motor_type: 'FourStroke',
      base_price: null,
      year: 2025
    }
    
    console.log('🎯 Found motor:', motor.make, motor.model, motor.horsepower + 'HP', motor.base_price ? '$' + motor.base_price : 'No price')
    motors.push(motor)
  }
  
  return {
    motors: motors,
    debugInfo: {
      html_length: html.length,
      markdown_length: markdown.length,
      total_matches: allMatches.length
    }
  }
}
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
    const pagesToScrape = body.pages_to_scrape || 3

    console.log('🔥 Starting multi-page scrape with pages:', pagesToScrape)

    // Initialize pagination variables
    const baseUrl = 'https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low'
    const allMotors = []
    const pageResults = []
    const errors = []

    // Test Firecrawl API
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    console.log('🔑 FIRECRAWL_API_KEY exists:', !!firecrawlApiKey)
    
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not found in environment variables')
    }

    console.log('🔑 API key starts with:', firecrawlApiKey.substring(0, 8) + '...')
      
    // Loop through pages
    for (let pageNum = 1; pageNum <= pagesToScrape; pageNum++) {
      try {
        // Construct URL for current page
        const currentUrl = pageNum === 1 ? baseUrl : `${baseUrl}&page=${pageNum}`
        console.log(`🔄 Scraping page ${pageNum}: ${currentUrl}`)
        
        // Make Firecrawl API call for current page
        const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: currentUrl,
            formats: ['html', 'markdown']
          })
        })
        
        console.log(`📊 Page ${pageNum} Firecrawl response status:`, firecrawlResponse.status)
        
        console.log('Firecrawl status:', firecrawlResponse.status)
        
        if (firecrawlResponse.ok) {
          const firecrawlData = await firecrawlResponse.json()
          
          // Parse motors from current page
          const htmlData = firecrawlData.data?.html || ''
          const markdownData = firecrawlData.data?.markdown || ''
          
          // Simple debugging
          console.log('HTML length:', htmlData.length)
          console.log('Contains Mercury?', htmlData.toLowerCase().includes('mercury'))
          console.log('Mercury HP matches:', htmlData.match(/mercury.*?\d+.*?hp/gi)?.length || 0)
          
          const parseResult = await parseMotorsFromHTML(htmlData, markdownData)
          const pageMotors = parseResult.motors
          const debugInfo = parseResult.debugInfo
          
          console.log(`🏗️ Page ${pageNum} parsed motors:`, pageMotors.length)
          
          // Add motors from this page to the total
          allMotors.push(...pageMotors)
          
          // Record page result
          pageResults.push({
            page: pageNum,
            url: currentUrl,
            motors_found: pageMotors.length,
            html_length: firecrawlData.data?.html?.length || 0,
            markdown_length: firecrawlData.data?.markdown?.length || 0,
            success: true,
            debug_info: debugInfo
          })
          
        } else {
          const errorText = await firecrawlResponse.text()
          const errorMsg = `Page ${pageNum} failed: ${firecrawlResponse.status} - ${errorText}`
          console.error('❌', errorMsg)
          
          errors.push(errorMsg)
          pageResults.push({
            page: pageNum,
            url: currentUrl,
            motors_found: 0,
            success: false,
            error: errorMsg
          })
        }
        
        // Add small delay between requests to avoid overwhelming the server
        if (pageNum < pagesToScrape) {
          console.log('⏳ Waiting 2 seconds before next page...')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
      } catch (pageError) {
        const errorMsg = `Page ${pageNum} error: ${pageError.message}`
        console.error('❌', errorMsg)
        errors.push(errorMsg)
        
        pageResults.push({
          page: pageNum,
          url: pageNum === 1 ? baseUrl : `${baseUrl}&page=${pageNum}`,
          motors_found: 0,
          success: false,
          error: errorMsg
        })
      }
    }
    
    console.log('🔍 All pages scraped. Total motors found:', allMotors.length)
    
    // Remove duplicates across all pages
    const uniqueMotors = allMotors.filter((motor, index, self) => 
      index === self.findIndex(m => m.model === motor.model && m.horsepower === motor.horsepower)
    )
    
    console.log('🧹 Unique motors after cross-page deduplication:', uniqueMotors.length)
    
    // Save unique motors to database
    let savedMotors = 0
    if (uniqueMotors.length > 0) {
      savedMotors = await saveMotorsToDatabase(uniqueMotors)
      console.log('💾 Saved motors to database:', savedMotors)
    }
    
    // Calculate totals for response
    const totalMotorsFound = allMotors.length
    const totalUniqueMotors = uniqueMotors.length
    const successfulPages = pageResults.filter(p => p.success).length
    
    // Generate motors per page breakdown
    const motorsPerPage = pageResults.map((result, index) => ({
      page: index + 1,
      motors_found: result.motors_found || 0
    }));

    // Get sample motors (first 3) for verification
    const sampleMotors = uniqueMotors.slice(0, 3).map(motor => ({
      make: motor.make,
      model: motor.model,
      horsepower: motor.horsepower,
      base_price: motor.base_price
    }));

    const result = {
      success: true,
      message: `Multi-page scrape completed! ${successfulPages}/${pagesToScrape} pages successful. Found ${totalMotorsFound} total motors (${totalUniqueMotors} unique), saved ${savedMotors} to database`,
      total_pages_scraped: pagesToScrape,
      successful_pages: successfulPages,
      failed_pages: pagesToScrape - successfulPages,
      combined_motors_found: totalMotorsFound,
      combined_motors_saved: savedMotors,
      motors_per_page: motorsPerPage,
      sample_motors: sampleMotors,
      page_results: pageResults,
      errors: errors,
      base_url: baseUrl,
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