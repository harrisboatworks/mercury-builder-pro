import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const filePath = url.searchParams.get('path');
    const bucket = url.searchParams.get('bucket') || 'motor-images';
    const download = url.searchParams.get('download') === 'true';
    const filename = url.searchParams.get('filename');

    if (!filePath) {
      return new Response('Missing file path parameter', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download the file from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      console.error('Error fetching file:', error);
      return new Response('File not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Determine content type based on file extension
    const getContentType = (path: string): string => {
      const ext = path.toLowerCase().split('.').pop();
      switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'gif': return 'image/gif';
        case 'webp': return 'image/webp';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'txt': return 'text/plain';
        default: return 'application/octet-stream';
      }
    };

    const contentType = getContentType(filePath);
    
    // Set up response headers
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    };

    // Add download headers if requested
    if (download && filename) {
      responseHeaders['Content-Disposition'] = `attachment; filename="${filename}"`;
    } else {
      responseHeaders['Content-Disposition'] = 'inline';
    }

    return new Response(data, {
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});