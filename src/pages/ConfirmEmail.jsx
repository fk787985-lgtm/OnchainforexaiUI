import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../utils/axios'
import { useTheme } from '../context/ThemeContext'
import { API_URL } from '../utils/apiUrl.js'
import { useSiteSettings } from '../context/SiteSettingsContext'
import ThemeToggle from '../components/ThemeToggle'

export default function ConfirmEmail() {
  const { settings: siteSettings } = useSiteSettings()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0) // Countdown timer in seconds
  const [isResending, setIsResending] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else if (email) {
      setStatus('pending')
      setMessage('Please check your email and click the confirmation link.')
    } else {
      setStatus('error')
      setMessage('Invalid confirmation link.')
    }
  }, [token, email])

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [resendCooldown])

  const verifyEmail = async (verificationToken) => {
    try {
      console.log('📧 Verifying email with token:', verificationToken.substring(0, 10) + '...')
      const response = await api.post('/api/auth/verify-email', { 
        token: verificationToken 
      }, {
        timeout: 10000
      })
      
      console.log('✅ Verification response:', response.data)
      if (response.data.success) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
      }
    } catch (err) {
      console.error('❌ Verification error:', err)
      setStatus('error')
      setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.')
    }
  }

  const resendEmail = async () => {
    if (!email || resendCooldown > 0 || isResending) return
    
    setIsResending(true)
    try {
      console.log('📧 Resending verification email to:', email)
      const response = await api.post('/api/auth/resend-verification', { 
        email: email.toLowerCase() 
      }, {
        timeout: 10000
      })
      
      console.log('✅ Resend response:', response.data)
      if (response.data.success) {
        setMessage('Verification email has been resent. Please check your inbox.')
        // Start 1 minute (60 seconds) cooldown
        setResendCooldown(60)
      }
    } catch (err) {
      console.error('❌ Resend error:', err)
      setMessage(err.response?.data?.message || 'Failed to resend email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

        {/* Confirm Email Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 border border-gray-200 dark:border-gray-700 text-center">
          {status === 'loading' && (
            <>
              <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Verifying Email</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Please wait...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Email Verified!</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">{message}</p>
              <Link
                to="/signin"
                className="inline-block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition text-sm sm:text-base shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Continue to Sign In
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Verification Failed</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">{message}</p>
              {email && (
                <button
                  onClick={resendEmail}
                  disabled={resendCooldown > 0 || isResending}
                  className={`w-full py-2.5 sm:py-3 rounded-lg font-bold transition mb-3 sm:mb-4 text-sm sm:text-base shadow-lg ${
                    resendCooldown > 0 || isResending
                      ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isResending ? (
                    'Sending...'
                  ) : resendCooldown > 0 ? (
                    `Resend in ${formatTime(resendCooldown)}`
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
              )}
              <Link
                to="/signup"
                className="inline-block w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 sm:py-3 rounded-lg font-bold hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition text-sm sm:text-base"
              >
                Back to Sign Up
              </Link>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Check Your Email</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">
                We've sent a verification link to <strong className="text-indigo-600 dark:text-indigo-400 break-all">{email}</strong>
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Click the link in the email to verify your account.
              </p>
              <button
                onClick={resendEmail}
                disabled={resendCooldown > 0 || isResending}
                className={`w-full py-2.5 sm:py-3 rounded-lg font-bold transition mb-3 sm:mb-4 text-sm sm:text-base shadow-lg ${
                  resendCooldown > 0 || isResending
                    ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isResending ? (
                  'Sending...'
                ) : resendCooldown > 0 ? (
                  `Resend in ${formatTime(resendCooldown)}`
                ) : (
                  'Resend Verification Email'
                )}
              </button>
              <Link
                to="/signin"
                className="inline-block w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 sm:py-3 rounded-lg font-bold hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition text-sm sm:text-base"
              >
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
