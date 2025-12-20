import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DropboxEntry {
  '.tag': 'file' | 'folder'
  name: string
  path_lower: string
  path_display?: string
  size?: number
  content_hash?: string
  id?: string
}

interface MotorMatch {
  id: string
  model_display: string
  horsepower: number
  family: string
  shaft: string
  score: number
}

interface FolderResult {
  folderName: string
  motorId: string | null
  motorDisplay: string | null
  matchScore: number
  imagesFound: number
  imagesSynced: number
  pdfsFound: number
  pdfsSynced: number
  errors: string[]
}

// Parsed folder info with feature flags
interface ParsedFolderInfo {
  hp: number | null
  family: string | null
  shaft: string | null
  hasCommandThrust: boolean
  hasProKicker: boolean
  hasTiller: boolean
  hasProXS: boolean
  hasSeaPro: boolean
  hasVerado: boolean
  folderName: string
}

// Parse folder name to extract HP, family, shaft, and special features
function parseFolderName(folderName: string): ParsedFolderInfo {
  const name = folderName.trim()
  const nameLower = name.toLowerCase()
  
  // Extract HP - look for patterns like "150HP", "150 HP", "9.9hp", "200"
  // Updated regex to handle decimal HP values like 9.9, 4.5, etc.
  const hpMatch = name.match(/(\d+(?:\.\d+)?)\s*(?:hp|HP)?/i)
  const hp = hpMatch ? parseFloat(hpMatch[1]) : null
  
  // Extract shaft - L, XL, XXL, CXL at the end or standalone
  const shaftMatch = name.match(/\b(XXL|CXL|XL|L)\b/i)
  const shaft = shaftMatch ? shaftMatch[1].toUpperCase() : null
  
  // Detect special features/variants from folder name
  const hasCommandThrust = nameLower.includes('ct') || 
    nameLower.includes('command thrust') || 
    nameLower.includes('commandthrust')
  
  const hasProKicker = nameLower.includes('prokicker') || 
    nameLower.includes('pro kicker') || 
    nameLower.includes('pro-kicker') ||
    nameLower.includes('kicker')
  
  // Detect tiller - either explicit "tiller" or "H" in rigging codes like ELHPT, ELH, MH, MLH
  // The H before PT or at the end of codes like MH, ELH indicates tiller (handle) control
  const tillerRiggingPattern = /\b(?:E?L?H(?:PT)?|M(?:L|XL)?H)\b/i
  const hasTiller = nameLower.includes('tiller') || tillerRiggingPattern.test(name)
  
  // Motor line/variant flags - these are mutually exclusive product lines
  const hasProXS = nameLower.includes('pro xs') || 
    nameLower.includes('proxs') || 
    nameLower.includes('pro-xs')
  
  const hasSeaPro = nameLower.includes('sea pro') || 
    nameLower.includes('seapro')
  
  const hasVerado = nameLower.includes('verado')
  
  // Extract family for database column matching
  let family: string | null = null
  
  if (hasProXS) {
    family = 'Pro XS'
  } else if (hasSeaPro) {
    family = 'SeaPro'
  } else if (hasVerado) {
    family = 'Verado'
  } else if (nameLower.includes('fourstroke') || nameLower.includes('four stroke') || nameLower.includes('4-stroke')) {
    family = 'FourStroke'
  } else if (nameLower.includes('jet')) {
    family = 'Jet'
  } else if (nameLower.includes('racing')) {
    family = 'Racing'
  } else if (nameLower.includes('avator') || nameLower.includes('electric')) {
    family = 'Avator'
  }
  // If folder has ProKicker but no family, it's likely a FourStroke
  else if (hasProKicker) {
    family = 'FourStroke'
  }
  
  return { 
    hp, family, shaft, 
    hasCommandThrust, hasProKicker, hasTiller, 
    hasProXS, hasSeaPro, hasVerado,
    folderName: name 
  }
}

