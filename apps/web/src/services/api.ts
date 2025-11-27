import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Request interceptor (auth disabled for now)
api.interceptors.request.use(
  config => {
    // No authentication required
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  error => {
    // Just pass through errors without redirecting
    return Promise.reject(error)
  }
)

export default api
