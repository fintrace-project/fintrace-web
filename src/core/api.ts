// Same-origin requests: the browser sends the BFF's session cookie, and no token reaches JavaScript.

export class UnauthorizedError extends Error {
  constructor() {
    super('Not signed in')
    this.name = 'UnauthorizedError'
  }
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { headers: { Accept: 'application/json' }, signal })
  if (response.status === 401) {
    throw new UnauthorizedError()
  }
  if (!response.ok) {
    throw new ApiError(response.status, `${path} answered ${response.status}`)
  }
  // An SPA fallback answers any unknown path with index.html and a 200, so a 2xx alone proves nothing.
  if (!response.headers.get('Content-Type')?.includes('json')) {
    throw new ApiError(response.status, `${path} did not answer with JSON`)
  }
  return (await response.json()) as T
}

// Hand-written until 4.2b generates the client from Core's openapi.json; delete it then.
export interface Workspace {
  id: string
  name: string
  status: 'NEW' | 'IMPORTING' | 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  defaultCurrency: string
  version: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export const listWorkspaces = (signal?: AbortSignal) => apiGet<Workspace[]>('/api/v1/workspaces', signal)
