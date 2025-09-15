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

// Parse motor title components exactly as they appear on harrisboatworks.ca
function parseMotorTitle(title: string) {
  // Remove " - Mercury" suffix and clean HTML
  const clean = cleanMotorName(title).replace(/\s*-\s*Mercury\s*$/i, '').trim();
  console.log(`🔍 Parsing harrisboatworks.ca title: "${title}" -> "${clean}"`);
  
  // Pattern: Year Category HP FuelType ModelCode
  // Examples: "2025 FourStroke 25HP EFI ELHPT", "2024 ProXS 225HP XL", "2025 Verado 350HP"
  const pattern = /(\d{4})\s+(FourStroke|Pro\s*XS|ProXS|SeaPro|Verado|Racing)\s*®?\s*(\d+\.?\d*)\s*HP\s*(EFI|TM)?\s*([A-Z][A-Z0-9]*)?/i;
  const match = clean.match(pattern);
  
  if (match) {
    const category = match[2]?.replace(/\s/g, '') || 'FourStroke';
    const horsepower = parseFloat(match[3]) || 0;
    const fuelType = match[4] || '';
    const modelCode = match[5] || '';
    
    console.log(`✅ Parsed harrisboatworks.ca: Year=${match[1]}, Category=${category}, HP=${horsepower}, FuelType=${fuelType}, Code=${modelCode}`);
    
    return {
      year: parseInt(match[1]) || 2025,
      category: category,
      horsepower: horsepower,
      fuelType: fuelType,
      modelCode: modelCode, // CRITICAL: EH, ELHPT, XL, EXLPT, etc.
      fullTitle: clean,
      displayTitle: `${match[1]} ${category} ${horsepower}HP ${fuelType} ${modelCode}`.replace(/\s+/g, ' ').trim(),
      isValid: true
    };
  }
  
  // Enhanced fallback parsing for partial matches
  const hpMatch = clean.match(/(\d+\.?\d*)\s*HP/i);
  const yearMatch = clean.match(/(20(?:24|25))/);
  const categoryMatch = clean.match(/(FourStroke|Pro\s*XS|ProXS|SeaPro|Verado|Racing)/i);
  const fuelMatch = clean.match(/(EFI|TM)/i);
  const codeMatch = clean.match(/\s([A-Z][A-Z0-9]{1,5})\s*$/i); // Model codes at end
  
  if (hpMatch) {
    const category = categoryMatch?.[1]?.replace(/\s/g, '') || 'FourStroke';
    const horsepower = parseFloat(hpMatch[1]);
    const year = parseInt(yearMatch?.[1] || '2025');
    const fuelType = fuelMatch?.[1] || '';
    const modelCode = codeMatch?.[1] || '';
    
    console.log(`⚠️ Partial harrisboatworks.ca match: HP=${horsepower}, Year=${year}, Category=${category}, Code=${modelCode}`);
    
    return {
      year: year,
      category: category,
      horsepower: horsepower,
      fuelType: fuelType,
      modelCode: modelCode,
      fullTitle: clean,
      displayTitle: `${year} ${category} ${horsepower}HP ${fuelType} ${modelCode}`.replace(/\s+/g, ' ').trim(),
      isValid: false
    };
  }
  
  console.log(`❌ No harrisboatworks.ca match found for: "${clean}"`);
  return null;
}

