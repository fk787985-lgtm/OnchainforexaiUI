/**
 * Image URL Helper
 * Centralized helper for getting image URLs using the app config
 */

import { API_URL } from './apiUrl.js'

/**
 * Get the full URL for an image path
 * @param {string} path - Image path (relative or absolute)
 * @returns {string} Full URL to the image
 */
export const getImageUrl = (path) => {
  if (!path) return ''
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  // If API_URL is empty (development with proxy), use path directly
  // Otherwise, prepend API_URL
  return API_URL ? `${API_URL}${normalizedPath}` : normalizedPath
}

export default getImageUrl

