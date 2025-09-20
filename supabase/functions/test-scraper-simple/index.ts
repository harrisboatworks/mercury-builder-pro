import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers
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
    console.log('🧪 Testing Firecrawl with Harris Boatworks in-stock URL...')
    
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY not found in environment')
    }

    const targetUrl = 'https://www.harrisboatworks.ca/search/inventory/availability/In%20Stock/brand/Mercury/usage/New'
    
    console.log(`🔍 Scraping URL: ${targetUrl}`)
    
    const startTime = Date.now()
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ['html'],
        waitFor: 10000,          // Wait 10 seconds for JavaScript to load inventory
        timeout: 45000,          // 45 second timeout
        onlyMainContent: false,  // Get full page content
        mobile: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Firecrawl API error:', response.status, errorText)
      throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Firecrawl response received')
    
    // Enhanced Motor Detection and Analysis
    const html = data.data?.html || ''
    const htmlLength = html.length
    
    console.log(`📄 HTML Length: ${htmlLength} characters`)
    
    // 1. Look for motor-specific patterns
    const motorPatterns = {
      mercuryHP: html.match(/Mercury\s+\d+(?:\.\d+)?\s*HP/gi) || [],
      mercuryModel: html.match(/Mercury\s+\d+(?:\.\d+)?\s*[A-Z]{2,6}(?:\s+[A-Za-z]+)?/gi) || [],
      stockNumbers: html.match(/Stock\s*[#:]?\s*[A-Z0-9\-]+/gi) || [],
      prices: html.match(/\$[\d,]+(?:\.\d{2})?/gi) || [],
      rigCodes: html.match(/\b(EL[HP]PT|EXLPT|XL|XXL|MLH|MXLH|CT|DTS|MH)\b/gi) || []
    }
    
    // 2. Look for inventory container elements
    const containerPatterns = {
      vehicleCards: html.match(/<div[^>]*class="[^"]*vehicle[^"]*"[^>]*>/gi) || [],
      inventoryItems: html.match(/<div[^>]*class="[^"]*inventory[^"]*"[^>]*>/gi) || [],
      productCards: html.match(/<div[^>]*class="[^"]*product[^"]*"[^>]*>/gi) || [],
      motorCards: html.match(/<div[^>]*class="[^"]*motor[^"]*"[^>]*>/gi) || [],
      inventoryLinks: html.match(/<a[^>]*href="[^"]*inventory[^"]*"[^>]*>/gi) || []
    }
    
    // 3. Extract actual motor listings with more context
    const motorListings = []
    
    // Try to find motor listing sections by looking for Mercury + HP combinations
    const motorSections = html.split(/(?=Mercury\s+\d+)/gi).slice(1, 15) // Get up to 14 sections
    
    for (const section of motorSections) {
      if (section.length > 50) { // Only process substantial sections
        const motorMatch = section.match(/Mercury\s+(\d+(?:\.\d+)?)\s*([A-Z]{2,6})?(?:\s+([A-Za-z]+))?/i)
        if (motorMatch) {
          const stockMatch = section.match(/Stock\s*[#:]?\s*([A-Z0-9\-]+)/i)
          const priceMatch = section.match(/\$[\d,]+(?:\.\d{2})?/)
          const yearMatch = section.match(/20\d{2}/)
          
          motorListings.push({
            fullMatch: motorMatch[0],
            hp: motorMatch[1],
            rigCode: motorMatch[2] || 'N/A',
            series: motorMatch[3] || 'N/A',
            stockNumber: stockMatch ? stockMatch[1] : 'N/A',
            price: priceMatch ? priceMatch[0] : 'N/A',
            year: yearMatch ? yearMatch[0] : 'N/A',
            context: section.substring(0, 200).replace(/\s+/g, ' ').trim()
          })
        }
      }
    }
    
    // 4. Enhanced analysis
    const totalContainers = Object.values(containerPatterns).reduce((sum, arr) => sum + arr.length, 0)
    const distinctMotors = new Set(motorPatterns.mercuryModel.map(m => m.trim().toUpperCase())).size
    
    console.log(`🔍 Motor Patterns Found:`)
    console.log(`  - Mercury HP: ${motorPatterns.mercuryHP.length}`)
    console.log(`  - Mercury Models: ${motorPatterns.mercuryModel.length}`)
    console.log(`  - Stock Numbers: ${motorPatterns.stockNumbers.length}`)
    console.log(`  - Prices: ${motorPatterns.prices.length}`)
    console.log(`  - Rig Codes: ${motorPatterns.rigCodes.length}`)
    
    console.log(`📦 Container Elements: ${totalContainers}`)
    console.log(`🚤 Distinct Motor Listings: ${motorListings.length}`)
    console.log(`🏷️ Sample Motors:`, motorListings.slice(0, 3))
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Enhanced Firecrawl motor detection completed',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        results: {
          url: targetUrl,
          htmlLength,
          
          // Enhanced motor detection
          motorPatterns: {
            mercuryHP: motorPatterns.mercuryHP.length,
            mercuryModels: motorPatterns.mercuryModel.length,
            stockNumbers: motorPatterns.stockNumbers.length,
            prices: motorPatterns.prices.length,
            rigCodes: motorPatterns.rigCodes.length
          },
          
          // Container analysis
          containers: {
            total: totalContainers,
            vehicleCards: containerPatterns.vehicleCards.length,
            inventoryItems: containerPatterns.inventoryItems.length,
            productCards: containerPatterns.productCards.length,
            motorCards: containerPatterns.motorCards.length,
            inventoryLinks: containerPatterns.inventoryLinks.length
          },
          
          // Actual motor listings
          motorListings: {
            count: motorListings.length,
            distinctMotors,
            sampleMotors: motorListings.slice(0, 5),
            expectedCount: 11,
            foundExpectedCount: motorListings.length >= 10 && motorListings.length <= 15
          },
          
          // Sample data for debugging
          samplePatterns: {
            mercuryHP: motorPatterns.mercuryHP.slice(0, 5),
            stockNumbers: motorPatterns.stockNumbers.slice(0, 5),
            prices: motorPatterns.prices.slice(0, 5)
          }
        },
        
        // Include HTML sample for debugging
        htmlSample: html.substring(0, 3000)
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )
  } catch (error) {
    console.error('❌ Firecrawl test error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Firecrawl test failed',
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