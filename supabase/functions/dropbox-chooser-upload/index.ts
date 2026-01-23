import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { fileUrl, fileName, motorId } = await req.json()

    if (!fileUrl || !fileName) {
      throw new Error('Missing required parameters: fileUrl and fileName')
    }

    console.log(`Processing Dropbox file: ${fileName}`)

    // Download the file from Dropbox
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to download file from Dropbox: ${response.statusText}`)
    }

    const blob = await response.blob()
    
    // Generate unique filename
    const timestamp = Date.now()
    const extension = fileName.split('.').pop()
    const uniqueFileName = `dropbox_${timestamp}.${extension}`

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('motor-images')
      .upload(uniqueFileName, blob)

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('motor-images')
      .getPublicUrl(uniqueFileName)

    // Determine media type
    const extension_lower = extension?.toLowerCase() || ''
    const mediaType = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension_lower) 
      ? 'image' : 'document'

    // Insert into motor_media table
    const { error: insertError } = await supabaseClient
      .from('motor_media')
      .insert({
        motor_id: motorId || null,
        media_type: mediaType,
        media_category: 'general',
        media_url: publicUrl,
        original_filename: fileName,
        file_size: blob.size,
        title: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
        dropbox_path: fileUrl,
        dropbox_sync_status: 'completed',
        assignment_type: motorId ? 'individual' : 'unassigned',
        is_active: true
      })

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`)
    }

    console.log(`Successfully processed file: ${fileName}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        fileName,
        publicUrl,
        mediaType 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Dropbox upload error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})