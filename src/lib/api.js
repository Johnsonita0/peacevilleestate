const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export async function apiRequest(path, { accessToken, headers, ...options } = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const requestHeaders = new Headers(headers)
  const hasBody = options.body !== undefined && options.body !== null

  if (hasBody && !(options.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    headers: requestHeaders,
  })
  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.message
      ? payload.message
      : `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, payload)
  }

  return payload
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
}
