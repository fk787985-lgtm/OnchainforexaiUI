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
  // Otherwise, prepend API URL
  return `${API_URL}${path}`
}

// Helper function to get image URL (for use in img src attributes)
// This is a convenience function that can be used directly in JSX
export const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${API_URL}${path}`
}

