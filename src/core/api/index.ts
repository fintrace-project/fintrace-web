import createClient, { type Middleware } from 'openapi-fetch'
import type { components, paths } from './schema'

// Same-origin requests: the browser sends the BFF's session cookie, and no token reaches JavaScript.

export type Workspace = components['schemas']['WorkspaceResponse']
export type Account = components['schemas']['AccountResponse']
export type AccountBalance = components['schemas']['AccountBalanceResponse']
export type CoreProblem = components['schemas']['CoreProblem']

export class UnauthorizedError extends Error {
  constructor() {
    super('Not signed in')
    this.name = 'UnauthorizedError'
  }
}

export class ApiError extends Error {
  readonly status: number
  // Core's and the BFF's refusals are problem+json; absent when the answer was not
  readonly problem: CoreProblem | undefined

  constructor(status: number, message: string, problem?: CoreProblem) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

const isJson = (response: Response) => response.headers.get('Content-Type')?.includes('json') ?? false

async function refuseFailures(path: string, response: Response): Promise<void> {
  if (response.status === 401) {
    throw new UnauthorizedError()
  }
  if (!response.ok) {
    const problem = isJson(response) ? ((await response.clone().json()) as CoreProblem) : undefined
    throw new ApiError(response.status, problem?.detail ?? `${path} answered ${response.status}`, problem)
  }
  // An SPA fallback answers any unknown path with index.html and a 200, so a 2xx alone proves nothing.
  if (response.status !== 204 && !isJson(response)) {
    throw new ApiError(response.status, `${path} did not answer with JSON`)
  }
}

const failures: Middleware = {
  async onResponse({ request, response }) {
    await refuseFailures(new URL(request.url).pathname, response)
    return undefined
  },
}

export const api = createClient<paths>()
api.use(failures)

// The middleware has already thrown for every failure, so a result without data is a client defect
export function dataOf<T>(result: { data?: T }): T {
  if (result.data === undefined) {
    throw new Error('A successful response carried no body')
  }
  return result.data
}

// Core v0.0.5 documents its paging as a required `page` object; until a release lists page, size and
// sort as query parameters, this call stays outside the typed client.
export async function listWorkspaces(signal?: AbortSignal): Promise<Workspace[]> {
  const response = await fetch('/api/v1/workspaces', { headers: { Accept: 'application/json' }, signal })
  await refuseFailures('/api/v1/workspaces', response)
  return (await response.json()) as Workspace[]
}
