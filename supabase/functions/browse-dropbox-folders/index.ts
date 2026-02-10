import { corsHeaders } from '../_shared/cors.ts'
import { requireAdmin } from "../_shared/admin-auth.ts";

interface DropboxFolder {
  name: string
  path: string
}

// ... keep existing code (BrowseResponse interface, listFolders function, getParentPath function)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Admin auth check
  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const dropboxToken = Deno.env.get('DROPBOX_ACCESS_TOKEN')
    if (!dropboxToken) {
      throw new Error('DROPBOX_ACCESS_TOKEN not configured')
    }

    const { path = '' } = await req.json()
    
    // Normalize path
    let normalizedPath = path.trim()
    if (normalizedPath === '/') {
      normalizedPath = ''
    }

    console.log('Browsing Dropbox folder:', normalizedPath || '(root)')

    const folders = await listFolders(dropboxToken, normalizedPath)

    const response: BrowseResponse = {
      folders,
      currentPath: normalizedPath || '/',
      parentPath: getParentPath(normalizedPath),
    }

    console.log(`Found ${folders.length} folders`)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Browse folders error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
