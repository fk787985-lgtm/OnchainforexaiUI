import axios from 'axios'
import { API_URL } from './apiUrl.js'

// Ensure API_URL is set correctly
const getBaseURL = () => {
  // If API_URL is explicitly set, use it
  if (API_URL) {
    return API_URL
  }
  // In production, default to production API URL
  if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
    return 'https://api.onchainforexai.com'
  }
  // In development, use empty string for Vite proxy
  return ''
}

// Get the base URL
const baseURL = getBaseURL()

// Log API configuration (both dev and prod for debugging)

/* 
hhh
console.log('🔧 API Configuration:', {
  baseURL: baseURL || '(empty - using Vite proxy)',
  apiUrlFromConfig: API_URL || '(empty)',
  mode: import.meta.env.MODE,
  viteApiUrl: import.meta.env.VITE_API_URL || '(not set)',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD
})
*/


const api = axios.create({
  baseURL: baseURL, // Use helper function to ensure correct URL
  withCredentials: true, // Include cookies
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests (unless skipAuth — e.g. Google login)
api.interceptors.request.use(
  (config) => {
    if (config.skipAuth) {
      if (config.headers) {
        delete config.headers.Authorization
        delete config.headers.authorization
      }
      return config
    }
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url || '')
      // Don't force-logout on background polls or login/auth attempts
      const isBackgroundPoll =
        url.includes('/notifications/unread-count') ||
        url.includes('/api/notifications/unread-count')
      const isAuthAttempt =
        url.includes('/auth/google') ||
        url.includes('/auth/signin') ||
        url.includes('/auth/signup') ||
        url.includes('/auth/login') ||
        url.includes('/auth/admin')
      if (!isBackgroundPoll && !isAuthAttempt && !error.config?.skipAuth) {
        localStorage.removeItem('token')
        const path = window.location.pathname || ''
        if (!path.startsWith('/signin') && !path.startsWith('/admin/signin')) {
          window.location.href = path.startsWith('/admin') ? '/admin/signin' : '/signin'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api






