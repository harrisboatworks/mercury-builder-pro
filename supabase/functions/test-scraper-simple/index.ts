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
    console.log('🧪 Testing XML feed from Harris Boatworks inventory...')
    
    const xmlUrl = 'https://www.harrisboatworks.ca/unitinventory_univ.xml'
    console.log('🔍 Fetching XML:', xmlUrl)

    // Fetch XML directly - no Firecrawl needed!
    const xmlResponse = await fetch(xmlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InventoryBot/1.0)'
      }
    })

    if (!xmlResponse.ok) {
      throw new Error(`XML fetch failed: ${xmlResponse.status} - ${xmlResponse.statusText}`)
    }

    const xmlContent = await xmlResponse.text()
    console.log('✅ XML response received')
    console.log('📄 XML Length:', xmlContent.length, 'characters')

    console.log('📄 First 1000 characters:')
    console.log(xmlContent.substring(0, 1000))

    // Count Mercury motors in XML
    const mercuryMatches = xmlContent.match(/<make>Mercury<\/make>/gi) || []
    console.log('🚤 Mercury motors found in XML:', mercuryMatches.length)

    // Extract sample XML units
    const unitMatches = xmlContent.match(/<unit>[\s\S]*?<\/unit>/gi) || []
    console.log('📦 Total units in XML:', unitMatches.length)

    // Find Mercury units specifically
    const mercuryUnits = unitMatches.filter(unit => 
      unit.toLowerCase().includes('<make>mercury</make>')
    )
    console.log('🎯 Mercury units found:', mercuryUnits.length)

    // Sample Mercury units
    console.log('\n📋 SAMPLE MERCURY UNITS:')
    mercuryUnits.slice(0, 3).forEach((unit, i) => {
      console.log(`Sample ${i + 1}:`, unit.substring(0, 300) + '...')
    })

    // Parse XML for Mercury motor details
    const mercuryMotors = []
    
    for (const unit of mercuryUnits.slice(0, 10)) { // Process first 10 for testing
      try {
        const motor = {
          make: unit.match(/<make>(.*?)<\/make>/i)?.[1] || '',
          model: unit.match(/<model>(.*?)<\/model>/i)?.[1] || '',
          year: unit.match(/<year>(.*?)<\/year>/i)?.[1] || '',
          stockNumber: unit.match(/<stocknumber>(.*?)<\/stocknumber>/i)?.[1] || '',
          internetPrice: unit.match(/<internetprice>(.*?)<\/internetprice>/i)?.[1] || '',
          isNew: unit.match(/<new>(.*?)<\/new>/i)?.[1]?.toLowerCase() === 'true',
          type: unit.match(/<type>(.*?)<\/type>/i)?.[1] || '',
          horsepower: unit.match(/<horsepower>(.*?)<\/horsepower>/i)?.[1] || ''
        }
        
        // Only include if it's a Mercury motor
        if (motor.make?.toLowerCase() === 'mercury') {
          mercuryMotors.push(motor)
        }
      } catch (e) {
        console.log('❌ Error parsing unit:', e.message)
      }
    }

    console.log('\n🎯 PARSED MERCURY MOTORS:', mercuryMotors.length)
    mercuryMotors.slice(0, 3).forEach((motor, i) => {
      console.log(`Motor ${i + 1}:`, JSON.stringify(motor, null, 2))
    })

    // Return XML analysis results
    return new Response(JSON.stringify({
      success: true,
      source: 'xml-feed',
      xmlLength: xmlContent.length,
      xmlSample: xmlContent.substring(0, 10000), // First 10k characters for display
      analysis: {
        totalUnits: unitMatches.length,
        mercuryUnits: mercuryUnits.length,
        parsedMotors: mercuryMotors.length,
        sampleMotors: mercuryMotors.slice(0, 5)
      },
      troubleshooting: {
        xmlAccessible: true,
        mercuryCount: mercuryMatches.length,
        hasInventoryData: unitMatches.length > 0,
        hasStructuredData: mercuryMotors.length > 0
      },
      summary: `XML feed contains ${unitMatches.length} total units, ${mercuryUnits.length} Mercury units, successfully parsed ${mercuryMotors.length} motors`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('❌ XML test error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'XML test failed',
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