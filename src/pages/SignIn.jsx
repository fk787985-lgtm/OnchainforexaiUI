import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../utils/axios'
import { useTheme } from '../context/ThemeContext'
import { getImageUrl } from '../utils/imageUrl.js'
import { useSiteSettings } from '../context/SiteSettingsContext'
import ThemeToggle from '../components/ThemeToggle'
import PasswordInput from '../components/PasswordInput'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'

export default function SignIn() {
  const location = useLocation()
  const { settings: siteSettings } = useSiteSettings()
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
    twoFactorCode: ''
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [fieldTouched, setFieldTouched] = useState({})
  const navigate = useNavigate()
  const { theme } = useTheme()

  useEffect(() => {
    if (location.state?.email) {
      setFormData(prev => ({ ...prev, email: location.state.email }))
    }
  }, [location.state])

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

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required'
    }
    return ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    // Clear errors
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
    setError('')
  }

  const handleBlur = (fieldName) => {
    setFieldTouched({ ...fieldTouched, [fieldName]: true })
    
    let validation = ''
    if (fieldName === 'email') {
      validation = validateEmail(formData.email)
    } else if (fieldName === 'password') {
      validation = validatePassword(formData.password)
    }
    
    if (validation) {
      setErrors({ ...errors, [fieldName]: validation })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Mark all fields as touched
    setFieldTouched({ email: true, password: true })
    
    // Validate
    const newErrors = {}
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)

    if (emailError) newErrors.email = emailError
    if (passwordError) newErrors.password = passwordError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setLoading(true)

    try {
      const response = await api.post('/api/auth/signin', {
        email: formData.email.toLowerCase(),
        password: formData.password,
        twoFactorCode: formData.twoFactorCode || undefined
      }, {
        timeout: 10000
      })
      
      // Check if 2FA is required
      if (response.data.requires2FA) {
        setRequires2FA(true)
        setError('')
        setLoading(false)
        return
      }
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token)
        // Regular signin only for non-admin users
        if (response.data.user?.role === 'admin') {
          setError('Please use the admin sign in page')
          localStorage.removeItem('token')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      // Check if 2FA is required
      if (err.response?.data?.requires2FA) {
        setRequires2FA(true)
        setError('')
        setLoading(false)
        return
      }
      
      // Check if sub-admin needs to use admin signin
      if (err.response?.data?.requiresAdminSignin) {
        setError('Sub-admins must sign in through the admin portal.')
        setTimeout(() => {
          navigate('/admin/signin')
        }, 2000)
        return
      }
      
      // Show specific error message based on error type
      const errorMessage = err.response?.data?.message || 'Invalid email or password'
      const errorType = err.response?.data?.errorType
      
      // If it's a password error, show a clear message
      if (errorType === 'INVALID_PASSWORD') {
        setError('Wrong password. Please check your password and try again.')
      } else if (err.response?.data?.requiresVerification) {
        setError('Please verify your email before signing in')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialAuth = (provider) => {
    alert(`${provider} authentication will be implemented`)
  }

  return (
    <div className="fx-page flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        {/* Logo */}
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
                  {siteSettings.site.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {siteSettings.site.name || 'XCrypto'}
            </span>
          </Link>
        </div>

        {/* Sign In Card */}
        <div className="fx-card p-5 sm:p-8">
          <PageHeader title="Welcome Back" description="Sign in to your account securely" />

          {error && (
            <div className="mb-4 animate-fade-in">
              <Alert variant="error" message={error} />
            </div>
          )}

          {/* Social Auth Buttons */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <Button
              onClick={() => handleSocialAuth('Google')}
              variant="ghost"
              fullWidth
              className="flex items-center justify-center space-x-2 sm:space-x-3"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </Button>
            <Button
              onClick={() => handleSocialAuth('Apple')}
              fullWidth
              className="flex items-center justify-center space-x-2 sm:space-x-3 bg-black hover:bg-gray-900 dark:bg-black dark:hover:bg-gray-900"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span>Continue with Apple</span>
            </Button>
          </div>

          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-3 sm:px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
            </div>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="email" className="fx-label flex items-center space-x-2">
                <Icon name="users" size="sm" className="text-slate-500 dark:text-slate-400" />
                <span>Email Address</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  required
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border rounded-xl text-base font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200 shadow-sm ${
                    errors.email && fieldTouched.email 
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500/30' 
                      : 'border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700'
                  }`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && fieldTouched.email && (
                <div className="mt-2 flex items-center space-x-1.5 animate-fade-in">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <label htmlFor="password" className="fx-label flex items-center space-x-2 mb-0">
                  <Icon name="shield" size="sm" className="text-slate-500 dark:text-slate-400" />
                  <span>Password</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                required
                placeholder="Enter your password"
                error={errors.password && fieldTouched.password ? errors.password : ''}
              />
              {errors.password && fieldTouched.password && (
                <div className="mt-2 flex items-center space-x-1.5 animate-fade-in">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                </div>
              )}
            </div>

            {/* 2FA Code Input */}
            {requires2FA && (
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>2FA Code</span>
                </label>
                <input
                  type="text"
                  id="twoFactorCode"
                  name="twoFactorCode"
                  value={formData.twoFactorCode}
                  onChange={handleChange}
                  maxLength={6}
                  required={requires2FA}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm sm:text-base font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200 shadow-sm text-center text-2xl tracking-widest"
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              fullWidth
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : 'Sign In'}
            </Button>
          </form>

          {/* <div className="mt-4 text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Admin?{' '}
              <Link to="/admin/signin" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                Admin Sign In
              </Link>
            </p>
          </div> */}

          <p className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
