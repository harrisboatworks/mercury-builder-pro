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
    
    // Get HTML content
    const html = data.data?.html || ''
    const htmlLength = html.length
    
    console.log(`📄 HTML Length: ${htmlLength} characters`)
    
    // ===== COMPREHENSIVE DEBUGGING =====
    console.log('\n🔍 DEBUGGING HTML CONTENT:')
    console.log(`📄 First 2000 characters:\n${html.substring(0, 2000)}`)
    
    // 1. BASIC CONTENT CHECKS
    const hasMercury = html.includes("Mercury")
    const hasStock = html.includes("Stock") 
    const hasInventory = html.includes("inventory")
    const hasError = html.includes("error") || html.includes("Error") || html.includes("404")
    const hasLogin = html.includes("login") || html.includes("sign in") || html.includes("authenticate")
    const simpleMercuryCount = (html.match(/Mercury/gi) || []).length
    
    console.log(`\n📊 BASIC CONTENT ANALYSIS:`)
    console.log(`  - Contains "Mercury": ${hasMercury}`)
    console.log(`  - Contains "Stock": ${hasStock}`)
    console.log(`  - Contains "inventory": ${hasInventory}`)
    console.log(`  - Has error indicators: ${hasError}`)
    console.log(`  - Has login indicators: ${hasLogin}`)
    console.log(`  - Simple Mercury count: ${simpleMercuryCount}`)
    
    // 2. URL ANALYSIS
    const inventoryUrls = html.match(/href="[^"]*inventory[^"]*"/gi) || []
    console.log(`  - Inventory URLs found: ${inventoryUrls.length}`)
    if (inventoryUrls.length > 0) {
      console.log(`  - Sample URLs: ${inventoryUrls.slice(0, 3)}`)
    }
    
    // 3. PATTERN TESTING - SIMPLE VS ENHANCED
    console.log(`\n🔍 PATTERN COMPARISON:`)
    
    // Simple string-based patterns
    const simplePatterns = {
      mercury: (html.match(/Mercury/gi) || []).length,
      hp: (html.match(/\d+\s*HP/gi) || []).length,  
      stock: (html.match(/Stock/gi) || []).length,
      dollar: (html.match(/\$/g) || []).length,
      outboard: (html.match(/outboard/gi) || []).length
    }
    
    // Enhanced regex patterns (existing)
    const enhancedPatterns = {
      mercuryHP: html.match(/Mercury\s+\d+(?:\.\d+)?\s*HP/gi) || [],
      mercuryModel: html.match(/Mercury\s+\d+(?:\.\d+)?\s*[A-Z]{2,6}(?:\s+[A-Za-z]+)?/gi) || [],
      stockNumbers: html.match(/Stock\s*[#:]?\s*[A-Z0-9\-]+/gi) || [],
      prices: html.match(/\$[\d,]+(?:\.\d{2})?/gi) || [],
      rigCodes: html.match(/\b(EL[HP]PT|EXLPT|XL|XXL|MLH|MXLH|CT|DTS|MH)\b/gi) || []
    }
    
    console.log(`Simple patterns:`)
    console.log(`  - Mercury mentions: ${simplePatterns.mercury}`)
    console.log(`  - HP mentions: ${simplePatterns.hp}`)
    console.log(`  - Stock mentions: ${simplePatterns.stock}`)
    console.log(`  - Dollar signs: ${simplePatterns.dollar}`)
    console.log(`  - Outboard mentions: ${simplePatterns.outboard}`)
    
    console.log(`Enhanced patterns:`)
    console.log(`  - Mercury HP: ${enhancedPatterns.mercuryHP.length}`)
    console.log(`  - Mercury Models: ${enhancedPatterns.mercuryModel.length}`)
    console.log(`  - Stock Numbers: ${enhancedPatterns.stockNumbers.length}`)
    console.log(`  - Prices: ${enhancedPatterns.prices.length}`)
    console.log(`  - Rig Codes: ${enhancedPatterns.rigCodes.length}`)
    
    // 4. CONTAINER ANALYSIS
    const containerPatterns = {
      vehicleCards: html.match(/<div[^>]*class="[^"]*vehicle[^"]*"[^>]*>/gi) || [],
      inventoryItems: html.match(/<div[^>]*class="[^"]*inventory[^"]*"[^>]*>/gi) || [],
      productCards: html.match(/<div[^>]*class="[^"]*product[^"]*"[^>]*>/gi) || [],
      motorCards: html.match(/<div[^>]*class="[^"]*motor[^"]*"[^>]*>/gi) || [],
      inventoryLinks: html.match(/<a[^>]*href="[^"]*inventory[^"]*"[^>]*>/gi) || []
    }
    
    const totalContainers = Object.values(containerPatterns).reduce((sum, arr) => sum + arr.length, 0)
    console.log(`\n📦 CONTAINER ELEMENTS: ${totalContainers}`)
    Object.entries(containerPatterns).forEach(([key, arr]) => {
      console.log(`  - ${key}: ${arr.length}`)
    })
    
    // 5. SHOW SAMPLES OF WHAT WE FOUND
    if (enhancedPatterns.mercuryHP.length > 0) {
      console.log(`\n🏷️ SAMPLE MERCURY HP MATCHES: ${enhancedPatterns.mercuryHP.slice(0, 5)}`)
    }
    if (enhancedPatterns.stockNumbers.length > 0) {
      console.log(`📦 SAMPLE STOCK NUMBERS: ${enhancedPatterns.stockNumbers.slice(0, 5)}`)
    }
    if (enhancedPatterns.prices.length > 0) {
      console.log(`💰 SAMPLE PRICES: ${enhancedPatterns.prices.slice(0, 5)}`)
    }
    
    // 6. TRY TO EXTRACT MOTOR LISTINGS (keep existing logic but simplified)
    const motorListings = []
    const motorSections = html.split(/(?=Mercury\s+\d+)/gi).slice(1, 15)
    
    for (const section of motorSections) {
      if (section.length > 50) {
        const motorMatch = section.match(/Mercury\s+(\d+(?:\.\d+)?)\s*([A-Z]{2,6})?(?:\s+([A-Za-z]+))?/i)
        if (motorMatch) {
          const stockMatch = section.match(/Stock\s*[#:]?\s*([A-Z0-9\-]+)/i)
          const priceMatch = section.match(/\$[\d,]+(?:\.\d{2})?/)
          
          motorListings.push({
            fullMatch: motorMatch[0],
            hp: motorMatch[1],
            rigCode: motorMatch[2] || 'N/A',
            stockNumber: stockMatch ? stockMatch[1] : 'N/A',
            price: priceMatch ? priceMatch[0] : 'N/A',
            context: section.substring(0, 150).replace(/\s+/g, ' ').trim()
          })
        }
      }
    }
    
    console.log(`\n🚤 FINAL ANALYSIS:`)
    console.log(`  - Motor sections found: ${motorSections.length}`)
    console.log(`  - Motor listings extracted: ${motorListings.length}`)
    
    if (motorListings.length > 0) {
      console.log(`🏷️ Sample Motors: ${motorListings.slice(0, 3).map(m => m.fullMatch)}`)
    } else {
      console.log(`🏷️ Sample Motors: []`)
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Comprehensive debugging analysis completed',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        results: {
          url: targetUrl,
          htmlLength,
          
          // Basic content analysis
          basicAnalysis: {
            hasMercury,
            hasStock,
            hasInventory,
            hasError,
            hasLogin,
            simpleMercuryCount,
            inventoryUrlsFound: inventoryUrls.length
          },
          
          // Pattern comparison
          simplePatterns,
          enhancedPatterns: {
            mercuryHP: enhancedPatterns.mercuryHP.length,
            mercuryModel: enhancedPatterns.mercuryModel.length,
            stockNumbers: enhancedPatterns.stockNumbers.length,
            prices: enhancedPatterns.prices.length,
            rigCodes: enhancedPatterns.rigCodes.length
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
          
          // Motor listings
          motorListings: {
            count: motorListings.length,
            sampleMotors: motorListings.slice(0, 5),
            motorSectionsFound: motorSections.length
          },
          
          // Debugging samples
          sampleData: {
            mercuryHPMatches: enhancedPatterns.mercuryHP.slice(0, 5),
            stockNumbers: enhancedPatterns.stockNumbers.slice(0, 5),
            prices: enhancedPatterns.prices.slice(0, 5),
            inventoryUrls: inventoryUrls.slice(0, 3)
          }
        },
        
        // Critical debugging info
        htmlSample: html.substring(0, 2000),
        troubleshootingNotes: [
          hasMercury ? "✅ HTML contains 'Mercury'" : "❌ HTML does NOT contain 'Mercury'",
          hasStock ? "✅ HTML contains 'Stock'" : "❌ HTML does NOT contain 'Stock'",
          hasInventory ? "✅ HTML contains 'inventory'" : "❌ HTML does NOT contain 'inventory'",
          hasError ? "⚠️ HTML may contain error content" : "✅ No error indicators found",
          hasLogin ? "⚠️ HTML may require authentication" : "✅ No login requirements detected",
          `📊 Simple Mercury count: ${simpleMercuryCount}`,
          `📦 Total containers: ${totalContainers}`,
          `🚤 Motor listings extracted: ${motorListings.length}`
        ]
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