// The apps a workspace's history can be imported from, one importer service each (§3.2): a new
// provider is a new entry here, and the screens follow it
export interface ImportSource {
  // Also the key of what to export from the app, under importSources in en.yml
  id: 'mok'
  // The app's own name, which is not translated
  name: string
  // The importer's upload limit; a bigger file is refused before it is sent
  maxBytes: number
  // The BFF routes each importer's upload on a path of its own
  uploadPath: (workspaceId: string) => string
}

export const importSources: ImportSource[] = [
  {
    id: 'mok',
    name: 'MOK',
    maxBytes: 50 * 1024 * 1024,
    uploadPath: (workspaceId) => `/api/v1/workspaces/${workspaceId}/import`,
  },
]
