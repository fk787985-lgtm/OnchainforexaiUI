import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../utils/axios'
import { useTheme } from '../context/ThemeContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import PasswordInput from '../components/PasswordInput'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import { getClientNetworkMeta } from '../utils/clientNetworkMeta'
import GoogleAuthButton from '../components/GoogleAuthButton'
import AuthFancyShell from '../components/AuthFancyShell'

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
      const networkMeta = await getClientNetworkMeta()
      const response = await api.post('/api/auth/signin', {
        email: formData.email.toLowerCase(),
        password: formData.password,
        twoFactorCode: formData.twoFactorCode || undefined,
        clientLocale: navigator.language || undefined,
        ...networkMeta
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

  const handleGoogleSuccess = () => {
    navigate('/dashboard')
  }

  const handleGoogleNeedsProfile = () => {
    navigate('/auth/complete-profile')
  }

  return (
    <AuthFancyShell
      siteName={siteSettings.site.name || 'XCrypto'}
      logo={siteSettings.site.logo}
      title="Welcome back, trader"
      subtitle="Sign in to access markets, portfolio PnL, and secure funding."
    >
          <PageHeader title="Welcome Back" description="Sign in to your trading account" />

          {error && (
            <div className="mb-4 animate-fade-in">
              <Alert variant="error" message={error} />
            </div>
          )}

          {/* Social Auth */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <GoogleAuthButton
              onSuccess={handleGoogleSuccess}
              onRequiresProfile={handleGoogleNeedsProfile}
              onError={(msg) => setError(msg)}
            />
          </div>

          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="auth-divider-label px-3 sm:px-4 text-gray-500 dark:text-slate-400">Or continue with email</span>
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
                  className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-[#0c1524] border rounded-xl text-base font-medium text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1199fa]/40 focus:border-[#1199fa] transition-all duration-200 ${
                    errors.email && fieldTouched.email 
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500/30' 
                      : 'border-slate-300 dark:border-slate-600'
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
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm sm:text-base font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent transition-all duration-200 shadow-sm text-center text-2xl tracking-widest"
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
              className="fx-btn-primary"
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
            <Link to="/signup" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold">
              Sign Up
            </Link>
          </p>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#0c1524] border border-slate-200 dark:border-slate-600">
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 text-center">
              Protected by encrypted sessions · Trade securely
            </p>
          </div>
    </AuthFancyShell>
  )
}
