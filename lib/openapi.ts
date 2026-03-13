import { AUTH_COOKIE_NAME, BASE_URLS, ENDPOINTS, HttpMethod } from './api-doc-spec'

type OpenApi = {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers: Array<{ url: string }>
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey'
        in: 'cookie'
        name: string
        description?: string
      }
    }
  }
  paths: Record<string, any>
}

function toOpenApiPath(path: string) {
  // Next.js route style -> OpenAPI templated path
  return path
    .replace('/[id]', '/{id}')
    .replace('/:id', '/{id}')
    .replace('<id>', '{id}')
}

function methodLower(method: HttpMethod) {
  return method.toLowerCase()
}

function buildMinimalOperation(e: typeof ENDPOINTS[number]) {
  const op: any = {
    summary: e.summary,
    responses: {
      '200': {
        description: 'OK'
      },
      '400': { description: 'Bad Request' },
      '401': { description: 'Unauthorized' },
      '500': { description: 'Internal Server Error' },
    },
  }

  if (e.details?.query) {
    op.description = (op.description ? op.description + '\n\n' : '') + `Query: ${e.details.query}`
  }

  if (e.details?.notes) {
    op.description = (op.description ? op.description + '\n\n' : '') + e.details.notes
  }

  if (!e.authRequired) {
    // Explicitly override global security
    op.security = []
  }

  // Minimal body note: only for POST
  if (e.method === 'POST' && e.details?.body) {
    op.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: { type: 'object' },
          example: tryParseJsonExample(e.details.body)
        }
      }
    }
  }

  // If we have a response example, put it on 200
  if (e.responseExample) {
    op.responses['200'] = {
      description: 'OK',
      content: {
        'application/json': {
          schema: { type: 'object' },
          example: tryParseJsonExample(e.responseExample)
        }
      }
    }
  }

  // Path params
  if (toOpenApiPath(e.path).includes('{id}')) {
    op.parameters = op.parameters || []
    op.parameters.push({
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' }
    })
  }

  return op
}

function tryParseJsonExample(candidate: string) {
  const trimmed = candidate.trim()
  if (!trimmed) return undefined

  try {
    // allow single quotes in docs by converting only when it looks like JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return JSON.parse(trimmed)
    }
  } catch {
    // ignore
  }

  return undefined
}

export function buildOpenApiSpec(): OpenApi {
  const paths: Record<string, any> = {}

  for (const e of ENDPOINTS) {
    const p = toOpenApiPath(e.path)
    if (!paths[p]) paths[p] = {}

    paths[p][methodLower(e.method)] = buildMinimalOperation(e)
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'Content Analyzer API',
      version: '1.0.0',
      description: 'Generated from lib/api-doc-spec.ts'
    },
    servers: [
      { url: BASE_URLS.prod },
      { url: BASE_URLS.local },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: AUTH_COOKIE_NAME,
          description: 'JWT cookie auth'
        }
      }
    },
    // Default security: cookie required unless overridden by operation.security = []
    // (OpenAPI allows top-level security; we keep it implicit by applying at operation level)
    paths,
  }
}
