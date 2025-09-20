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
    console.log('📄 HTML Length:', html.length, 'characters');
    console.log('📄 First 2000 characters:');
    console.log(html.substring(0, 2000));

    // Find and log actual Mercury motor HTML snippets
    const mercuryIndex = html.indexOf('Mercury');
    if (mercuryIndex > -1) {
      console.log('\n🏷️ SAMPLE MERCURY HTML:');
      console.log(html.substring(mercuryIndex - 100, mercuryIndex + 200));
      
      // Find additional Mercury instances
      const allMercuryIndices = [];
      let index = html.indexOf('Mercury', 0);
      while (index !== -1 && allMercuryIndices.length < 5) {
        allMercuryIndices.push(index);
        index = html.indexOf('Mercury', index + 1);
      }
      
      console.log('\n🔍 MULTIPLE MERCURY SAMPLES:');
      allMercuryIndices.forEach((idx, i) => {
        console.log(`Sample ${i + 1}:`, html.substring(idx - 50, idx + 100));
      });
    }
    
    // Find where HP appears near Mercury
    const hpNearMercury = html.match(/.{0,50}Mercury.{0,50}HP.{0,50}/gi);
    if (hpNearMercury) {
      console.log('\n🔥 MERCURY+HP PATTERNS:', hpNearMercury.slice(0, 3));
    } else {
      console.log('\n❌ NO MERCURY+HP PATTERNS FOUND - checking separately...');
      
      // Check if HP appears anywhere
      const hpMatches = html.match(/.{0,20}HP.{0,20}/gi);
      if (hpMatches) {
        console.log('🔧 HP PATTERNS (first 3):', hpMatches.slice(0, 3));
      }
      
      // Check different HP formats
      const hpFormats = [
        /\d+\s*HP/gi,
        /HP\s*\d+/gi,
        /\d+HP/gi,
        /HP:\s*\d+/gi
      ];
      
      hpFormats.forEach((regex, i) => {
        const matches = html.match(regex);
        if (matches) {
          console.log(`🎯 HP FORMAT ${i + 1}:`, matches.slice(0, 3));
        }
      });
    }
    
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
    
    // 3. URL-BASED PATTERN EXTRACTION (Updated for Harris Boatworks)
    console.log(`\n🔍 PATTERN COMPARISON:`)
    
    // Extract Mercury inventory URLs (the key discovery!)
    const mercuryInventoryUrls = html.match(/href="[^"]*\/inventory\/[^"]*mercury[^"]*hp[^"]*"/gi) || []
    console.log('🚤 Mercury Inventory URLs found:', mercuryInventoryUrls.length)
    
    // Parse motors from URLs
    const urlBasedMotors = []
    mercuryInventoryUrls.forEach(urlMatch => {
      const url = urlMatch.match(/href="([^"]*)"/)?.[1] || ''
      const urlPath = url.split('/').pop() || ''
      
      // Parse URL format: 2025-mercury-pro-xs-115hp-exlpt-gores-landing-on-k0k-2e0-12754476i
      const motorMatch = urlPath.match(/(\d{4})-mercury-([^-]+(?:-[^-]+)*)-(\d+)hp-([^-]+)/)
      if (motorMatch) {
        const [, year, model, hp, rigCode] = motorMatch
        urlBasedMotors.push({
          year,
          brand: 'Mercury', 
          model: model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          hp: parseInt(hp),
          rigCode: rigCode.toUpperCase(),
          url: url,
          stockId: urlPath.split('-').pop() // Last segment might be stock ID
        })
      }
    })
    
    console.log('🎯 NEW URL-BASED EXTRACTION:', urlBasedMotors.length)
    if (urlBasedMotors.length > 0) {
      console.log('Sample parsed motors:', urlBasedMotors.slice(0, 3).map(m => 
        `${m.brand} ${m.hp}HP ${m.model} ${m.rigCode}`
      ))
    }
    
    // Legacy patterns (for comparison)
    const legacyPatterns = {
      mercuryHP: html.match(/Mercury\s+\d+(?:\.\d+)?\s*HP/gi) || [],
      mercuryModel: html.match(/Mercury\s+\d+(?:\.\d+)?\s*[A-Z]{2,6}(?:\s+[A-Za-z]+)?/gi) || [],
      stockNumbers: html.match(/Stock\s*[#:]?\s*[A-Z0-9\-]+/gi) || [],
      prices: html.match(/\$[\d,]+(?:\.\d{2})?/gi) || [],
      rigCodes: html.match(/\b(EL[HP]PT|EXLPT|XL|XXL|MLH|MXLH|CT|DTS|MH)\b/gi) || []
    }
    
    // Basic counts
    const basicCounts = {
      mercury: (html.match(/Mercury/gi) || []).length,
      hp: (html.match(/hp/gi) || []).length,
      stock: (html.match(/Stock/gi) || []).length,
      dollar: (html.match(/\$/g) || []).length,
      outboard: (html.match(/outboard/gi) || []).length
    }
    
    console.log(`Simple patterns:`)
    console.log(`  - Mercury mentions: ${basicCounts.mercury}`)
    console.log(`  - HP mentions: ${basicCounts.hp}`)
    console.log(`  - Stock mentions: ${basicCounts.stock}`)
    console.log(`  - Dollar signs: ${basicCounts.dollar}`)
    console.log(`  - Outboard mentions: ${basicCounts.outboard}`)
    
    console.log(`Legacy text-based patterns:`)
    console.log(`  - Mercury HP: ${legacyPatterns.mercuryHP.length}`)
    console.log(`  - Mercury Models: ${legacyPatterns.mercuryModel.length}`)
    console.log(`  - Stock Numbers: ${legacyPatterns.stockNumbers.length}`)
    console.log(`  - Prices: ${legacyPatterns.prices.length}`)
    console.log(`  - Rig Codes: ${legacyPatterns.rigCodes.length}`)
    
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
    if (urlBasedMotors.length > 0) {
      console.log(`\n🏷️ SAMPLE URL-BASED MOTORS: ${urlBasedMotors.slice(0, 3).map(m => 
        `${m.brand} ${m.hp}HP ${m.model} ${m.rigCode}`
      )}`)
    }
    if (legacyPatterns.stockNumbers.length > 0) {
      console.log(`📦 SAMPLE STOCK NUMBERS: ${legacyPatterns.stockNumbers.slice(0, 5)}`)
    }
    if (legacyPatterns.prices.length > 0) {
      console.log(`💰 SAMPLE PRICES: ${legacyPatterns.prices.slice(0, 5)}`)
    }
    
    // 6. ENHANCED MOTOR EXTRACTION FROM URLs
    const motorListings = urlBasedMotors // Use URL-based extraction instead
    
    console.log(`\n🚤 FINAL ANALYSIS:`)
    console.log(`  - Motor sections found: ${mercuryInventoryUrls.length}`)
    console.log(`  - Motor listings extracted: ${motorListings.length}`)
    
    if (motorListings.length > 0) {
      console.log(`🏷️ Sample Motors: ${motorListings.slice(0, 3).map(m => 
        `${m.brand} ${m.hp}HP ${m.model} ${m.rigCode}`
      )}`)
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
          basicCounts,
          legacyPatterns: {
            mercuryHP: legacyPatterns.mercuryHP.length,
            mercuryModel: legacyPatterns.mercuryModel.length,
            stockNumbers: legacyPatterns.stockNumbers.length,
            prices: legacyPatterns.prices.length,
            rigCodes: legacyPatterns.rigCodes.length
          },
          
          // NEW: URL-based extraction results
          urlBasedExtraction: {
            mercuryInventoryUrls: mercuryInventoryUrls.length,
            parsedMotors: urlBasedMotors.length,
            sampleUrls: mercuryInventoryUrls.slice(0, 3),
            sampleMotors: urlBasedMotors.slice(0, 3)
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
            sampleMotors: motorListings.slice(0, 5)
          },
          
          // Debugging samples
          sampleData: {
            mercuryHPMatches: legacyPatterns.mercuryHP.slice(0, 5),
            stockNumbers: legacyPatterns.stockNumbers.slice(0, 5),
            prices: legacyPatterns.prices.slice(0, 5),
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