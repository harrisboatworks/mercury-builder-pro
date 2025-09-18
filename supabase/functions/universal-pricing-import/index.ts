import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface PricingRecord {
  model_number: string
  description: string
  msrp: number
  dealer_price: number
  model_display?: string
  horsepower?: number
  family?: string
  rigging_code?: string
  is_new?: boolean
}

// Parse Mercury model numbers to extract horsepower and features
function parseModelNumber(modelNumber: string, description: string) {
  const hp = extractHorsepower(description)
  const family = extractFamily(description)
  const riggingCode = extractRiggingCode(description)
  
  return {
    horsepower: hp,
    family: family,
    rigging_code: riggingCode,
    model_display: formatDisplayName(description)
  }
}

function extractHorsepower(description: string): number | null {
  // Extract HP from descriptions like "25ELPT FourStroke", "9.9MH FourStroke", "300L Pro XS"
  const match = description.match(/^(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : null
}

function extractFamily(description: string): string {
  if (description.includes('Pro XS')) return 'ProXS'
  if (description.includes('SeaPro')) return 'SeaPro'
  if (description.includes('ProKicker')) return 'ProKicker'
  if (description.includes('Command Thrust')) return 'FourStroke'
  return 'FourStroke'
}

function extractRiggingCode(description: string): string | null {
  // Extract rigging codes like MH, MLH, ELPT, etc.
  const riggingMatch = description.match(/\d+(?:\.\d+)?([A-Z]+)/)
  return riggingMatch ? riggingMatch[1] : null
}

function formatDisplayName(description: string): string {
  // Clean up and format the display name
  return description
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePricing(priceStr: string): number {
  // Remove $ and commas, convert to number
  return parseFloat(priceStr.replace(/[$,]/g, ''))
}

// Parse CSV format
function parseCSV(csvContent: string): PricingRecord[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  const records: PricingRecord[] = []
  
  // Skip header if present
  const dataLines = lines[0].includes('model_number') || lines[0].includes('Model Number') 
    ? lines.slice(1) : lines
  
  for (const line of dataLines) {
    const parts = line.split(',').map(part => part.trim().replace(/^"|"$/g, ''))
    
    if (parts.length >= 4) {
      const [modelNumber, description, msrpStr, dealerPriceStr] = parts
      
      const record: PricingRecord = {
        model_number: modelNumber,
        description: description,
        msrp: parsePricing(msrpStr),
        dealer_price: parsePricing(dealerPriceStr),
        ...parseModelNumber(modelNumber, description)
      }
      
      records.push(record)
    }
  }
  
  return records
}

// Parse Markdown format (like the current 2026 data)
function parseMarkdown(markdownContent: string): PricingRecord[] {
  const lines = markdownContent.split('\n').filter(line => line.trim() && line.includes('|'))
  const records: PricingRecord[] = []
  
  for (const line of lines) {
    const parts = line.split('|').map(part => part.trim())
    
    if (parts.length === 4) {
      const [modelNumber, description, msrpStr, dealerPriceStr] = parts
      
      const record: PricingRecord = {
        model_number: modelNumber,
        description: description,
        msrp: parsePricing(msrpStr),
        dealer_price: parsePricing(dealerPriceStr),
        ...parseModelNumber(modelNumber, description)
      }
      
      records.push(record)
    }
  }
  
  return records
}

// Parse JSON format
function parseJSON(jsonContent: string): PricingRecord[] {
  const data = JSON.parse(jsonContent)
  const records: PricingRecord[] = []
  
  const arrayData = Array.isArray(data) ? data : data.data || []
  
  for (const item of arrayData) {
    if (item.model_number && item.description) {
      const record: PricingRecord = {
        model_number: item.model_number,
        description: item.description || item.model_display || '',
        msrp: typeof item.msrp === 'string' ? parsePricing(item.msrp) : (item.msrp || 0),
        dealer_price: typeof item.dealer_price === 'string' ? parsePricing(item.dealer_price) : (item.dealer_price || 0),
        ...parseModelNumber(item.model_number, item.description || item.model_display || '')
      }
      
      records.push(record)
    }
  }
  
  return records
}

// Auto-detect format and parse accordingly
function parseImportData(content: string, filename?: string): PricingRecord[] {
  const trimmedContent = content.trim()
  
  // Detect format
  if (filename?.endsWith('.json') || trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
    console.log('📄 Detected JSON format')
    return parseJSON(trimmedContent)
  } else if (filename?.endsWith('.csv') || trimmedContent.includes(',')) {
    console.log('📊 Detected CSV format')
    return parseCSV(trimmedContent)
  } else {
    console.log('📝 Detected Markdown/pipe-delimited format')
    return parseMarkdown(trimmedContent)
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    console.log('🚀 Starting universal pricing import...')
    
    const body = await req.json()
    const { content, filename, preview_only = false } = body
    
    if (!content) {
      throw new Error('No content provided for import')
    }

    // Parse the pricing data
    const pricingRecords = parseImportData(content, filename)
    console.log(`📊 Parsed ${pricingRecords.length} pricing records`)
    
    if (pricingRecords.length === 0) {
      throw new Error('No valid pricing records found in the provided data')
    }

    // If preview only, return the parsed data without making changes
    if (preview_only) {
      return new Response(JSON.stringify({
        success: true,
        preview: true,
        totalRecords: pricingRecords.length,
        sampleRecords: pricingRecords.slice(0, 5),
        message: `Preview: Found ${pricingRecords.length} valid pricing records`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check which models already exist in database
    const { data: existingModels, error: fetchError } = await supabase
      .from('motor_models')
      .select('id, model_number, msrp, dealer_price, is_brochure')

    if (fetchError) {
      throw new Error(`Failed to fetch existing models: ${fetchError.message}`)
    }

    const existingModelMap = new Map(
      existingModels?.map(m => [m.model_number, m]) || []
    )

    // Separate records into updates and inserts
    const updatesNeeded: any[] = []
    const insertsNeeded: any[] = []
    let priceUpdates = 0
    let newModels = 0

    for (const record of pricingRecords) {
      const existing = existingModelMap.get(record.model_number)
      
      if (existing) {
        // Check if prices need updating
        const msrpChanged = Math.abs((existing.msrp || 0) - record.msrp) > 0.01
        const dealerPriceChanged = Math.abs((existing.dealer_price || 0) - record.dealer_price) > 0.01
        
        if (msrpChanged || dealerPriceChanged) {
          updatesNeeded.push({
            id: existing.id,
            msrp: record.msrp,
            dealer_price: record.dealer_price,
            updated_at: new Date().toISOString()
          })
          priceUpdates++
        }
      } else {
        // New model to insert
        insertsNeeded.push({
          model_number: record.model_number,
          model_display: record.model_display,
          model: 'Outboard',
          motor_type: 'Outboard',
          msrp: record.msrp,
          dealer_price: record.dealer_price,
          horsepower: record.horsepower,
          family: record.family,
          rigging_code: record.rigging_code,
          year: 2026,
          is_brochure: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        newModels++
      }
    }

    console.log(`🔄 Processing ${priceUpdates} price updates and ${newModels} new models`)

    // Batch update existing records
    if (updatesNeeded.length > 0) {
      const batchSize = 100
      for (let i = 0; i < updatesNeeded.length; i += batchSize) {
        const batch = updatesNeeded.slice(i, i + batchSize)
        
        for (const update of batch) {
          const { error: updateError } = await supabase
            .from('motor_models')
            .update({
              msrp: update.msrp,
              dealer_price: update.dealer_price,
              updated_at: update.updated_at
            })
            .eq('id', update.id)
          
          if (updateError) {
            console.error(`Failed to update model ${update.id}:`, updateError)
          }
        }
      }
    }

    // Batch insert new records
    if (insertsNeeded.length > 0) {
      const batchSize = 50
      for (let i = 0; i < insertsNeeded.length; i += batchSize) {
        const batch = insertsNeeded.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from('motor_models')
          .insert(batch)
        
        if (insertError) {
          console.error('Failed to insert batch:', insertError)
          throw new Error(`Failed to insert new models: ${insertError.message}`)
        }
      }
    }

    console.log(`✅ Import completed: ${priceUpdates} updates, ${newModels} new models`)

    return new Response(JSON.stringify({
      success: true,
      totalRecordsProcessed: pricingRecords.length,
      priceUpdatesApplied: priceUpdates,
      newModelsAdded: newModels,
      skippedRecords: pricingRecords.length - priceUpdates - newModels,
      message: `Successfully imported ${pricingRecords.length} pricing records`,
      format: filename ? (filename.endsWith('.json') ? 'JSON' : filename.endsWith('.csv') ? 'CSV' : 'Markdown') : 'Auto-detected'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Import error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(JSON.stringify({
      success: false,
      totalRecordsProcessed: 0,
      priceUpdatesApplied: 0,
      newModelsAdded: 0,
      skippedRecords: 0,
      message: 'Import failed',
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})