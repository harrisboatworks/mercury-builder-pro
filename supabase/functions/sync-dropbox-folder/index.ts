import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DropboxFile {
  name: string
  path_lower: string
  size: number
  content_hash: string
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

    const { config_id } = await req.json()
    
    if (!config_id) {
      throw new Error('config_id is required')
    }

    console.log('Starting Dropbox sync for config:', config_id)

    // Get the sync configuration
    const { data: config, error: configError } = await supabaseClient
      .from('dropbox_sync_config')
      .select('*')
      .eq('id', config_id)
      .single()

    if (configError || !config) {
      throw new Error(`Failed to get sync config: ${configError?.message}`)
    }

    // Update sync status to running
    await supabaseClient
      .from('dropbox_sync_config')
      .update({ 
        sync_status: 'running',
        error_message: null,
        last_sync_at: new Date().toISOString()
      })
      .eq('id', config_id)

    const dropboxToken = Deno.env.get('DROPBOX_ACCESS_TOKEN')
    if (!dropboxToken) {
      throw new Error('DROPBOX_ACCESS_TOKEN not configured')
    }

    // Normalize the Dropbox URL - handle both full URLs and partial paths
    let sharedLinkUrl = config.folder_path.trim()
    
    // If it's a partial path, prepend the full Dropbox URL
    if (sharedLinkUrl.startsWith('scl/fo/') || sharedLinkUrl.startsWith('/scl/fo/')) {
      sharedLinkUrl = `https://www.dropbox.com/${sharedLinkUrl.replace(/^\//, '')}`
    } else if (sharedLinkUrl.startsWith('s/') || sharedLinkUrl.startsWith('/s/')) {
      sharedLinkUrl = `https://www.dropbox.com/${sharedLinkUrl.replace(/^\//, '')}`
    } else if (!sharedLinkUrl.startsWith('https://')) {
      throw new Error('Invalid Dropbox URL format. Please use a full Dropbox shared folder URL (e.g., https://www.dropbox.com/scl/fo/...)')
    }
    
    console.log('Processing Dropbox URL:', sharedLinkUrl)
    
    // Extract shared folder ID from normalized URL - support both old and new formats
    const oldFormatMatch = sharedLinkUrl.match(/\/s\/([a-zA-Z0-9]+)/)
    const newFormatMatch = sharedLinkUrl.match(/\/scl\/fo\/([a-zA-Z0-9_-]+)/)
    
    if (!oldFormatMatch && !newFormatMatch) {
      throw new Error(`Invalid Dropbox folder URL format. URL: ${sharedLinkUrl}. Please use a valid Dropbox shared folder URL.`)
    }
    
    // Determine which API endpoint to use based on URL format
    let listResponse
    
    if (newFormatMatch) {
      // New format - use shared_link parameter
      listResponse = await fetch('https://api.dropboxapi.com/2/sharing/list_folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dropboxToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shared_link: {
            url: sharedLinkUrl
          },
          path: ''
        })
      })
    } else {
      // Old format - use files/list_folder with shared_link
      listResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dropboxToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: '',
          shared_link: {
            url: sharedLinkUrl
          }
        })
      })
    }

    if (!listResponse.ok) {
      const error = await listResponse.text()
      throw new Error(`Dropbox API error: ${error}`)
    }

    const listData = await listResponse.json()
    const files: DropboxFile[] = listData.entries.filter((entry: any) => 
      entry['.tag'] === 'file' && 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(entry.name)
    )

    console.log(`Found ${files.length} image files to sync`)

    let syncedCount = 0
    const errors: string[] = []

    for (const file of files) {
      try {
        // Check if file already exists in motor_media
        const { data: existingMedia } = await supabaseClient
          .from('motor_media')
          .select('id')
          .eq('dropbox_path', file.path_lower)
          .single()

        if (existingMedia) {
          console.log(`File already synced: ${file.name}`)
          continue
        }

        // Download file from Dropbox
        const downloadResponse = await fetch('https://content.dropboxapi.com/2/files/download', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${dropboxToken}`,
            'Dropbox-API-Arg': JSON.stringify({
              path: file.path_lower,
              shared_link: {
                url: sharedLinkUrl
              }
            })
          }
        })

        if (!downloadResponse.ok) {
          throw new Error(`Failed to download ${file.name}`)
        }

        const fileBuffer = await downloadResponse.arrayBuffer()
        const fileName = `dropbox-sync/${config_id}/${Date.now()}-${file.name}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('motor-images')
          .upload(fileName, fileBuffer, {
            contentType: getContentType(file.name),
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('motor-images')
          .getPublicUrl(fileName)

        // Determine motor assignment based on filename and rules
        let motorId = null
        if (config.motor_assignment_rule) {
          const { data: motors } = await supabaseClient
            .from('motor_models')
            .select('id, model_display, model_number')
            .ilike('model_display', `%${config.motor_assignment_rule}%`)
            .limit(1)

          if (motors && motors.length > 0) {
            motorId = motors[0].id
          }
        }

        // Create motor_media record
        const { error: mediaError } = await supabaseClient
          .from('motor_media')
          .insert({
            motor_id: motorId,
            media_type: 'image',
            media_category: 'gallery',
            media_url: publicUrl,
            original_filename: file.name,
            dropbox_path: file.path_lower,
            dropbox_sync_status: 'synced',
            assignment_type: motorId ? 'automatic' : 'bulk',
            assignment_rules: { 
              sync_config_id: config_id,
              assignment_rule: config.motor_assignment_rule 
            },
            title: file.name.replace(/\.[^/.]+$/, ''),
            file_size: file.size,
            mime_type: getContentType(file.name)
          })

        if (mediaError) {
          throw new Error(`Failed to create media record: ${mediaError.message}`)
        }

        syncedCount++
        console.log(`Successfully synced: ${file.name}`)

      } catch (error) {
        console.error(`Error syncing ${file.name}:`, error)
        errors.push(`${file.name}: ${error.message}`)
      }
    }

    // Update sync configuration with results
    await supabaseClient
      .from('dropbox_sync_config')
      .update({
        sync_status: errors.length > 0 ? 'error' : 'completed',
        files_synced: syncedCount,
        error_message: errors.length > 0 ? errors.join('; ') : null,
        last_sync_at: new Date().toISOString()
      })
      .eq('id', config_id)

    return new Response(
      JSON.stringify({
        success: true,
        synced_files: syncedCount,
        total_files: files.length,
        errors: errors
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Dropbox sync error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

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