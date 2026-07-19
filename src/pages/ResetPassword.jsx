import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import api from '../utils/axios'
import ThemeToggle from '../components/ThemeToggle'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { getImageUrl } from '../utils/imageUrl.js'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { settings: siteSettings } = useSiteSettings()

  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const hasRequiredParams = useMemo(() => Boolean(token && email), [token, email])

  const validate = () => {
    if (!hasRequiredParams) return 'Invalid reset link. Please request a new one.'
    if (!newPassword || newPassword.length < 8) return 'Password must be at least 8 characters.'
    if (newPassword !== confirmPassword) return 'Passwords do not match.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const message = validate()
    if (message) {
      setError(message)
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        email,
        newPassword
      })

      if (response.data?.success) {
        setSuccess(true)
        setTimeout(() => navigate('/signin'), 1600)
      } else {
        setError(response.data?.message || 'Unable to reset password.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. Try requesting a new link.')
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
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            {siteSettings.site.logo ? (
              <img
                src={getImageUrl(siteSettings.site.logo)}
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
              {siteSettings.site.name || 'Onchainforexai'}
            </span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Reset Password</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            {hasRequiredParams ? 'Set your new password to secure your account.' : 'This link is invalid or expired.'}
          </p>

          {error ? (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs sm:text-sm">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
                Password reset successful. Redirecting to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm sm:text-base text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="At least 8 characters"
                  disabled={!hasRequiredParams}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm sm:text-base text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Repeat password"
                  disabled={!hasRequiredParams}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded"
                />
                Show password
              </label>

              <button
                type="submit"
                disabled={loading || !hasRequiredParams}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Back to{' '}
            <Link to="/signin" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

