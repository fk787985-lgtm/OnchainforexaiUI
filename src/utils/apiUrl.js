// API Base URL - Production
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.onchainforexai.com'

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

