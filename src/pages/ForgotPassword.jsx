import { Link } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import { useTheme } from '../context/ThemeContext'
import { API_URL } from '../utils/apiUrl.js'
import { useSiteSettings } from '../context/SiteSettingsContext'
import ThemeToggle from '../components/ThemeToggle'

export default function ForgotPassword() {
  const { settings: siteSettings } = useSiteSettings()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [fieldTouched, setFieldTouched] = useState(false)
  const { theme } = useTheme()

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      return 'Email is required'
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    if (fieldTouched) {
      setEmailError(validateEmail(value))
    }
    setError('')
  }

  const handleEmailBlur = () => {
    setFieldTouched(true)
    setEmailError(validateEmail(email))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldTouched(true)
    
    const validation = validateEmail(email)
    setEmailError(validation)
    
    if (validation) {
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/auth/forgot-password', { 
        email: email.toLowerCase() 
      }, {
        timeout: 10000
      })
      
      if (response.data.success) {
        setSuccess(true)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            {siteSettings.site.logo ? (
              <img
                src={siteSettings.site.logo?.startsWith('http') ? siteSettings.site.logo : `${API_URL}${siteSettings.site.logo}`}
                alt={siteSettings.site.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg sm:text-xl">
                  {siteSettings.site.name.charAt(0).toUpperCase() || 'X'}
                </span>
              </div>
            )}
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {siteSettings.site.name || 'XCrypto'}
            </span>
          </Link>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Forgot Password?</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            {success 
              ? 'Check your email for password reset instructions'
              : "Enter your email address and we'll send you a link to reset your password"
            }
          </p>

          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs sm:text-sm animate-fade-in">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
                We've sent a password reset link to <strong className="text-indigo-600 dark:text-indigo-400 break-all">{email}</strong>
              </p>
              <Link
                to="/signin"
                className="inline-block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition text-center text-sm sm:text-base shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  required
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    emailError && fieldTouched ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your email"
                />
                {emailError && fieldTouched && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 animate-fade-in">{emailError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !!emailError}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{' '}
            <Link to="/signin" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