// Score how well a motor matches the parsed folder info
function scoreMotorMatch(motor: any, parsed: ParsedFolderInfo): number {
  let score = 0
  const modelLower = (motor.model_display || '').toLowerCase()
  const motorFamily = (motor.family || '').toLowerCase()
  
  // HP match (most important) - must be exact or very close for decimals
  if (parsed.hp !== null && motor.horsepower !== null) {
    const hpDiff = Math.abs(motor.horsepower - parsed.hp)
    
    if (hpDiff === 0) {
      score += 50 // Exact HP match
    } else if (hpDiff <= 0.5) {
      score += 45 // Very close (handles 9.9 vs 10 edge cases)
    } else if (hpDiff <= 2) {
      score += 30 // Close HP (e.g., 114 vs 115)
    }
    // No loose matching - it caused bad matches
  }
  
  // Shaft match
  if (parsed.shaft && motor.shaft) {
    const motorShaft = motor.shaft.toUpperCase()
    if (motorShaft === parsed.shaft) {
      score += 20
    }
  }
  
  // === MOTOR LINE/VARIANT MATCHING ===
  // These are mutually exclusive - a motor is either Pro XS, SeaPro, Verado, or base FourStroke
  
  const isMotorProXS = motorFamily.includes('pro xs') || modelLower.includes('proxs')
  const isMotorSeaPro = motorFamily.includes('seapro') || motorFamily.includes('sea pro')
  const isMotorVerado = motorFamily.includes('verado')
  
  // Pro XS matching
  if (parsed.hasProXS) {
    if (isMotorProXS) {
      score += 35 // Strong bonus for Pro XS match
    } else {
      score -= 30 // Strong penalty - folder says ProXS but motor isn't
    }
  } else {
    // Folder doesn't say ProXS - penalize Pro XS motors
    if (isMotorProXS) {
      score -= 25 // Plain "115" folder should NOT match Pro XS motors
    }
  }
  
  // SeaPro matching
  if (parsed.hasSeaPro) {
    if (isMotorSeaPro) {
      score += 35
    } else {
      score -= 30
    }
  } else {
    if (isMotorSeaPro) {
      score -= 25
    }
  }
  
  // Verado matching
  if (parsed.hasVerado) {
    if (isMotorVerado) {
      score += 35
    } else {
      score -= 30
    }
  } else {
    if (isMotorVerado) {
      score -= 25
    }
  }
  
  // === SPECIAL FEATURE MATCHING via model_display ===
  
  // Command Thrust (CT) matching
  const isMotorCT = modelLower.includes('command thrust')
  if (parsed.hasCommandThrust) {
    if (isMotorCT) {
      score += 35 // Strong bonus for CT match
    } else {
      score -= 25 // Penalty if folder says CT but motor isn't CT
    }
  } else {
    // Folder doesn't mention CT - penalize CT motors
    if (isMotorCT) {
      score -= 20 // Plain "115" should NOT match CT models
    }
  }
  
  // ProKicker matching
  const isMotorProKicker = modelLower.includes('prokicker')
  if (parsed.hasProKicker) {
    if (isMotorProKicker) {
      score += 40 // Very strong bonus - ProKicker is specific
    } else {
      score -= 30 // Penalty if folder says ProKicker but motor isn't
    }
  } else {
    if (isMotorProKicker) {
      score -= 25 // Plain folder should NOT match ProKicker models
    }
  }
  
  // Tiller matching - check for "tiller" text OR "H" in rigging codes (ELHPT, ELH, MH, etc.)
  // The H before PT or at end of codes indicates tiller/handle control
  const tillerRiggingPattern = /\b(?:E?L?H(?:PT)?|M(?:L|XL)?H)\b/i
  const isMotorTiller = modelLower.includes('tiller') || tillerRiggingPattern.test(motor.model_display || '')
  if (parsed.hasTiller) {
    if (isMotorTiller) {
      score += 30 // Bonus for matching tiller
    } else {
      score -= 25 // Strong penalty - folder has H/tiller but motor doesn't
    }
  } else {
    if (isMotorTiller) {
      score -= 20 // Folder doesn't have tiller indicator, penalize tiller motors
    }
  }
  
  return score
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}

