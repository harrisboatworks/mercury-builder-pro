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
        waitFor: 4000,           // Wait 4 seconds for JavaScript
        timeout: 45000,          // 45 second timeout
        onlyMainContent: false,  // Get full page content
        includeHtml: true,
        mobile: false,
        followRedirects: true
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
    
    // Analyze the HTML content
    const html = data.data?.html || ''
    const htmlLength = html.length
    
    // Look for Mercury motor indicators
    const mercuryCount = (html.match(/Mercury/gi) || []).length
    const hpMatches = (html.match(/\d+\s*HP/gi) || []).length
    const rigCodeMatches = (html.match(/EL[HP]PT|XL|L/gi) || []).length
    
    // Extract sample motor titles (first few)
    const titleMatches = html.match(/<h[1-6][^>]*>([^<]*(?:Mercury|HP)[^<]*)<\/h[1-6]>/gi) || []
    const sampleTitles = titleMatches.slice(0, 5).map(match => 
      match.replace(/<[^>]*>/g, '').trim()
    )

    console.log(`📊 Analysis: ${htmlLength} chars, ${mercuryCount} "Mercury", ${hpMatches} HP, ${rigCodeMatches} rig codes`)
    console.log('🏷️ Sample titles:', sampleTitles)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Firecrawl test completed successfully',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        results: {
          url: targetUrl,
          htmlLength,
          mercuryMentions: mercuryCount,
          hpMatches,
          rigCodeMatches,
          sampleTitles,
          hasContent: htmlLength > 10000,
          likelySuccess: mercuryCount > 5 && hpMatches > 3
        },
        // Include first 2000 chars of HTML for inspection
        htmlSample: html.substring(0, 2000)
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