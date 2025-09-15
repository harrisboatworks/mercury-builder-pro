import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
        
        const result = {
          success: true,
          message: `Firecrawl v1 test successful! Scraped ${pagesToScrape} pages`,
          firecrawl_status: firecrawlResponse.status,
          html_length: firecrawlData.data?.html?.length || 0,
          markdown_length: firecrawlData.data?.markdown?.length || 0,
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