// Extract additional motor data from harrisboatworks.ca structure
function extractMotorData(text: string) {
  const data = {
    salePrice: null,
    msrp: null,
    savings: null,
    stockNumber: null,
    availability: null,
    usage: null
  };
  
  // Extract pricing information
  const salePriceMatch = text.match(/\$([0-9,]+\.?[0-9]*)/);
  if (salePriceMatch) {
    data.salePrice = parseFloat(salePriceMatch[1].replace(/,/g, ''));
  }
  
  // Extract savings
  const savingsMatch = text.match(/You Save \$([0-9,]+\.?[0-9]*)/i);
  if (savingsMatch) {
    data.savings = parseFloat(savingsMatch[1].replace(/,/g, ''));
  }
  
  // Extract stock number
  const stockMatch = text.match(/Stock.*?#?:?\s*([0-9A-Z]+)/i);
  if (stockMatch) {
    data.stockNumber = stockMatch[1];
  }
  
  // Extract availability
  if (text.includes('In Stock')) {
    data.availability = 'In Stock';
  } else if (text.includes('Available')) {
    data.availability = 'Available';
  } else if (text.includes('Special Order')) {
    data.availability = 'Special Order';
  }
  
  // Extract usage
  if (text.includes('New')) {
    data.usage = 'New';
  }
  
  return data;
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

  // Look for harrisboatworks.ca motor patterns in markdown
  for (const line of lines) {
    // Skip lines that don't contain basic motor indicators
    if (!line.includes('HP') || !line.match(/(20(?:24|25)|FourStroke|Pro.*XS|SeaPro|Verado)/i)) {
      continue;
    }
    
    // Try to parse this line as a harrisboatworks.ca motor listing
    const parsed = parseMotorTitle(line);
    if (parsed && parsed.horsepower >= 15 && parsed.horsepower <= 400) {
      // Extract additional data from the line context
      const additionalData = extractMotorData(line);
      
      // Use the clean display title format (no "Mercury" prefix)
      const modelName = parsed.displayTitle;
      
      const motor = {
        make: 'Mercury',
        model: modelName,
        horsepower: parsed.horsepower,
        motor_type: parsed.category,
        base_price: additionalData.salePrice,
        sale_price: additionalData.salePrice,
        msrp: additionalData.msrp,
        savings: additionalData.savings,
        stock_number: additionalData.stockNumber,
        availability: additionalData.availability,
        usage: additionalData.usage,
        year: parsed.year,
        model_code: parsed.modelCode, // CRITICAL: Preserve model codes
        fuel_type: parsed.fuelType,
        full_title: parsed.fullTitle
      };
      
      console.log('🎯 Found harrisboatworks.ca motor:', `${motor.year} ${motor.model} (${motor.stock_number})`);
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
      const parsed = parseMotorTitle(line);
      if (parsed && parsed.horsepower >= 15 && parsed.horsepower <= 400) {
        // Extract additional data from HTML context
        const additionalData = extractMotorData(line);
        
        // Use the clean display title format
        const modelName = parsed.displayTitle;
        
        const motor = {
          make: 'Mercury',
          model: modelName,
          horsepower: parsed.horsepower,
          motor_type: parsed.category,
          base_price: additionalData.salePrice,
          sale_price: additionalData.salePrice,
          msrp: additionalData.msrp,
          savings: additionalData.savings,
          stock_number: additionalData.stockNumber,
          availability: additionalData.availability,
          usage: additionalData.usage,
          year: parsed.year,
          model_code: parsed.modelCode, // CRITICAL: Preserve model codes
          fuel_type: parsed.fuelType,
          full_title: parsed.fullTitle
        };
        
        console.log('🎯 Found harrisboatworks.ca motor (HTML):', `${motor.year} ${motor.model} (${motor.stock_number})`);
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
            base_price: motor.base_price || motor.sale_price,
            sale_price: motor.sale_price,
            stock_number: motor.stock_number,
            availability: motor.availability || 'Available',
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

    // Get sample motors (first 3) for verification with harrisboatworks.ca format
    const sampleMotors = uniqueMotors.slice(0, 3).map(motor => ({
      make: motor.make,
      model: cleanMotorName(motor.model), // Clean display format: "2025 FourStroke 25HP EFI ELHPT"
      horsepower: motor.horsepower,
      motor_type: motor.motor_type,
      base_price: motor.base_price,
      sale_price: motor.sale_price,
      stock_number: motor.stock_number,
      availability: motor.availability,
      year: motor.year,
      model_code: motor.model_code || '', // CRITICAL: EH, ELHPT, XL, etc.
      fuel_type: motor.fuel_type || '',
      full_title: motor.full_title
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