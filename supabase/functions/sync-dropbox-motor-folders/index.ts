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
  errors: string[]
}

// Parse folder name to extract HP, family, and shaft
function parseFolderName(folderName: string): { hp: number | null; family: string | null; shaft: string | null } {
  const name = folderName.trim()
  
  // Extract HP - look for patterns like "150HP", "150 HP", "150hp", "200"
  const hpMatch = name.match(/(\d+)\s*(?:hp|HP)?/i)
  const hp = hpMatch ? parseInt(hpMatch[1], 10) : null
  
  // Extract shaft - L, XL, XXL, CXL at the end or standalone
  const shaftMatch = name.match(/\b(XXL|CXL|XL|L)\b/i)
  const shaft = shaftMatch ? shaftMatch[1].toUpperCase() : null
  
  // Extract family - common Mercury families
  let family: string | null = null
  const nameLower = name.toLowerCase()
  
  if (nameLower.includes('pro xs') || nameLower.includes('proxs')) {
    family = 'Pro XS'
  } else if (nameLower.includes('sea pro') || nameLower.includes('seapro')) {
    family = 'SeaPro'
  } else if (nameLower.includes('verado')) {
    family = 'Verado'
  } else if (nameLower.includes('fourstroke') || nameLower.includes('four stroke') || nameLower.includes('4-stroke')) {
    family = 'FourStroke'
  } else if (nameLower.includes('pro kicker') || nameLower.includes('prokicker')) {
    family = 'Pro Kicker'
  } else if (nameLower.includes('jet')) {
    family = 'Jet'
  } else if (nameLower.includes('racing')) {
    family = 'Racing'
  } else if (nameLower.includes('avator') || nameLower.includes('electric')) {
    family = 'Avator'
  }
  
  return { hp, family, shaft }
}

