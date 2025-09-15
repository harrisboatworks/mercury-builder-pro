import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Parse motors from HTML function
async function parseMotorsFromHTML(html: string, markdown: string = '') {
  console.log('🔍 Starting motor parsing with new pattern...')
  
  const motors = []
  const combinedText = html + ' ' + markdown
  
  // Check for result count to verify we're on the right page
  const resultCountPattern = /(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/i
  const resultMatch = combinedText.match(resultCountPattern)
  if (resultMatch) {
    console.log(`📊 Result count found: ${resultMatch[1]} - ${resultMatch[2]} of ${resultMatch[3]}`)
  }
  
  // Primary pattern: YEAR + MODEL + HP + TYPE - Mercury
  const primaryPattern = /(\d{4}).*?(\d+)HP.*?Mercury/gi
  const primaryMatches = Array.from(combinedText.matchAll(primaryPattern))
  console.log('Primary pattern matches (YEAR...HP...Mercury):', primaryMatches.length)
  
  // Fallback pattern: Mercury + any text + number + HP (original format)
  const fallbackPattern = /mercury.*?(\d+).*?hp/gi
  const fallbackMatches = Array.from(combinedText.matchAll(fallbackPattern))
  console.log('Fallback pattern matches (Mercury...HP):', fallbackMatches.length)
  
  // Process primary matches first (preferred format)
  for (const match of primaryMatches) {
    const year = parseInt(match[1])
    const horsepower = parseInt(match[2])
    const fullMatch = match[0]
    
    // Skip invalid values
    if (year < 2020 || year > 2030 || horsepower < 5 || horsepower > 500) {
      continue
    }
    
    // Extract model name (text between year and HP)
    const modelMatch = fullMatch.match(/\d{4}\s*(.*?)\s*\d+HP/i)
    let modelName = modelMatch ? modelMatch[1].trim() : `${horsepower}HP`
    
    // Clean up model name
    modelName = modelName.replace(/®/g, '').replace(/™/g, '').trim()
    if (!modelName || modelName.length < 2) {
      modelName = `${horsepower}HP FourStroke`
    }
    
    const motor = {
      make: 'Mercury',
      model: modelName,
      horsepower: horsepower,
      motor_type: 'FourStroke',
      base_price: null,
      year: year
    }
    
    console.log('🎯 Found motor (primary):', `${motor.year} ${motor.make} ${motor.model} ${motor.horsepower}HP`)
    motors.push(motor)
  }
  
  // Process fallback matches (avoid duplicates)
  const existingHPs = new Set(motors.map(m => m.horsepower))
  for (const match of fallbackMatches) {
    const horsepower = parseInt(match[1])
    
    // Skip if already found by primary pattern or invalid
    if (existingHPs.has(horsepower) || horsepower < 5 || horsepower > 500) {
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
    
    console.log('🎯 Found motor (fallback):', motor.make, motor.model, motor.horsepower + 'HP')
    motors.push(motor)
    existingHPs.add(horsepower)
  }
  
  // Log some sample matches for debugging
  if (primaryMatches.length > 0) {
    console.log('Sample primary matches:')
    primaryMatches.slice(0, 3).forEach((match, i) => {
      console.log(`  ${i + 1}: "${match[0]}"`)
    })
  }
  
  return {
    motors: motors,
    debugInfo: {
      html_length: html.length,
      markdown_length: markdown.length,
      primary_matches: primaryMatches.length,
      fallback_matches: fallbackMatches.length,
      total_matches: primaryMatches.length + fallbackMatches.length,
      result_count: resultMatch ? resultMatch[3] : null
    }
  }
}

// Database save function
async function saveMotorsToDatabase(motors: any[]) {
  console.log('💾 Attempting to save motors to database...')
  let savedCount = 0
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
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
            last_scraped: new Date().toISOString(),
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
          .insert(motor)
        
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

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Health check endpoint
  if (req.method === 'GET' && new URL(req.url).pathname === '/health') {
    return new Response(JSON.stringify({ status: 'healthy' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const startTime = Date.now()
    const requestBody = await req.json()
    const { pages_to_scrape = 3 } = requestBody
    
    // Get environment variables
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY is required')
    }

    console.log('🚀 Starting multi-page inventory scrape...')
    console.log('📄 Pages to scrape:', pages_to_scrape)

    // Base URL for inventory search
    const baseUrl = 'https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low'
    
    // Arrays to collect data from all pages
    const allMotors = []
    const pageResults = []
    const errors = []
    
    // Loop through pages
    for (let pageNum = 1; pageNum <= pages_to_scrape; pageNum++) {
      try {
        // Small delay between requests to be respectful
        if (pageNum > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
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
            success: true,
            motors_found: pageMotors.length,
            html_length: htmlData.length,
            markdown_length: markdownData.length
          })
          
        } else {
          const errorText = await firecrawlResponse.text()
          console.error(`❌ Page ${pageNum} failed: ${firecrawlResponse.status} - ${errorText}`)
          
          errors.push({
            page: pageNum,
            url: currentUrl,
            status: firecrawlResponse.status,
            error: errorText
          })
          
          pageResults.push({
            page: pageNum,
            url: currentUrl,
            success: false,
            error: errorText,
            motors_found: 0
          })
        }
      } catch (pageError) {
        console.error(`❌ Page ${pageNum} error:`, pageError.message)
        errors.push({
          page: pageNum,
          error: pageError.message
        })
        
        pageResults.push({
          page: pageNum,
          url: currentUrl,
          success: false,
          error: pageError.message,
          motors_found: 0
        })
      }
    }
    
    console.log('🔍 All pages scraped. Total motors found:', allMotors.length)
    
    // Remove duplicates across all pages based on model and horsepower
    const uniqueMotors = allMotors.filter((motor, index, self) => 
      index === self.findIndex(m => m.model === motor.model && m.horsepower === motor.horsepower)
    )
    
    console.log('🧹 Unique motors after cross-page deduplication:', uniqueMotors.length)
    
    // Save unique motors to database
    let savedMotors = 0
    if (uniqueMotors.length > 0) {
      console.log('💾 Attempting to save motors to database...')
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
    }))

    // Get sample motors (first 3) for verification
    const sampleMotors = uniqueMotors.slice(0, 3).map(motor => ({
      make: motor.make,
      model: motor.model,
      horsepower: motor.horsepower,
      base_price: motor.base_price
    }))

    const result = {
      success: true,
      message: `Multi-page scrape completed! ${successfulPages}/${pages_to_scrape} pages successful. Found ${totalMotorsFound} total motors (${totalUniqueMotors} unique), saved ${savedMotors} to database`,
      total_pages_scraped: pages_to_scrape,
      successful_pages: successfulPages,
      failed_pages: pages_to_scrape - successfulPages,
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
    console.error('❌ Main function error:', error)
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