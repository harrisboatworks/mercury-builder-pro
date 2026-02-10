import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { isDetailShotByUrl, selectBestHeroImage, logImageValidation } from '../_shared/image-validation.ts';
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ... keep existing code (interfaces, helper functions through resolveSharedLinkToPath)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Admin auth check
  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

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

        // Validate images and sort: full motor shots first, detail shots last
        const validatedImages = imageFiles.map(file => ({
          file,
          validation: isDetailShotByUrl(file.name)
        })).sort((a, b) => {
          // Detail shots go to the end
          if (a.validation.isDetailShot && !b.validation.isDetailShot) return 1
          if (!a.validation.isDetailShot && b.validation.isDetailShot) return -1
          // Higher score = better hero candidate
          return b.validation.score - a.validation.score
        })

        // Log validation results
        const detailShots = validatedImages.filter(v => v.validation.isDetailShot)
        if (detailShots.length > 0) {
          console.log(`⚠️ Found ${detailShots.length} detail shots that won't be used as hero:`, 
            detailShots.map(d => `${d.file.name} (${d.validation.reason})`).join(', '))
        }

        folderResult.imagesFound = imageFiles.length
        folderResult.pdfsFound = pdfFiles.length
        console.log(`Found ${imageFiles.length} images (${imageFiles.length - detailShots.length} hero candidates) and ${pdfFiles.length} PDFs`)

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

        // Download and sync each image (using validated/sorted order)
        let heroAssigned = false
        for (let i = 0; i < validatedImages.length; i++) {
          const { file, validation } = validatedImages[i]
          
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

            // Determine media category: only use non-detail shots as hero
            // First non-detail shot becomes hero, rest are gallery
            let mediaCategory: string
            if (!heroAssigned && !validation.isDetailShot) {
              mediaCategory = 'hero'
              heroAssigned = true
              console.log(`✓ Selected hero image: ${file.name} (score: ${validation.score})`)
            } else {
              mediaCategory = validation.isDetailShot ? 'detail' : 'gallery'
              if (validation.isDetailShot) {
                console.log(`ℹ️ Marked as detail shot: ${file.name}`)
              }
            }

            // Create motor_media record
            const { error: mediaError } = await supabaseClient
              .from('motor_media')
              .insert({
                motor_id: bestMatch.id,
                media_type: 'image',
                media_category: mediaCategory,
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
                  image_validation: {
                    isDetailShot: validation.isDetailShot,
                    score: validation.score,
                    reason: validation.reason
                  }
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
