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
  // Otherwise, prepend API URL
  return `${API_URL}${path}`
}

export default getImageUrl

