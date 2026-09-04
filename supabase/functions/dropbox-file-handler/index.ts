import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { requireAdmin } from "../_shared/admin-auth.ts";
import {
  forbiddenAdminBrowserOrigin,
  resolveAdminBrowserCors,
} from "../_shared/admin-browser-cors.ts";
import {
  fetchAllowedDropboxFile,
  readLimitedDropboxFile,
  resolveAllowedDropboxFileUrl,
} from "../_shared/dropbox-file-url.ts";
import { getDropboxAccessToken } from "../_shared/dropbox-token.ts";

serve(async (req) => {
  const { origin, headers: corsHeaders } = resolveAdminBrowserCors(req);
  if (req.method === 'OPTIONS') {
    return origin ? new Response(null, { headers: corsHeaders }) : forbiddenAdminBrowserOrigin(corsHeaders);
  }
  if (!origin) return forbiddenAdminBrowserOrigin(corsHeaders);
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = await requireAdmin(req, corsHeaders);
  if (admin instanceof Response) return admin;

  try {
    console.log('Dropbox file handler called');
    
    const { fileUrl, fileName, motorId } = await req.json();
    
    if (!fileUrl || !fileName) {
      return new Response(
        JSON.stringify({ error: 'File URL and name are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    if (!resolveAllowedDropboxFileUrl(fileUrl)) {
      return new Response(JSON.stringify({ error: 'Dropbox file URL is not allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { accessToken } = await getDropboxAccessToken(supabase);

    let fileData: Uint8Array;
    let contentType: string = 'application/octet-stream';

    // Try authenticated Dropbox API first if we have an access token
    if (accessToken) {
      console.log('Using authenticated Dropbox API');

      const apiResponse = await fetch('https://content.dropboxapi.com/2/sharing/get_shared_link_file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({ url: fileUrl })
        }
      });

      if (apiResponse.ok) {
        fileData = await readLimitedDropboxFile(apiResponse);
        contentType = apiResponse.headers.get('Content-Type') || contentType;
        console.log('Successfully downloaded via Dropbox API');
      } else {
        console.log('Dropbox API failed, falling back to direct URL');
        // Fallback to direct URL
        const fallbackResponse = await fetchAllowedDropboxFile(fileUrl);
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to download file: ${fallbackResponse.status}`);
        }
        fileData = await readLimitedDropboxFile(fallbackResponse);
        contentType = fallbackResponse.headers.get('Content-Type') || contentType;
      }
    } else {
      console.log('Using direct URL (no access token)');
      // Direct URL download (original method)
      const response = await fetchAllowedDropboxFile(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }
      fileData = await readLimitedDropboxFile(response);
      contentType = response.headers.get('Content-Type') || contentType;
    }

    // Generate unique filename for Supabase storage
    const timestamp = Date.now();
    const extension = fileName.split('.').pop() || '';
    const uniqueFileName = `${timestamp}-${fileName}`;

    console.log(`Uploading file to Supabase: ${uniqueFileName}, size: ${fileData.length} bytes`);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('motor-images')
      .upload(uniqueFileName, fileData, {
        contentType: contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('File uploaded successfully:', uploadData.path);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('motor-images')
      .getPublicUrl(uploadData.path);

    // Determine media type from file extension
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const documentExtensions = ['pdf', 'doc', 'docx'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv'];
    
    let mediaType = 'document';
    const ext = extension.toLowerCase();
    
    if (imageExtensions.includes(ext)) {
      mediaType = 'image';
    } else if (documentExtensions.includes(ext)) {
      mediaType = 'pdf';
    } else if (videoExtensions.includes(ext)) {
      mediaType = 'video';
    }

    // Insert metadata into motor_media table
    const { data: mediaData, error: mediaError } = await supabase
      .from('motor_media')
      .insert({
        motor_id: motorId,
        media_type: mediaType,
        media_url: publicUrl,
        original_filename: fileName,
        dropbox_path: fileUrl,
        file_size: fileData.length,
        mime_type: contentType,
        chooser_imported: true,
        is_active: true
      })
      .select()
      .single();

    if (mediaError) {
      console.error('Database error:', mediaError);
      // Try to clean up uploaded file
      await supabase.storage.from('motor-images').remove([uploadData.path]);
      throw new Error(`Database insert failed: ${mediaError.message}`);
    }

    console.log('Media metadata saved successfully:', mediaData.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        file: {
          id: mediaData.id,
          url: publicUrl,
          originalName: fileName,
          size: fileData.length,
          type: mediaType
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in Dropbox file handler:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'File processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
