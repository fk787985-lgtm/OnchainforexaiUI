// API Base URL - Use empty string for local development (to use Vite proxy)
// Or set VITE_API_URL to your backend URL (e.g., http://localhost:5000)
// For production, set VITE_API_URL to https://api.onchainforexai.com
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://api.onchainforexai.com')

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

