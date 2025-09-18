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

// The 2026 pricing data as extracted from the markdown
const PRICING_DATA_2026 = `
1F02201KK|2.5MH FourStroke|$1,385|$1,271
1F03201KK|3.5MH FourStroke|$1,660|$1,524
1F03211KK|3.5MLH FourStroke|$1,700|$1,557
1F04201KK|4MH FourStroke|$1,980|$1,815
1F04211KK|4MLH FourStroke|$2,020|$1,854
1FX5201KK|5MH FourStroke|$2,200|$2,019
1F05221KK|5MXLH FourStroke|$2,280|$2,090
1F05216KK|5MLHA Sail Power FourStroke|$2,245|$2,057
1FX6201KK|6MH FourStroke|$2,275|$2,085
1FX6211KK|6MLH FourStroke|$2,310|$2,118
1A08201LK|8MH FourStroke|$3,310|$3,036
1A08211LK|8MLH FourStroke|$3,355|$3,075
1A08301LK|8EH FourStroke|$3,650|$3,344
1A08311LK|8ELH FourStroke|$3,690|$3,383
1A10204LV|9.9MRC FourStroke|$3,870|$3,548
1A10201LK|9.9MH FourStroke|$3,875|$3,553
1A10211LK|9.9MLH FourStroke|$3,925|$3,597
1A10301LK|9.9EH FourStroke|$4,230|$3,878
1A10312LK|9.9EL FourStroke|$4,325|$3,966
1A10311LK|9.9ELH FourStroke|$4,435|$4,065
1A10402LK|9.9EPT FourStroke|$4,900|$4,494
1A10251LK|9.9MLH Command Thrust FourStroke|$4,250|$3,894
1A10261LK|9.9MXLH Command Thrust FourStroke|$4,375|$4,010
1A10351LK|9.9ELH Command Thrust FourStroke|$4,790|$4,389
1A10361LK|9.9EXLH Command Thrust FourStroke|$4,870|$4,466
1A10452LK|9.9ELPT Command Thrust ProKicker EFI FourStroke|$5,345|$4,901
1A10462LK|9.9EXLPT Command Thrust ProKicker EFI FourStroke|$5,435|$4,983
1A10451LK|9.9ELHPT Command Thrust ProKicker EFI FourStroke|$5,455|$5,000
1A10461LK|9.9EXLHPT Command Thrust ProKicker EFI FourStroke|$5,555|$5,093
1A15204LK|15MRC FourStroke|$4,180|$3,834
1A15201LK|15MH FourStroke|$4,225|$3,872
1A15211LK|15MLH FourStroke|$4,280|$3,922
1A15302LK|15E FourStroke|$4,570|$4,191
1A15312LK|15EL FourStroke|$4,600|$4,219
1A15301LK|15EH FourStroke|$4,600|$4,219
1A15311LK|15ELH FourStroke|$4,660|$4,274
1A15402LK|15EPT FourStroke|$5,190|$4,758
1A15401LK|15EHPT FourStroke|$5,220|$4,785
1A15412LK|15ELPT FourStroke|$5,110|$4,686
1A15452BK|15ELPT ProKicker FourStroke|$5,855|$5,368
1A15462BK|15EXLPT ProKicker FourStroke|$5,950|$5,456
1A15451BK|15ELHPT ProKicker FourStroke|$5,960|$5,462
1A15461BK|15EXLHPT ProKicker FourStroke|$6,080|$5,572
1A20204LK|20MRC FourStroke|$4,565|$4,186
1A20201LK|20MH FourStroke|$4,615|$4,230
1A20211LK|20MLH FourStroke|$4,655|$4,268
1A20301LK|20EH FourStroke|$5,110|$4,686
1A20302LK|20E FourStroke|$5,100|$4,675
1A20311LK|20ELH FourStroke|$5,185|$4,752
1A20312LK|20EL FourStroke|$5,090|$4,664
1A20402LK|20EPT FourStroke|$5,740|$5,264
1A20411LK|20ELHPT FourStroke|$5,880|$5,390
1A20412LK|20ELPT FourStroke|$5,740|$5,264
1A25203BK|25MH FourStroke|$5,320|$4,879
1A25213BK|25MLH FourStroke|$5,420|$4,967
1A25301BK|25EH FourStroke|$5,730|$5,253
1A25311BK|25ELH FourStroke|$5,935|$5,440
1A25312BK|25EL FourStroke|$5,675|$5,203
1A25403BK|25EPT FourStroke|$6,450|$5,913
1A25411BK|25ELHPT FourStroke|$6,665|$6,111
1A25413BK|25ELPT FourStroke|$6,540|$5,995
1A25452BK|25ELPT ProKicker FourStroke|$6,860|$6,287
1A25462BK|25EXLPT ProKicker FourStroke|$7,025|$6,441
1A3G203BK|30MHGA FourStroke|$7,405|$6,787
1A3G213BK|30MLHGA FourStroke|$7,465|$6,842
1A3G313BK|30ELGA FourStroke|$8,030|$7,359
1A3G311BK|30ELHGA FourStroke|$8,160|$7,480
1A30403BK|30EPT FourStroke|$8,210|$7,524
1A30413BK|30ELPT FourStroke|$8,515|$7,805
1A30411BK|30ELHPT FourStroke|$8,645|$7,926
1F40403GZ|40EPT FourStroke|$10,750|$9,460
1F40413GZ|40ELPT FourStroke|$10,830|$9,532
1F4041TJZ|40ELHPT FourStroke Tiller|$11,425|$10,054
1F41453GZ|40ELPT Command Thrust (Four-Cylinder) FourStroke|$11,250|$9,900
1F51413GZ|50ELPT FourStroke|$12,165|$10,703
1F5141TJZ|50ELHPT FourStroke Tiller|$12,905|$11,358
1F51453GZ|50ELPT Command Thrust FourStroke|$12,645|$11,127
1F5145TJZ|50ELHPT Command Thrust FourStroke Tiller|$13,180|$11,600
1F60413GZ|60ELPT FourStroke|$13,820|$12,161
1F6041TJZ|60ELHPT FourStroke Tiller|$14,575|$12,826
1F60453GZ|60ELPT Command Thrust FourStroke|$14,170|$12,469
1F60463GZ|60EXLPT Command Thrust FourStroke|$14,565|$12,815
1F6045TJZ|60ELHPT Command Thrust FourStroke Tiller|$14,990|$13,189
1F754132D|75ELPT FourStroke|$16,125|$14,190
1F904132D|90ELPT FourStroke|$16,830|$14,812
1F904232D|90EXLPT FourStroke|$17,265|$15,191
1F904532D|90ELPT Command Thrust FourStroke|$17,355|$15,274
1F904632D|90EXLPT Command Thrust FourStroke|$17,415|$15,323
1115F132D|115ELPT FourStroke|$19,220|$16,913
1115F232D|115EXLPT FourStroke|$19,625|$17,270
1115F532D|115ELPT Command Thrust FourStroke|$19,730|$17,364
1115F632D|115EXLPT Command Thrust FourStroke|$20,130|$17,716
1115F642D|115ECXLPT Command Thrust FourStroke|$20,130|$17,716
1150F13ED|150L FourStroke|$25,025|$22,022
1150F23ED|150XL FourStroke|$25,165|$22,143
1150F24ED|150CXL FourStroke|$26,045|$22,919
11500101A|150L FourStroke Cold Fusion White|$26,325|$23,166
11500102A|150XL FourStroke Cold Fusion White|$26,325|$23,166
11500103A|150CXL FourStroke Cold Fusion White|$26,455|$23,282
11500104A|150L FourStroke Warm Fusion White|$26,455|$23,282
11500105A|150XL FourStroke Warm Fusion White|$27,340|$24,057
11500106A|150CXL FourStroke Warm Fusion White|$27,340|$24,057
11750005A|175L FourStroke DTS|$30,990|$27,269
11750006A|175XL FourStroke DTS|$31,140|$27,401
11750007A|175CXL FourStroke DTS|$31,945|$28,111
12000001A|200L FourStroke|$30,580|$26,912
12000009A|200XL FourStroke|$30,730|$27,044
12000029A|200CXL FourStroke|$31,515|$27,731
12000002A|200L FourStroke Cold Fusion White|$33,005|$29,046
12000010A|200XL FourStroke Cold Fusion White|$33,155|$29,178
12000030A|200CXL FourStroke Cold Fusion White|$33,940|$29,865
12000003A|200L FourStroke Warm Fusion White|$33,005|$29,046
12000011A|200XL FourStroke Warm Fusion White|$33,155|$29,178
12000031A|200CXL FourStroke Warm Fusion White|$33,940|$29,865
12000004A|200L FourStroke Pearl Fusion White|$33,005|$29,046
12000012A|200XL FourStroke Pearl Fusion White|$33,155|$29,178
12000032A|200CXL FourStroke Pearl Fusion White|$33,940|$29,865
12000005A|200L FourStroke DTS|$32,680|$28,760
12000013A|200XL FourStroke DTS|$32,830|$28,892
12000017A|200CXL FourStroke DTS|$33,640|$29,601
12000006A|200L FourStroke DTS Cold Fusion White|$35,200|$30,976
12000014A|200XL FourStroke DTS Cold Fusion White|$35,330|$31,092
12000018A|200CXL FourStroke DTS Cold Fusion White|$36,150|$31,812
12000007A|200L FourStroke DTS Warm Fusion White|$35,200|$30,976
12000015A|200XL FourStroke DTS Warm Fusion White|$35,330|$31,092
12000019A|200CXL FourStroke DTS Warm Fusion White|$36,150|$31,812
12000008A|200L FourStroke DTS Pearl Fusion White|$35,200|$30,976
12000016A|200XL FourStroke DTS Pearl Fusion White|$35,330|$31,092
12000020A|200CXL FourStroke DTS Pearl Fusion White|$36,150|$31,812
12250001A|225L FourStroke|$36,715|$32,307
12250009A|225XL FourStroke|$36,845|$32,423
12250047A|225CXL FourStroke|$37,645|$33,127
12250021A|225XXL FourStroke|$37,605|$33,094
12250002A|225L FourStroke Cold Fusion White|$39,155|$34,458
12250010A|225XL FourStroke Cold Fusion White|$39,290|$34,573
12250048A|225CXL FourStroke Cold Fusion White|$40,095|$35,283
12250022A|225XXL FourStroke Cold Fusion White|$40,050|$35,244
12250003A|225L FourStroke Warm Fusion White|$39,155|$34,458
12250011A|225XL FourStroke Warm Fusion White|$39,290|$34,573
12250049A|225CXL FourStroke Warm Fusion White|$40,095|$35,283
12250023A|225XXL FourStroke Warm Fusion White|$40,050|$35,244
12250004A|225L FourStroke Pearl Fusion White|$39,155|$34,458
12250012A|225XL FourStroke Pearl Fusion White|$39,290|$34,573
12250050A|225CXL FourStroke Pearl Fusion White|$40,095|$35,283
12250024A|225XXL FourStroke Pearl Fusion White|$40,050|$35,244
12250005A|225L FourStroke DTS|$38,855|$34,194
12250013A|225XL FourStroke DTS|$38,995|$34,315
12250017A|225CXL FourStroke DTS|$39,820|$35,041
12250025A|225XXL FourStroke DTS|$39,775|$35,002
12250029A|225CXXL FourStroke DTS|$40,600|$35,728
12250006A|225L FourStroke DTS Cold Fusion White|$41,380|$36,416
12250014A|225XL FourStroke DTS Cold Fusion White|$41,525|$36,542
12250018A|225CXL FourStroke DTS Cold Fusion White|$42,340|$37,257
12250026A|225XXL FourStroke DTS Cold Fusion White|$42,295|$37,219
12250030A|225CXXL FourStroke DTS Cold Fusion White|$43,120|$37,945
12250007A|225L FourStroke DTS Warm Fusion White|$41,380|$36,416
12250015A|225XL FourStroke DTS Warm Fusion White|$41,525|$36,542
12250019A|225CXL FourStroke DTS Warm Fusion White|$42,340|$37,257
12250027A|225XXL FourStroke DTS Warm Fusion White|$42,295|$37,219
12250031A|225CXXL FourStroke DTS Warm Fusion White|$43,120|$37,945
12250008A|225L FourStroke DTS Pearl Fusion White|$41,380|$36,416
12250016A|225XL FourStroke DTS Pearl Fusion White|$41,525|$36,542
12250020A|225CXL FourStroke DTS Pearl Fusion White|$42,340|$37,257
12250028A|225XXL FourStroke DTS Pearl Fusion White|$42,295|$37,219
12250032A|225CXXL FourStroke DTS Pearl Fusion White|$43,120|$37,945
12500001A|250L FourStroke|$38,765|$34,111
12500009A|250XL FourStroke|$38,895|$34,227
12500083A|250CXL FourStroke|$39,665|$34,903
12500021A|250XXL FourStroke|$39,820|$35,041
12500087A|250CXXL FourStroke|$40,595|$35,723
12500002A|250L FourStroke Cold Fusion White|$41,125|$36,190
12500010A|250XL FourStroke Cold Fusion White|$41,265|$36,311
12500084A|250CXL FourStroke Cold Fusion White|$42,030|$36,988
12500022A|250XXL FourStroke Cold Fusion White|$42,195|$37,131
12500088A|250CXXL FourStroke Cold Fusion White|$42,965|$37,807
12500003A|250L FourStroke Warm Fusion White|$41,125|$36,190
12500011A|250XL FourStroke Warm Fusion White|$41,265|$36,311
12500085A|250CXL FourStroke Warm Fusion White|$42,030|$36,988
12500023A|250XXL FourStroke Warm Fusion White|$42,195|$37,131
12500089A|250CXXL FourStroke Warm Fusion White|$42,965|$37,807
12500004A|250L FourStroke Pearl Fusion White|$41,125|$36,190
12500012A|250XL FourStroke Pearl Fusion White|$41,265|$36,311
12500086A|250CXL FourStroke Pearl Fusion White|$42,030|$36,988
12500024A|250XXL FourStroke Pearl Fusion White|$42,195|$37,131
12500090A|250CXXL FourStroke Pearl Fusion White|$42,965|$37,807
12500005A|250L FourStroke DTS|$41,055|$36,130
12500013A|250XL FourStroke DTS|$41,200|$36,256
12500017A|250CXL FourStroke DTS|$41,995|$36,955
12500025A|250XXL FourStroke DTS|$42,155|$37,098
12500029A|250CXXL FourStroke DTS|$42,955|$37,802
12500006A|250L FourStroke DTS Cold Fusion White|$43,520|$38,297
12500014A|250XL FourStroke DTS Cold Fusion White|$43,645|$38,407
12500018A|250CXL FourStroke DTS Cold Fusion White|$44,445|$39,111
12500026A|250XXL FourStroke DTS Cold Fusion White|$44,600|$39,248
12500030A|250CXXL FourStroke DTS Cold Fusion White|$45,405|$39,958
12500007A|250L FourStroke DTS Warm Fusion White|$43,520|$38,297
12500015A|250XL FourStroke DTS Warm Fusion White|$43,645|$38,407
12500019A|250CXL FourStroke DTS Warm Fusion White|$44,445|$39,111
12500027A|250XXL FourStroke DTS Warm Fusion White|$44,600|$39,248
12500031A|250CXXL FourStroke DTS Warm Fusion White|$45,405|$39,958
12500008A|250L FourStroke DTS Pearl Fusion White|$43,520|$38,297
12500016A|250XL FourStroke DTS Pearl Fusion White|$43,645|$38,407
12500020A|250CXL FourStroke DTS Pearl Fusion White|$44,445|$39,111
12500028A|250XXL FourStroke DTS Pearl Fusion White|$44,600|$39,248
12500032A|250CXXL FourStroke DTS Pearl Fusion White|$45,405|$39,958
13000002A|300L FourStroke|$40,975|$36,058
13000010A|300XL FourStroke|$41,100|$36,168
13000111A|300CXL FourStroke|$41,865|$36,839
13000003A|300L FourStroke Cold Fusion White|$43,315|$38,115
13000011A|300XL FourStroke Cold Fusion White|$43,445|$38,231
13000112A|300CXL FourStroke Cold Fusion White|$44,215|$38,907
13000004A|300L FourStroke Warm Fusion White|$43,315|$38,115
13000012A|300XL FourStroke Warm Fusion White|$43,445|$38,231
13000113A|300CXL FourStroke Warm Fusion White|$44,215|$38,907
13000005A|300L FourStroke Pearl Fusion White|$43,315|$38,115
13000013A|300XL FourStroke Pearl Fusion White|$43,445|$38,231
13000114A|300CXL FourStroke Pearl Fusion White|$44,215|$38,907
13000006A|300L FourStroke DTS|$43,220|$38,033
13000014A|300XL FourStroke DTS|$43,365|$38,159
13000018A|300CXL FourStroke DTS|$44,150|$38,852
13000007A|300L FourStroke DTS Cold Fusion White|$45,650|$40,172
13000015A|300XL FourStroke DTS Cold Fusion White|$45,775|$40,282
13000019A|300CXL FourStroke DTS Cold Fusion White|$46,570|$40,981
13000008A|300L FourStroke DTS Warm Fusion White|$45,650|$40,172
13000016A|300XL FourStroke DTS Warm Fusion White|$45,775|$40,282
13000020A|300CXL FourStroke DTS Warm Fusion White|$46,570|$40,981
13000009A|300L FourStroke DTS Pearl Fusion White|$45,650|$40,172
13000017A|300XL FourStroke DTS Pearl Fusion White|$45,775|$40,282
13000021A|300CXL FourStroke DTS Pearl Fusion White|$46,570|$40,981
1117F131D|115ELPT Pro XS|$19,680|$17,320
1117F231D|115EXLPT Pro XS|$20,075|$17,666
1117F531D|115ELPT Pro XS Command Thrust|$20,190|$17,765
1117F631D|115EXLPT Pro XS Command Thrust|$20,590|$18,117
1152F131D|150L Pro XS|$27,395|$24,107
1152F231D|150XL Pro XS|$27,540|$24,233
11750001A|175L Pro XS|$31,380|$27,616
11750002A|175XL Pro XS|$31,825|$28,006
12000027A|200L Pro XS TorqueMaster|$31,955|$28,122
12000039A|200L Pro XS|$31,955|$28,122
12000041A|200XL Pro XS|$32,365|$28,479
12000035A|200L Pro XS DTS TorqueMaster|$34,080|$29,992
12000040A|200XL Pro XS DTS|$34,545|$30,399
12250033A|225L Pro XS TorqueMaster|$37,545|$33,039
12250034A|225XL Pro XS|$37,990|$33,429
12250053A|225L Pro XS DTS TorqueMaster|$39,330|$34,612
12250055A|225XL Pro XS DTS|$40,050|$35,244
12500033A|250L Pro XS TorqueMaster|$39,205|$34,502
12500034A|250XL Pro XS|$40,105|$35,294
12500094A|250L Pro XS DTS TorqueMaster|$41,525|$36,542
12500096A|250XL Pro XS DTS|$42,465|$37,367
13000022A|300L Pro XS TorqueMaster|$41,115|$36,179
13000023A|300XL Pro XS|$42,030|$36,988
13000177A|300L Pro XS DTS TorqueMaster|$43,375|$38,170
13000179A|300XL Pro XS DTS|$44,330|$39,012
13000181A|300CXL Pro XS DTS|$45,130|$39,716
`.trim()

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
    console.log('🚀 Starting 2026 Mercury pricing import...')

    // Parse the pricing data
    const pricingRecords: PricingRecord[] = []
    const lines = PRICING_DATA_2026.split('\n').filter(line => line.trim())

    for (const line of lines) {
      const parts = line.split('|')
      if (parts.length !== 4) continue

      const [modelNumber, description, msrpStr, dealerPriceStr] = parts.map(p => p.trim())
      
      const record: PricingRecord = {
        model_number: modelNumber,
        description: description,
        msrp: parsePricing(msrpStr),
        dealer_price: parsePricing(dealerPriceStr),
        ...parseModelNumber(modelNumber, description)
      }

      pricingRecords.push(record)
    }

    console.log(`📊 Parsed ${pricingRecords.length} pricing records`)

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
          msrp: record.msrp,
          dealer_price: record.dealer_price,
          horsepower: record.horsepower,
          family: record.family,
          rigging_code: record.rigging_code,
          model: 'Outboard',
          motor_type: 'Outboard',
          year: 2026,
          is_brochure: true,
          make: 'Mercury',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        newModels++
      }
    }

    console.log(`🔄 Processing ${updatesNeeded.length} price updates and ${insertsNeeded.length} new models`)

    // Perform batch updates
    let updatedCount = 0
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
            console.error(`Failed to update model ${update.id}:`, updateError.message)
          } else {
            updatedCount++
          }
        }
      }
    }

    // Perform batch inserts
    let insertedCount = 0
    if (insertsNeeded.length > 0) {
      const batchSize = 100
      for (let i = 0; i < insertsNeeded.length; i += batchSize) {
        const batch = insertsNeeded.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from('motor_models')
          .insert(batch)

        if (insertError) {
          console.error(`Failed to insert batch starting at ${i}:`, insertError.message)
        } else {
          insertedCount += batch.length
        }
      }
    }

    const summary = {
      success: true,
      totalRecordsProcessed: pricingRecords.length,
      priceUpdatesApplied: updatedCount,
      newModelsAdded: insertedCount,
      skippedRecords: pricingRecords.length - updatedCount - insertedCount,
      message: `✅ 2026 Mercury pricing import completed successfully!`
    }

    console.log('🎉 Import Summary:', summary)

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Import failed:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to import 2026 Mercury pricing data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})