// Score how well a motor matches the parsed folder info
function scoreMotorMatch(motor: any, parsed: { hp: number | null; family: string | null; shaft: string | null }): number {
  let score = 0
  
  // HP match (most important)
  if (parsed.hp && motor.horsepower) {
    if (motor.horsepower === parsed.hp) {
      score += 50
    } else if (Math.abs(motor.horsepower - parsed.hp) <= 5) {
      score += 20 // Close HP
    }
  }
  
  // Family match
  if (parsed.family && motor.family) {
    const motorFamily = motor.family.toLowerCase().replace(/[\s-]/g, '')
    const parsedFamily = parsed.family.toLowerCase().replace(/[\s-]/g, '')
    
    if (motorFamily === parsedFamily) {
      score += 30
    } else if (motorFamily.includes(parsedFamily) || parsedFamily.includes(motorFamily)) {
      score += 15
    }
  }
  
  // Shaft match
  if (parsed.shaft && motor.shaft) {
    const motorShaft = motor.shaft.toUpperCase()
    if (motorShaft === parsed.shaft) {
      score += 20
    }
  }
  
  // Bonus for model_display containing the HP
  if (parsed.hp && motor.model_display) {
    if (motor.model_display.includes(`${parsed.hp}HP`) || motor.model_display.includes(`${parsed.hp} HP`)) {
      score += 10
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
    default:
      return 'image/jpeg'
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

    const { parentFolderUrl, dryRun = true, replaceExisting = false } = await req.json()
    
    if (!parentFolderUrl) {
      throw new Error('parentFolderUrl is required')
    }

    console.log('=== Smart Dropbox Motor Folder Sync ===')
    console.log('Parent folder URL:', parentFolderUrl)
    console.log('Dry run:', dryRun)
    console.log('Replace existing:', replaceExisting)

    const dropboxToken = Deno.env.get('DROPBOX_ACCESS_TOKEN')
    if (!dropboxToken) {
      throw new Error('DROPBOX_ACCESS_TOKEN not configured')
    }

    // Normalize the Dropbox URL
    let sharedLinkUrl = parentFolderUrl.trim()
    if (sharedLinkUrl.startsWith('scl/fo/') || sharedLinkUrl.startsWith('/scl/fo/')) {
      sharedLinkUrl = `https://www.dropbox.com/${sharedLinkUrl.replace(/^\//, '')}`
    } else if (sharedLinkUrl.startsWith('s/') || sharedLinkUrl.startsWith('/s/')) {
      sharedLinkUrl = `https://www.dropbox.com/${sharedLinkUrl.replace(/^\//, '')}`
    } else if (!sharedLinkUrl.startsWith('https://')) {
      throw new Error('Invalid Dropbox URL format')
    }

    console.log('Normalized URL:', sharedLinkUrl)

    // List contents of parent folder to find subfolders
    // NOTE: shared-link folders must be listed via files/list_folder with shared_link (not a sharing/* endpoint).
    const listResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '',
        recursive: false,
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false,
        shared_link: { url: sharedLinkUrl },
      }),
    })

    if (!listResponse.ok) {
      const error = await listResponse.text()
      console.error('Dropbox API error:', error)
      throw new Error(`Dropbox API error: ${error}`)
    }

    const listData = await listResponse.json()
    const entries: DropboxEntry[] = listData.entries || []
    
    // Find all subfolders (these represent motors)
    const subfolders = entries.filter(e => e['.tag'] === 'folder')
    console.log(`Found ${subfolders.length} subfolders in parent folder`)

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
    let totalFoldersProcessed = 0

    // Process each subfolder
    for (const folder of subfolders) {
      const folderResult: FolderResult = {
        folderName: folder.name,
        motorId: null,
        motorDisplay: null,
        matchScore: 0,
        imagesFound: 0,
        imagesSynced: 0,
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
        const scoredMotors = allMotors
          ?.map(motor => ({
            ...motor,
            score: scoreMotorMatch(motor, parsed)
          }))
          .filter(m => m.score > 0)
          .sort((a, b) => b.score - a.score) || []

        if (scoredMotors.length === 0) {
          console.log('No matching motors found')
          folderResult.errors.push('No matching motor found in database')
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

        // List images in this subfolder
        const subfolderResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${dropboxToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: folder.path_lower,
            recursive: false,
            include_media_info: false,
            include_deleted: false,
            include_has_explicit_shared_members: false,
            shared_link: { url: sharedLinkUrl },
          }),
        })

        if (!subfolderResponse.ok) {
          const error = await subfolderResponse.text()
          console.error('Error listing subfolder:', error)
          folderResult.errors.push('Failed to list folder contents')
          results.push(folderResult)
          continue
        }

        const subfolderData = await subfolderResponse.json()
        const imageFiles: DropboxEntry[] = (subfolderData.entries || []).filter(
          (e: DropboxEntry) => e['.tag'] === 'file' && /\.(jpg|jpeg|png|gif|webp)$/i.test(e.name)
        )

        folderResult.imagesFound = imageFiles.length
        console.log(`Found ${imageFiles.length} images in folder`)

        if (dryRun) {
          // In dry run mode, just report what would happen
          folderResult.imagesSynced = imageFiles.length
          results.push(folderResult)
          totalFoldersProcessed++
          continue
        }

        // If replacing existing, delete old dropbox-curated images for this motor
        if (replaceExisting) {
          const { error: deleteError } = await supabaseClient
            .from('motor_media')
            .delete()
            .eq('motor_id', bestMatch.id)
            .eq('assignment_type', 'dropbox-curated')

          if (deleteError) {
            console.error('Error deleting existing media:', deleteError)
          } else {
            console.log('Deleted existing dropbox-curated images for this motor')
          }
        }

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

            // Download from Dropbox shared link (files/download does NOT accept shared_link)
            const downloadResponse = await fetch('https://content.dropboxapi.com/2/sharing/get_shared_link_file', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${dropboxToken}`,
                'Dropbox-API-Arg': JSON.stringify({
                  url: sharedLinkUrl,
                  path: file.path_lower,
                }),
              },
            })

            if (!downloadResponse.ok) {
              throw new Error(`Download failed for ${file.name}`)
            }

            const fileBuffer = await downloadResponse.arrayBuffer()
            const sanitizedFolderName = folder.name.replace(/[^a-zA-Z0-9-_]/g, '_')
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
            console.log(`Synced: ${file.name}`)

          } catch (fileError) {
            console.error(`Error syncing ${file.name}:`, fileError)
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
      totalFolders: subfolders.length,
      foldersProcessed: totalFoldersProcessed,
      foldersMatched: results.filter(r => r.motorId).length,
      foldersUnmatched: results.filter(r => !r.motorId).length,
      totalImagesFound: results.reduce((sum, r) => sum + r.imagesFound, 0),
      totalImagesSynced: dryRun ? results.reduce((sum, r) => sum + r.imagesFound, 0) : totalImagesSynced,
      results
    }

    console.log('\n=== Sync Summary ===')
    console.log(`Folders: ${summary.foldersMatched} matched, ${summary.foldersUnmatched} unmatched`)
    console.log(`Images: ${summary.totalImagesSynced} synced`)

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