// Auto-detect PDF category from filename
function getPdfCategory(filename: string): string {
  const lower = filename.toLowerCase()
  
  if (lower.includes('manual') || lower.includes('owner') || lower.includes('operator')) {
    return 'manual'
  }
  if (lower.includes('brochure') || lower.includes('catalog') || lower.includes('catalogue')) {
    return 'brochure'
  }
  if (lower.includes('spec') || lower.includes('specification') || lower.includes('data sheet') || lower.includes('datasheet')) {
    return 'specifications'
  }
  if (lower.includes('warranty')) {
    return 'warranty'
  }
  if (lower.includes('install') || lower.includes('rigging') || lower.includes('setup')) {
    return 'installation'
  }
  if (lower.includes('parts') || lower.includes('diagram')) {
    return 'parts'
  }
  if (lower.includes('service') || lower.includes('maintenance')) {
    return 'service'
  }
  if (lower.includes('sell') || lower.includes('sellsheet') || lower.includes('sell-sheet') || lower.includes('sales')) {
    return 'sell-sheet'
  }
  
  return 'general'
}

// List folder contents using direct folder access (files/list_folder)
async function listFolderContents(
  dropboxToken: string,
  folderPath: string
): Promise<{ entries: DropboxEntry[]; error?: string }> {
  console.log(`Listing folder contents: path="${folderPath}"`)
  
  try {
    // Ensure path starts with / for non-root folders
    const normalizedPath = folderPath === '' || folderPath === '/' ? '' : 
      (folderPath.startsWith('/') ? folderPath : `/${folderPath}`)
    
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: normalizedPath,
        recursive: false,
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('List folder error:', errorText)
      
      // Check for specific scope errors
      if (errorText.includes('files.metadata.read')) {
        return { 
          entries: [], 
          error: 'Missing files.metadata.read scope. Please enable this in Dropbox App Console > Permissions tab, then generate a new access token.' 
        }
      }
      
      // Parse error for more helpful message
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error_summary?.includes('path/not_found')) {
          return { entries: [], error: `Folder not found: ${folderPath}. Make sure the path exists in your Dropbox.` }
        }
      } catch {}
      
      return { entries: [], error: `Failed to list folder: ${errorText}` }
    }

    const data = await response.json()
    let allEntries: DropboxEntry[] = data.entries || []
    
    // Handle pagination if there are more results
    let hasMore = data.has_more
    let cursor = data.cursor
    
    while (hasMore) {
      console.log('Fetching more entries with cursor...')
      const continueResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dropboxToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cursor }),
      })
      
      if (!continueResponse.ok) {
        console.error('Continue pagination error:', await continueResponse.text())
        break
      }
      
      const continueData = await continueResponse.json()
      allEntries = allEntries.concat(continueData.entries || [])
      hasMore = continueData.has_more
      cursor = continueData.cursor
    }
    
    console.log(`Found ${allEntries.length} entries in folder`)
    return { entries: allEntries }
    
  } catch (error) {
    console.error('Error listing folder:', error)
    return { entries: [], error: error.message }
  }
}

