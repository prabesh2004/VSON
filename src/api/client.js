import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
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
