/**
 * Centralized Application Configuration
 * 
 * To switch between local and production:
 * 1. Set VITE_APP_ENV environment variable:
 *    - Local: VITE_APP_ENV=development (default)
 *    - Production: VITE_APP_ENV=production
 * 
 * 2. Or override specific URLs using environment variables:
 *    - VITE_API_URL - Backend API URL (empty string uses Vite proxy in dev)
 *    - VITE_FRONTEND_URL - Frontend URL (for absolute URLs)
 * 
 * 3. For production builds, set these in your .env.production file:
 *    VITE_APP_ENV=production
 *    VITE_API_URL=https://api.onchainforexai.com
 *    VITE_FRONTEND_URL=https://onchainforexai.com
 */

// Default to production unless explicitly set to development
// Check both VITE_APP_ENV and MODE, default to production unless explicitly development
const isProduction = import.meta.env.VITE_APP_ENV !== 'development' && import.meta.env.VITE_APP_ENV !== 'dev' && import.meta.env.MODE !== 'development'
const isDevelopment = !isProduction

// Production URLs
const PROD_API_URL = 'https://api.onchainforexai.com'
const PROD_FRONTEND_URL = 'https://onchainforexai.com'

// Local/Development URLs
const LOCAL_API_URL = '' // Empty string uses Vite proxy in development
const LOCAL_FRONTEND_URL = 'http://localhost:3000'

// Get API URL
// Priority: VITE_API_URL env var > production URL (default) > empty string (uses proxy in dev)
export const API_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (isProduction ? PROD_API_URL : LOCAL_API_URL)

// Get Frontend URL (for cases where absolute URLs are needed)
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || (isProduction ? PROD_FRONTEND_URL : LOCAL_FRONTEND_URL)

// Export configuration object
export const config = {
  isProduction,
  apiUrl: API_URL,
  frontendUrl: FRONTEND_URL,
  mode: import.meta.env.MODE,
  // Additional config can be added here
}

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 Frontend Configuration:', {
    environment: import.meta.env.VITE_APP_ENV || 'development',
    mode: import.meta.env.MODE,
    apiUrl: API_URL || '(empty - using Vite proxy)',
    frontendUrl: FRONTEND_URL,
    viteApiUrl: import.meta.env.VITE_API_URL || '(not set)',
  })
}

export default config

