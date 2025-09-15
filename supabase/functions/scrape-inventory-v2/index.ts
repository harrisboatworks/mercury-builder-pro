import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Clean motor name function to strip HTML tags and normalize text
function cleanMotorName(rawName: string): string {
  if (!rawName) return '';
  
  return rawName
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&lt;|&gt;/g, '') // Remove escaped brackets
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Parse motor details from cleaned title
function parseMotorDetails(title: string) {
  const clean = cleanMotorName(title);
  console.log(`🔍 Parsing title: "${title}" -> "${clean}"`);
  
  // Pattern: Year Category Horsepower FuelType ModelCode
  // Examples: "2025 FourStroke 25HP EFI EH", "2024 Pro XS 225HP XL", "2025 Verado 350HP"
  const pattern = /(\d{4})\s+(FourStroke|Pro\s*XS|SeaPro|Verado)\s*®?\s*(\d+\.?\d*)\s*HP\s*(EFI|TM)?\s*([A-Z]+[A-Z0-9]*)?/i;
  const match = clean.match(pattern);
  
  if (match) {
    console.log(`✅ Parsed: Year=${match[1]}, Category=${match[2]}, HP=${match[3]}, FuelType=${match[4] || ''}, Code=${match[5] || ''}`);
    return {
      year: parseInt(match[1]) || 2025,
      category: match[2]?.replace(/\s/g, '') || 'FourStroke',
      horsepower: parseFloat(match[3]) || 0,
      fuelType: match[4] || '',
      modelCode: match[5] || '',
      fullTitle: clean,
      isValid: true
    };
  }
  
  // Fallback for partial matches - look for HP and year separately
  const hpMatch = clean.match(/(\d+\.?\d*)\s*HP/i);
  const yearMatch = clean.match(/(20(?:24|25))/);
  const categoryMatch = clean.match(/(FourStroke|Pro\s*XS|SeaPro|Verado)/i);
  
  if (hpMatch) {
    console.log(`⚠️ Partial match: HP=${hpMatch[1]}, Year=${yearMatch?.[1] || '2025'}, Category=${categoryMatch?.[1] || 'FourStroke'}`);
    return {
      year: parseInt(yearMatch?.[1] || '2025'),
      category: categoryMatch?.[1]?.replace(/\s/g, '') || 'FourStroke',
      horsepower: parseFloat(hpMatch[1]),
      fuelType: '',
      modelCode: '',
      fullTitle: clean,
      isValid: false
    };
  }
  
  console.log(`❌ No match found for: "${clean}"`);
  return null;
}