// Download file using direct file access (files/download)
async function downloadFile(
  dropboxToken: string,
  filePath: string
): Promise<{ data: ArrayBuffer | null; error?: string }> {
  try {
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Dropbox-API-Arg': JSON.stringify({ path: filePath }),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Download failed for ${filePath}:`, errorText)
      
      if (errorText.includes('files.content.read')) {
        return { 
          data: null, 
          error: 'Missing files.content.read scope. Please enable this in Dropbox App Console > Permissions tab.' 
        }
      }
      
      return { data: null, error: `Download failed: ${errorText.substring(0, 100)}` }
    }

    const data = await response.arrayBuffer()
    return { data }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

// Resolve a Dropbox shared link URL to a direct path (so we can use files/list_folder)
async function resolveSharedLinkToPath(
  dropboxToken: string,
  sharedUrl: string
): Promise<{ path: string | null; error?: string }> {
  try {
    const response = await fetch('https://api.dropboxapi.com/2/sharing/get_shared_link_metadata', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: sharedUrl }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Shared link metadata error:', errorText)
      return { path: null, error: `Could not read shared link metadata: ${errorText}` }
    }

    const data = await response.json()
    const path = data.path_lower || null

    if (!path) {
      return {
        path: null,
        error: 'Shared link did not include a Dropbox path. Try using a folder path like "/Motor Images".',
      }
    }

    return { path }
  } catch (error) {
    console.error('resolveSharedLinkToPath error:', error)
    return { path: null, error: error.message }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      parentFolderUrl,
      dryRun = true,
      replaceExisting = false,
      startAfter = null,
      maxFolders = 2,
    } = await req.json()

    if (!parentFolderUrl) {
      throw new Error('parentFolderUrl is required (folder path like "/Motor Images" or "/Mercury Photos")')
    }

    console.log('=== Smart Dropbox Motor Folder Sync ===')
    console.log('Input:', parentFolderUrl)
    console.log('Dry run:', dryRun)
    console.log('Replace existing:', replaceExisting)

    const dropboxToken = Deno.env.get('DROPBOX_ACCESS_TOKEN')
    if (!dropboxToken) {
      throw new Error('DROPBOX_ACCESS_TOKEN not configured')
    }

    // Normalize input - accept either a folder path or a shared link URL
    let folderPath: string

    if (parentFolderUrl.includes('dropbox.com')) {
      const { path, error: sharedError } = await resolveSharedLinkToPath(dropboxToken, parentFolderUrl.trim())
      if (sharedError) throw new Error(sharedError)
      if (!path) throw new Error('Could not resolve shared link to a folder path')
      folderPath = path
    } else {
      // Direct folder path
      folderPath = parentFolderUrl.trim()
    }

    // Decode any url-encoded characters users might paste (e.g., %20)
    try {
      folderPath = decodeURIComponent(folderPath)
    } catch {
      // ignore
    }

    // Ensure it starts with / for non-root paths
    if (folderPath && folderPath !== '/' && !folderPath.startsWith('/')) {
      folderPath = '/' + folderPath
    }

    // Normalize root
    if (folderPath === '/') folderPath = ''

    console.log('Folder path:', folderPath)

    // List contents of parent folder using direct access
    const { entries, error: listError } = await listFolderContents(dropboxToken, folderPath)
    
    if (listError) {
      throw new Error(listError)
    }
    
    // Find all subfolders (these represent motors)
    const subfolders = entries.filter(e => e['.tag'] === 'folder')
    const sortedSubfolders = subfolders.sort((a, b) => a.name.localeCompare(b.name))

    console.log(`Found ${sortedSubfolders.length} subfolders in parent folder`)

    if (sortedSubfolders.length === 0) {
      // Check if there are files directly in this folder
      const files = entries.filter(e => e['.tag'] === 'file')
      if (files.length > 0) {
        throw new Error(
          `Found ${files.length} files but no subfolders in "${folderPath}". ` +
          'This sync expects the parent folder to contain subfolders named after motors (e.g., "150HP FourStroke"), ' +
          'with images inside each subfolder.'
        )
      }
      throw new Error(`No subfolders found in "${folderPath}". Please check the folder path.`)
    }

    // Batch controls (to avoid Edge Function timeouts)
    const startIndex = startAfter
      ? Math.max(0, sortedSubfolders.findIndex((f) => f.name === startAfter) + 1)
      : 0

    const foldersToProcess = sortedSubfolders.slice(
      startIndex,
      Math.max(startIndex, startIndex + Math.max(1, Number(maxFolders) || 1))
    )

    const hasMore = startIndex + foldersToProcess.length < sortedSubfolders.length
    const nextStartAfter = hasMore && foldersToProcess.length > 0 ? foldersToProcess[foldersToProcess.length - 1].name : null

    console.log(
      `Processing folders ${startIndex + 1}-${startIndex + foldersToProcess.length} of ${sortedSubfolders.length} (maxFolders=${maxFolders})`
    )

    // Fetch all motors for matching
    const { data: allMotors, error: motorsError } = await supabaseClient
      .from('motor_models')
      .select('id, model_display, horsepower, family, shaft, model_key')
      .order('horsepower')

    if (motorsError) {
      throw new Error(`Failed to fetch motors: ${motorsError.message}`)
    }

    console.log(`Loaded ${allMotors?.length || 0} motors for matching`)

    const results: FolderResult[] = []
    let totalImagesSynced = 0
    let totalPdfsSynced = 0
    let totalFoldersProcessed = 0

    // Process each subfolder (batched)
    for (const folder of foldersToProcess) {
      const folderResult: FolderResult = {
        folderName: folder.name,
        motorId: null,
        motorDisplay: null,
        matchScore: 0,
        imagesFound: 0,
        imagesSynced: 0,
        pdfsFound: 0,
        pdfsSynced: 0,
        errors: []
      }

      try {
        console.log(`\n--- Processing folder: ${folder.name} ---`)
        
        // Parse folder name
        const parsed = parseFolderName(folder.name)
        console.log('Parsed folder name:', parsed)

        if (!parsed.hp) {
          console.log('No HP found in folder name, skipping')
          folderResult.errors.push('Could not parse HP from folder name')
          results.push(folderResult)
          continue
        }

        // Score all motors and find best match
        // Minimum score threshold of 40 to avoid weak matches
        const MIN_MATCH_SCORE = 40
        
        const scoredMotors = allMotors
          ?.map(motor => ({
            ...motor,
            score: scoreMotorMatch(motor, parsed)
          }))
          .filter(m => m.score >= MIN_MATCH_SCORE)
          .sort((a, b) => b.score - a.score) || []
        
        // Log rejected weak matches for debugging
        const weakMatches = allMotors
          ?.map(motor => ({ model_display: motor.model_display, score: scoreMotorMatch(motor, parsed) }))
          .filter(m => m.score > 0 && m.score < MIN_MATCH_SCORE)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3) || []
        
        if (weakMatches.length > 0) {
          console.log(`Rejected ${weakMatches.length} weak matches (score < ${MIN_MATCH_SCORE}):`, 
            weakMatches.map(m => `${m.model_display}(${m.score})`).join(', '))
        }

        if (scoredMotors.length === 0) {
          console.log('No matching motors found with sufficient score')
          folderResult.errors.push(`No motor matched with score >= ${MIN_MATCH_SCORE}. Check folder name format.`)
          results.push(folderResult)
          continue
        }

        const bestMatch = scoredMotors[0]
        folderResult.motorId = bestMatch.id
        folderResult.motorDisplay = bestMatch.model_display
        folderResult.matchScore = bestMatch.score

        console.log(`Best match: ${bestMatch.model_display} (score: ${bestMatch.score})`)
        if (scoredMotors.length > 1) {
          console.log(`Runner up: ${scoredMotors[1].model_display} (score: ${scoredMotors[1].score})`)
        }

        // List files in this subfolder using direct folder access
        const { entries: subfolderEntries, error: subfolderError } = await listFolderContents(
          dropboxToken, 
          folder.path_lower
        )

        if (subfolderError) {
          console.error('Error listing subfolder:', subfolderError)
          folderResult.errors.push(`Failed to list folder: ${subfolderError}`)
          results.push(folderResult)
          continue
        }

        // Separate images and PDFs
        const imageFiles: DropboxEntry[] = subfolderEntries.filter(
          (e: DropboxEntry) => e['.tag'] === 'file' && /\.(jpg|jpeg|png|gif|webp)$/i.test(e.name)
        )
        const pdfFiles: DropboxEntry[] = subfolderEntries.filter(
          (e: DropboxEntry) => e['.tag'] === 'file' && /\.pdf$/i.test(e.name)
        )

        folderResult.imagesFound = imageFiles.length
        folderResult.pdfsFound = pdfFiles.length
        console.log(`Found ${imageFiles.length} images and ${pdfFiles.length} PDFs in folder`)

        if (dryRun) {
          // In dry run mode, just report what would happen
          folderResult.imagesSynced = imageFiles.length
          folderResult.pdfsSynced = pdfFiles.length
          results.push(folderResult)
          totalFoldersProcessed++
          continue
        }

        // If replacing existing, delete old dropbox-curated media for this motor (both images and PDFs)
        if (replaceExisting) {
          const { error: deleteError } = await supabaseClient
            .from('motor_media')
            .delete()
            .eq('motor_id', bestMatch.id)
            .eq('assignment_type', 'dropbox-curated')

          if (deleteError) {
            console.error('Error deleting existing media:', deleteError)
          } else {
            console.log('Deleted existing dropbox-curated media for this motor')
          }
        }

        const sanitizedFolderName = folder.name.replace(/[^a-zA-Z0-9-_]/g, '_')

        // Download and sync each image
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i]
          
          try {
            // Check if already synced (by dropbox_path)
            const { data: existing } = await supabaseClient
              .from('motor_media')
              .select('id')
              .eq('dropbox_path', file.path_lower)
              .single()

            if (existing && !replaceExisting) {
              console.log(`Already synced: ${file.name}`)
              continue
            }

            // Download from Dropbox using direct file access
            const { data: fileBuffer, error: downloadError } = await downloadFile(
              dropboxToken,
              file.path_lower
            )

            if (downloadError || !fileBuffer) {
              throw new Error(downloadError || 'Download returned no data')
            }

            const fileName = `dropbox-curated/${bestMatch.id}/${sanitizedFolderName}/${Date.now()}-${file.name}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabaseClient.storage
              .from('motor-images')
              .upload(fileName, fileBuffer, {
                contentType: getContentType(file.name),
                upsert: true
              })

            if (uploadError) {
              throw new Error(`Upload failed: ${uploadError.message}`)
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseClient.storage
              .from('motor-images')
              .getPublicUrl(fileName)

            // Create motor_media record
            const { error: mediaError } = await supabaseClient
              .from('motor_media')
              .insert({
                motor_id: bestMatch.id,
                media_type: 'image',
                media_category: i === 0 ? 'hero' : 'gallery',
                media_url: publicUrl,
                original_filename: file.name,
                dropbox_path: file.path_lower,
                dropbox_sync_status: 'synced',
                assignment_type: 'dropbox-curated',
                assignment_rules: {
                  source_folder: folder.name,
                  parsed_hp: parsed.hp,
                  parsed_family: parsed.family,
                  parsed_shaft: parsed.shaft,
                  match_score: bestMatch.score
                },
                title: file.name.replace(/\.[^/.]+$/, ''),
                file_size: file.size || 0,
                mime_type: getContentType(file.name),
                display_order: i
              })

            if (mediaError) {
              throw new Error(`Media record failed: ${mediaError.message}`)
            }

            folderResult.imagesSynced++
            totalImagesSynced++
            console.log(`Synced image: ${file.name}`)

          } catch (fileError) {
            console.error(`Error syncing ${file.name}:`, fileError)
            folderResult.errors.push(`${file.name}: ${fileError.message}`)
          }
        }

        // Download and sync each PDF
        for (let i = 0; i < pdfFiles.length; i++) {
          const file = pdfFiles[i]
          
          try {
            // Check if already synced (by dropbox_path)
            const { data: existing } = await supabaseClient
              .from('motor_media')
              .select('id')
              .eq('dropbox_path', file.path_lower)
              .single()

            if (existing && !replaceExisting) {
              console.log(`Already synced PDF: ${file.name}`)
              continue
            }

            // Download from Dropbox
            const { data: fileBuffer, error: downloadError } = await downloadFile(
              dropboxToken,
              file.path_lower
            )

            if (downloadError || !fileBuffer) {
              throw new Error(downloadError || 'Download returned no data')
            }

            const fileName = `dropbox-curated/${bestMatch.id}/${sanitizedFolderName}/pdfs/${Date.now()}-${file.name}`

            // Upload to Supabase Storage (using motor-images bucket with pdfs subfolder)
            const { error: uploadError } = await supabaseClient.storage
              .from('motor-images')
              .upload(fileName, fileBuffer, {
                contentType: 'application/pdf',
                upsert: true
              })

            if (uploadError) {
              throw new Error(`PDF upload failed: ${uploadError.message}`)
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseClient.storage
              .from('motor-images')
              .getPublicUrl(fileName)

            // Auto-detect PDF category from filename
            const pdfCategory = getPdfCategory(file.name)

            // Create motor_media record for PDF
            const { error: mediaError } = await supabaseClient
              .from('motor_media')
              .insert({
                motor_id: bestMatch.id,
                media_type: 'pdf',
                media_category: pdfCategory,
                media_url: publicUrl,
                original_filename: file.name,
                dropbox_path: file.path_lower,
                dropbox_sync_status: 'synced',
                assignment_type: 'dropbox-curated',
                assignment_rules: {
                  source_folder: folder.name,
                  parsed_hp: parsed.hp,
                  parsed_family: parsed.family,
                  parsed_shaft: parsed.shaft,
                  match_score: bestMatch.score,
                  auto_category: pdfCategory
                },
                title: file.name.replace(/\.[^/.]+$/, ''),
                file_size: file.size || 0,
                mime_type: 'application/pdf',
                display_order: imageFiles.length + i // After images
              })

            if (mediaError) {
              throw new Error(`PDF media record failed: ${mediaError.message}`)
            }

            folderResult.pdfsSynced++
            totalPdfsSynced++
            console.log(`Synced PDF: ${file.name} (category: ${pdfCategory})`)

          } catch (fileError) {
            console.error(`Error syncing PDF ${file.name}:`, fileError)
            folderResult.errors.push(`${file.name}: ${fileError.message}`)
          }
        }

        // If first image was synced as hero, update motor's hero_image_url
        if (folderResult.imagesSynced > 0) {
          const { data: heroMedia } = await supabaseClient
            .from('motor_media')
            .select('id, media_url')
            .eq('motor_id', bestMatch.id)
            .eq('assignment_type', 'dropbox-curated')
            .eq('display_order', 0)
            .single()

          if (heroMedia) {
            await supabaseClient
              .from('motor_models')
              .update({ 
                hero_image_url: heroMedia.media_url,
                hero_media_id: heroMedia.id,
                media_last_updated: new Date().toISOString()
              })
              .eq('id', bestMatch.id)
            
            console.log('Updated motor hero image')
          }
        }

        totalFoldersProcessed++

      } catch (folderError) {
        console.error(`Error processing folder ${folder.name}:`, folderError)
        folderResult.errors.push(folderError.message)
      }

      results.push(folderResult)
    }

    // Summary
    const summary = {
      success: true,
      dryRun,
      folderPath,
      totalFolders: sortedSubfolders.length,
      foldersProcessed: totalFoldersProcessed,
      foldersMatched: results.filter(r => r.motorId).length,
      foldersUnmatched: results.filter(r => !r.motorId).length,
      totalImagesFound: results.reduce((sum, r) => sum + r.imagesFound, 0),
      totalImagesSynced: dryRun ? results.reduce((sum, r) => sum + r.imagesFound, 0) : totalImagesSynced,
      totalPdfsFound: results.reduce((sum, r) => sum + r.pdfsFound, 0),
      totalPdfsSynced: dryRun ? results.reduce((sum, r) => sum + r.pdfsFound, 0) : totalPdfsSynced,
      hasMore,
      nextStartAfter,
      results,
    }

    console.log('\n=== Sync Summary ===')
    console.log(`Folder path: ${folderPath}`)
    console.log(`Folders: ${summary.foldersMatched} matched, ${summary.foldersUnmatched} unmatched`)
    console.log(`Images: ${summary.totalImagesSynced} synced`)
    console.log(`PDFs: ${summary.totalPdfsSynced} synced`)

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Smart folder sync error:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
