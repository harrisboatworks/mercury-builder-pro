import { corsHeaders } from '../_shared/cors.ts'
import { requireAdmin } from "../_shared/admin-auth.ts";

interface DropboxFolder {
  name: string
  path: string
}

interface BrowseResponse {
  folders: DropboxFolder[]
  currentPath: string
  parentPath: string | null
}

async function listFolders(dropboxToken: string, path: string): Promise<DropboxFolder[]> {
  const folders: DropboxFolder[] = []
  let cursor: string | null = null
  let hasMore = true

  while (hasMore) {
    const endpoint: string = cursor
      ? 'https://api.dropboxapi.com/2/files/list_folder/continue'
      : 'https://api.dropboxapi.com/2/files/list_folder'

    const body: Record<string, unknown> = cursor
      ? { cursor }
      : { path: path || '', include_deleted: false, include_mounted_folders: true }

    const response: Response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dropbox API error:', errorText)
      throw new Error(`Dropbox API error: ${response.status} - ${errorText}`)
    }

    const data: { entries: Array<{ '.tag': string; name: string; path_lower?: string; path_display?: string }>; has_more: boolean; cursor: string } = await response.json()

    for (const entry of data.entries) {
      if (entry['.tag'] === 'folder') {
        folders.push({
          name: entry.name,
          path: (entry.path_lower || entry.path_display) as string,
        })
      }
    }

    hasMore = data.has_more
    cursor = data.cursor
  }

  folders.sort((a, b) => a.name.localeCompare(b.name))
  return folders
}

function getParentPath(currentPath: string): string | null {
  if (!currentPath || currentPath === '' || currentPath === '/') {
    return null
  }
  const parts = currentPath.split('/').filter(Boolean)
  if (parts.length <= 1) return ''
  parts.pop()
  return '/' + parts.join('/')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const dropboxToken = Deno.env.get('DROPBOX_ACCESS_TOKEN')
    if (!dropboxToken) {
      throw new Error('DROPBOX_ACCESS_TOKEN not configured')
    }

    const { path = '' } = await req.json()
    let normalizedPath = path.trim()
    if (normalizedPath === '/') normalizedPath = ''

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
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
