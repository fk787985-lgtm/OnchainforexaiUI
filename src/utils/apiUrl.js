/**
 * API URL Configuration
 * Uses centralized config from config/appConfig.js
 * 
 * To change URLs, update config/appConfig.js or set environment variables
 */
import { API_URL as CONFIG_API_URL } from '../config/appConfig.js'

// Export API_URL for backward compatibility
export const API_URL = CONFIG_API_URL

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

