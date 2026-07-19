/**
 * API URL Configuration
 * Uses centralized config from config/appConfig.js
 * 
 * To change URLs, update config/appConfig.js or set environment variables
 */
import { API_URL as CONFIG_API_URL } from '../config/appConfig.js'

// Export API_URL for backward compatibility
export const API_URL = CONFIG_API_URL

/**
 * Socket.IO server URL.
 * In Vite dev, API_URL is often empty (HTTP proxy). WebSockets through the
 * Vite proxy are unreliable, so we talk to the API port directly.
 */
export function getSocketUrl() {
  // Explicit env overrides
  const envSocket = import.meta.env.VITE_SOCKET_URL
  if (envSocket) return envSocket

  if (API_URL) return API_URL

  // Dev: direct to local API (default port 5000)
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_PROXY_TARGET || 'http://localhost:5000'
  }

  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

// Helper function to get full URL for assets/images
export const getAssetUrl = (path) => {
  if (!path) return ''
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // If path starts with /, use it directly (works with Vite proxy)
  if (path.startsWith('/')) {
    return API_URL ? `${API_URL}${path}` : path
  }
  // Otherwise, prepend API URL (or use path directly if API_URL is empty for proxy)
  return API_URL ? `${API_URL}/${path}` : `/${path}`
}

// Helper function to get image URL (for use in img src attributes)
// This is a convenience function that can be used directly in JSX
export const getImageUrl = (path) => {
  if (!path) return ''
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // If path starts with /, use it directly (works with Vite proxy)
  if (path.startsWith('/')) {
    return API_URL ? `${API_URL}${path}` : path
  }
  // Otherwise, prepend API URL (or use path directly if API_URL is empty for proxy)
  return API_URL ? `${API_URL}/${path}` : `/${path}`
}

