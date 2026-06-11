export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

const buildUrl = (input: string, params?: RequestOptions['params']): string => {
  if (!params) return input

  const url = new URL(input, window.location.origin)

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return
    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

export const request = async <T>(input: string, options: RequestOptions = {}): Promise<T> => {
  const { params, headers, ...rest } = options
  const response = await fetch(buildUrl(input, params), {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}