// Parse motors from HTML function
async function parseMotorsFromHTML(html: string, markdown: string = '') {
  console.log('🔍 Starting enhanced motor parsing with clean text extraction...')
  
  const motors = []
  
  // Check for result count to verify we're on the right page
  const resultCountPattern = /(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/i
  const resultMatch = (html + markdown).match(resultCountPattern)
  if (resultMatch) {
    console.log(`📊 Result count found: ${resultMatch[1]} - ${resultMatch[2]} of ${resultMatch[3]}`)
  }
  
  // Process each line of markdown for motor information
  const lines = markdown.split('\n').filter(line => line.trim().length > 0);
  console.log('📄 Processing markdown lines:', lines.length);
  
  // Log first 20 non-empty lines for debugging
  console.log('Sample markdown lines:');
  lines.slice(0, 20).forEach((line, i) => {
    console.log(`  ${i + 1}: "${line}"`);
  });

  // Look for motor patterns in markdown using enhanced parsing
  for (const line of lines) {
    // Skip lines that don't contain basic motor indicators
    if (!line.includes('HP') || !line.match(/(20(?:24|25)|FourStroke|Pro.*XS|SeaPro|Verado)/i)) {
      continue;
    }
    
    // Try to parse this line as a motor listing
    const parsed = parseMotorDetails(line);
    if (parsed && parsed.horsepower >= 15 && parsed.horsepower <= 400) {
      // Format the model name properly
      let modelName = '';
      if (parsed.category && parsed.horsepower) {
        modelName = `${parsed.category} ${parsed.horsepower}HP`;
        if (parsed.fuelType) modelName += ` ${parsed.fuelType}`;
        if (parsed.modelCode) modelName += ` ${parsed.modelCode}`;
      } else {
        modelName = parsed.fullTitle.replace(/mercury/gi, '').trim();
      }
      
      const motor = {
        make: 'Mercury',
        model: modelName,
        horsepower: parsed.horsepower,
        motor_type: parsed.category,
        base_price: null,
        year: parsed.year,
        model_code: parsed.modelCode,
        fuel_type: parsed.fuelType
      };
      
      console.log('🎯 Found motor:', `${motor.year} ${motor.make} ${motor.model} ${motor.horsepower}HP`);
      motors.push(motor);
    }
  }
  
  // If still no results from markdown, try HTML with enhanced parsing
  if (motors.length === 0) {
    console.log('⚠️ No motors found in markdown, trying HTML fallback...');
    
    // Extract text content from HTML first
    const tempDiv = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                       .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    const htmlLines = tempDiv.split(/[<>]/).filter(line => 
      line.trim().length > 0 && 
      line.includes('HP') && 
      line.match(/(20(?:24|25)|FourStroke|Pro.*XS|SeaPro|Verado)/i)
    );
    
    console.log('HTML text lines found:', htmlLines.length);
    
    // Sample HTML lines
    if (htmlLines.length > 0) {
      console.log('Sample HTML lines:');
      htmlLines.slice(0, 5).forEach((line, i) => {
        console.log(`  ${i + 1}: "${line}"`);
      });
    }
    
    for (const line of htmlLines) {
      const parsed = parseMotorDetails(line);
      if (parsed && parsed.horsepower >= 15 && parsed.horsepower <= 400) {
        // Format the model name properly
        let modelName = '';
        if (parsed.category && parsed.horsepower) {
          modelName = `${parsed.category} ${parsed.horsepower}HP`;
          if (parsed.fuelType) modelName += ` ${parsed.fuelType}`;
          if (parsed.modelCode) modelName += ` ${parsed.modelCode}`;
        } else {
          modelName = parsed.fullTitle.replace(/mercury/gi, '').trim();
        }
        
        const motor = {
          make: 'Mercury',
          model: modelName,
          horsepower: parsed.horsepower,
          motor_type: parsed.category,
          base_price: null,
          year: parsed.year,
          model_code: parsed.modelCode,
          fuel_type: parsed.fuelType
        };
        
        console.log('🎯 Found motor (HTML):', `${motor.year} ${motor.make} ${motor.model} ${motor.horsepower}HP`);
        motors.push(motor);
      }
    }
  }
  
  // Simple deduplication by horsepower
  const uniqueMotors = motors.filter((motor, index, self) => 
    index === self.findIndex(m => m.horsepower === motor.horsepower)
  )
  
  console.log(`🧹 Deduplication: ${motors.length} → ${uniqueMotors.length} unique motors`)
  
  return {
    motors: uniqueMotors,
    debugInfo: {
      html_length: html.length,
      markdown_length: markdown.length,
      motor_lines_found: motors.length,
      total_matches: motors.length,
      unique_motors: uniqueMotors.length,
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
  
  // Check for existing motors and update or insert
  const { data: existingMotors, error: fetchError } = await supabase
    .from('motor_models')
    .select('id, make, model, horsepower')
    .eq('make', 'Mercury')

  if (fetchError) {
    console.error('Error fetching existing motors:', fetchError)
    return 0
  }

  for (const motor of motors) {
    try {
      // Clean the model name before saving
      const cleanModel = cleanMotorName(motor.model);
      
      // Check if motor already exists
      const existing = existingMotors?.find(existing => 
        existing.make === motor.make &&
        existing.model === cleanModel &&
        Math.abs(existing.horsepower - motor.horsepower) < 0.1
      )

      if (existing) {
        // Update existing motor with clean data
        const { error: updateError } = await supabase
          .from('motor_models')
          .update({
            model: cleanModel,
            motor_type: motor.motor_type,
            year: motor.year,
            updated_at: new Date().toISOString(),
            last_scraped: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error updating motor:', updateError)
        } else {
          savedCount++
          console.log(`✅ Updated: ${motor.make} ${cleanModel} ${motor.horsepower}HP`)
        }
      } else {
        // Insert new motor with clean data
        const { error: insertError } = await supabase
          .from('motor_models')
          .insert({
            make: motor.make,
            model: cleanModel,
            horsepower: motor.horsepower,
            motor_type: motor.motor_type,
            base_price: motor.base_price,
            year: motor.year,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_scraped: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error inserting motor:', insertError)
        } else {
          savedCount++
          console.log(`✅ Inserted: ${motor.make} ${cleanModel} ${motor.horsepower}HP`)
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

    console.log('🚀 Starting multi-page inventory scrape with enhanced parsing...')
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

    // Get sample motors (first 3) for verification with clean data
    const sampleMotors = uniqueMotors.slice(0, 3).map(motor => ({
      make: motor.make,
      model: cleanMotorName(motor.model),
      horsepower: motor.horsepower,
      motor_type: motor.motor_type,
      year: motor.year,
      model_code: motor.model_code || '',
      fuel_type: motor.fuel_type || ''
    }))

    const result = {
      success: true,
      message: `Enhanced multi-page scrape completed! ${successfulPages}/${pages_to_scrape} pages successful. Found ${totalMotorsFound} total motors (${totalUniqueMotors} unique), saved ${savedMotors} to database with clean formatting`,
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
      api_version: 'v2-enhanced',
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