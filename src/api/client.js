import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toUpperCase()
  const url = config.url ?? ''
  console.info(`[API] ${method} ${url} called`)
  return config
})

client.interceptors.response.use(
  (response) => {
    const method = (response.config?.method ?? 'get').toUpperCase()
    const url = response.config?.url ?? ''
    console.info(`[API] ${method} ${url} success (${response.status})`)
    return response
  },
  (error) => {
    const method = (error.config?.method ?? 'get').toUpperCase()
    const url = error.config?.url ?? ''
    const statusCode = error.response?.status ?? 0
    console.info(`[API] ${method} ${url} failed (${statusCode})`)

    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      'An unexpected error occurred. Please try again.'

    return Promise.reject({
      message,
      code: error.response?.data?.code ?? 'UNKNOWN_ERROR',
      status: error.response?.status ?? 0,
    })
  }
)

export default client
