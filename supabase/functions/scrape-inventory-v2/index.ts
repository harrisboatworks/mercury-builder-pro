import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Motor parsing function
async function parseMotorsFromHTML(html: string, markdown: string = '') {
  console.log('🔍 Starting motor parsing...')
  console.log('🔍 HTML Sample (first 500):', html.substring(0, 500))
  console.log('📝 Markdown Sample:', markdown.substring(0, 1000))
  
  const motors = []
  const debugInfo = {
    html_length: html.length,
    markdown_length: markdown.length,
    patterns_found: [],
    search_results: {}
  }
  
  // Search for common motor-related terms (case insensitive)
  const searchTerms = ['mercury', 'hp', 'horsepower', 'outboard', 'engine', 'motor', 'fourstroke', '4-stroke']
  
  searchTerms.forEach(term => {
    const regex = new RegExp(term, 'gi')
    const matches = html.match(regex) || []
    debugInfo.search_results[term] = matches.length
    console.log(`🔍 Found "${term}": ${matches.length} occurrences`)
  })
  
  // Look for HTML structural patterns that might contain motor data
  console.log('🏗️ Checking HTML structure patterns...')
  
  // Check for common inventory page structures
  const structureChecks = [
    { name: 'product-card', regex: /class=["\'].*product.*["\'][^>]*>/gi },
    { name: 'inventory-item', regex: /class=["\'].*(?:inventory|item).*["\'][^>]*>/gi },
    { name: 'motor-listing', regex: /class=["\'].*(?:motor|outboard).*["\'][^>]*>/gi },
    { name: 'table-row', regex: /<tr[^>]*>[\s\S]*?<\/tr>/gi },
    { name: 'div-container', regex: /<div[^>]*class=["\'][^"\']*(?:motor|product|inventory)[^"\']*["\'][^>]*>/gi }
  ]
  
  structureChecks.forEach(check => {
    const matches = html.match(check.regex) || []
    console.log(`🏗️ ${check.name}: ${matches.length} elements`)
    if (matches.length > 0 && matches.length < 10) {
      console.log(`🏗️ ${check.name} sample:`, matches[0].substring(0, 200))
    }
  })
  
  // Try multiple parsing approaches with more flexible patterns
  console.log('🎯 Trying different parsing patterns...')
  
  // Pattern 1: Original Mercury + HP pattern
  const pattern1 = /(?:Mercury|MERCURY).*?(\d+)\s*(?:HP|hp|Hp).*?(?:\$([0-9,]+))?/gi
  const matches1 = Array.from(html.matchAll(pattern1))
  console.log('🎯 Pattern 1 (Mercury + HP):', matches1.length, 'matches')
  
  // Pattern 2: Just HP numbers (more flexible)
  const pattern2 = /(?:^|[>\s])(\d+)\s*(?:HP|hp|Hp)(?:[<\s]|$)/gi
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
  
  // Pattern 5: Look for FourStroke patterns (common in Mercury inventory)
  const pattern5 = /(?:FourStroke|fourstroke|4-stroke)\s+(\d+)\s*(?:HP|hp)/gi
  const matches5 = Array.from(html.matchAll(pattern5))
  console.log('🎯 Pattern 5 (FourStroke + HP):', matches5.length, 'matches')
  
  // Pattern 6: Look for title/alt text patterns
  const pattern6 = /(?:title|alt)=["\'][^"\']*?(\d+)\s*(?:HP|hp)[^"\']*?["\']/gi
  const matches6 = Array.from(html.matchAll(pattern6))
  console.log('🎯 Pattern 6 (Title/Alt text):', matches6.length, 'matches')
  
  // Pattern 7: Look for JSON-like data structures
  const pattern7 = /"[^"]*(?:Mercury|mercury)[^"]*?(\d+)\s*(?:HP|hp|Hp)[^"]*"/gi
  const matches7 = Array.from(html.matchAll(pattern7))
  console.log('🎯 Pattern 7 (JSON strings):', matches7.length, 'matches')
  
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
  
  // Use the most promising pattern for actual parsing - check all patterns
  let bestMatches = matches1
  let bestPatternName = 'Pattern 1 (Mercury + HP)'
  
  if (matches2.length > bestMatches.length) {
    bestMatches = matches2
    bestPatternName = 'Pattern 2 (Just HP)'
  }
  if (matches3.length > bestMatches.length) {
    bestMatches = matches3
    bestPatternName = 'Pattern 3 (Horsepower)'
  }
  if (matches4.length > bestMatches.length) {
    bestMatches = matches4
    bestPatternName = 'Pattern 4 (Mercury in markdown)'
  }
  if (matches5.length > bestMatches.length) {
    bestMatches = matches5
    bestPatternName = 'Pattern 5 (FourStroke + HP)'
  }
  if (matches6.length > bestMatches.length) {
    bestMatches = matches6
    bestPatternName = 'Pattern 6 (Title/Alt text)'
  }
  if (matches7.length > bestMatches.length) {
    bestMatches = matches7
    bestPatternName = 'Pattern 7 (JSON strings)'
  }
  
  console.log(`🏆 Using best pattern: ${bestPatternName} with ${bestMatches.length} matches`)
  
  // Also try to combine unique results from multiple patterns if none are dominant
  const allMatches = [...matches1, ...matches2, ...matches4, ...matches5, ...matches6, ...matches7]
  if (bestMatches.length < 5 && allMatches.length > bestMatches.length) {
    console.log(`🔄 Low match count, trying combined patterns: ${allMatches.length} total matches`)
    bestMatches = allMatches
    bestPatternName = 'Combined patterns'
  }
  
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
        
        if (firecrawlResponse.ok) {
          const firecrawlData = await firecrawlResponse.json()
          console.log(`✅ Page ${pageNum} HTML length:`, firecrawlData.data?.html?.length || 0)
          console.log(`📄 Page ${pageNum} Markdown length:`, firecrawlData.data?.markdown?.length || 0)
          
          // Parse motors from current page
          const htmlData = firecrawlData.data?.html || ''
          const markdownData = firecrawlData.data?.markdown || ''
          
          // PROMINENT HTML DEBUGGING
          console.log('🔍 RAW HTML LENGTH:', htmlData.length)
          console.log('🔍 HTML FIRST 500 CHARS:', htmlData.substring(0, 500))
          console.log('🔍 HTML SEARCH FOR MOTOR:', htmlData.includes('Mercury') ? 'FOUND Mercury' : 'NO Mercury found')
          console.log('🔍 HTML SEARCH FOR HP:', htmlData.includes('HP') || htmlData.includes('hp') ? 'FOUND HP' : 'NO HP found')
          console.log('🔍 HTML SEARCH FOR FOURSTROKE:', htmlData.includes('FourStroke') || htmlData.includes('fourstroke') ? 'FOUND FourStroke' : 'NO FourStroke found')
          
          // Log HTML sample for debugging
          console.log(`📋 Page ${pageNum} HTML sample (first 1000 chars):`, htmlData.substring(0, 1000))
          console.log(`📋 Page ${pageNum} contains "Mercury":`, htmlData.includes('Mercury') || htmlData.includes('mercury'))
          console.log(`📋 Page ${pageNum} contains "HP":`, htmlData.includes('HP') || htmlData.includes('hp'))
          
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