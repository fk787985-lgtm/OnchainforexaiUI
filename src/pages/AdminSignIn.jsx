import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../utils/axios'
import { useTheme } from '../context/ThemeContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import ThemeToggle from '../components/ThemeToggle'
import PasswordInput from '../components/PasswordInput'

export default function AdminSignIn() {
  const { settings: siteSettings } = useSiteSettings()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldTouched, setFieldTouched] = useState({})
  const navigate = useNavigate()
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
    
    setFieldTouched({ email: true, password: true })
    
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
      const response = await api.post('/api/auth/admin/signin', {
        email: formData.email.toLowerCase(),
        password: formData.password,
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
        clientLocale: navigator.language || undefined
      }, {
        timeout: 10000
      })
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token)
        // Redirect based on role
        if (response.data.user?.role === 'admin') {
          navigate('/admin/dashboard')
        } else if (response.data.user?.role === 'subadmin') {
          navigate('/subadmin/dashboard')
        } else {
          setError('Access denied. Admin or Sub-admin privileges required.')
          localStorage.removeItem('token')
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950 flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="w-full max-w-lg relative z-10">
        {/* Theme Toggle - Top Right */}
        <div className="absolute -top-16 right-0 sm:top-4 sm:right-4 z-20">
          <ThemeToggle />
        </div>

        {/* Admin Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 rounded-full mb-6">
            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-semibold text-purple-200">Admin Portal</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 sm:p-10">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 rounded-2xl shadow-2xl mb-4 transform hover:scale-105 transition-transform">
              <span className="text-white font-bold text-3xl">X</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Admin Access
            </h1>
            <p className="text-purple-200/80 text-sm sm:text-base">
              Secure administrative login portal
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-purple-200 mb-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span>Email Address</span>
                </div>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300/70">
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
                  className={`w-full pl-12 pr-4 py-3.5 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm border rounded-xl text-base font-medium text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all duration-200 ${
                    errors.email && fieldTouched.email 
                      ? 'border-red-400/50 focus:ring-red-400/50' 
                      : 'border-white/20 dark:border-gray-600/50 focus:bg-white/15'
                  }`}
                  placeholder="admin@peter.com"
                />
                {errors.email && fieldTouched.email && (
                  <div className="mt-2 flex items-center space-x-1.5 animate-fade-in">
                    <svg className="w-4 h-4 text-red-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-red-300">{errors.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-purple-200 mb-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Password</span>
                </div>
              </label>
              <PasswordInput
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                error={errors.password && fieldTouched.password ? errors.password : ''}
                required
                name="password"
                id="password"
                className="admin-input"
                placeholder="Enter your admin password"
              />
              {errors.password && fieldTouched.password && (
                <div className="mt-2 flex items-center space-x-1.5 animate-fade-in">
                  <svg className="w-4 h-4 text-red-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-red-300">{errors.password}</p>
                </div>
              )}
            </div>

            {/* Remember Me & Security Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-500 focus:ring-purple-400 border-gray-300 rounded bg-white/10"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-purple-200/80">
                  Remember this device
                </label>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
              <p className="text-xs text-yellow-200/80 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>This is a secure admin portal. All access is logged and monitored.</span>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:via-indigo-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Access Admin Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-sm text-purple-200/60">
              Regular user?{' '}
              <Link to="/signin" className="font-semibold text-purple-300 hover:text-purple-200 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-purple-300/50">
            © 2024 {siteSettings.site.name || 'XCrypto'} Admin Portal. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  )
}
