import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import api from '../utils/axios'
import { useTheme } from '../context/ThemeContext'
import { API_URL } from '../utils/apiUrl.js'
import { useSiteSettings } from '../context/SiteSettingsContext'
import ThemeToggle from '../components/ThemeToggle'
import PhoneInput, { isValidPhoneNumber } from '../components/PhoneInput'

export default function SignUp() {
  const { settings: siteSettings } = useSiteSettings()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [fieldTouched, setFieldTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const { theme } = useTheme()
  const emailCheckTimeoutRef = useRef(null)

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

  const validateFullName = (name) => {
    if (!name.trim()) {
      return 'Full name is required'
    }
    if (name.trim().length < 2) {
      return 'Full name must be at least 2 characters'
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return 'Full name can only contain letters and spaces'
    }
    return ''
  }

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required'
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    return ''
  }

  const validatePhone = (phone) => {
    if (!phone) {
      return 'Phone number is required'
    }
    
    // Check if phone has country code
    if (!phone.startsWith('+')) {
      return 'Phone number must include country code'
    }
    
    // Use the library's validation function
    try {
      if (!isValidPhoneNumber(phone)) {
        return 'Please enter a valid phone number'
      }
    } catch (e) {
      // Fallback validation if library validation fails
      const phoneDigits = phone.replace(/[^\d]/g, '')
      
      // Check total length (E.164 format: max 15 digits)
      if (phoneDigits.length < 8) {
        return 'Phone number is too short'
      }
      if (phoneDigits.length > 15) {
        return 'Phone number is too long (maximum 15 digits)'
      }
      
      // Check if number part is reasonable
      const countryCodeMatch = phone.match(/^\+(\d{1,4})/)
      if (countryCodeMatch) {
        const countryCodeLength = countryCodeMatch[1].length
        const numberPartLength = phoneDigits.length - countryCodeLength
        if (numberPartLength < 7) {
          return 'Phone number is too short'
        }
        if (numberPartLength > 12) {
          return 'Phone number is too long'
        }
      } else {
        return 'Invalid phone number format'
      }
    }
    
    return ''
  }

  // Debounced email check
  const checkEmailExists = async (emailValue) => {
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current)
    }

    emailCheckTimeoutRef.current = setTimeout(async () => {
      if (!emailValue || validateEmail(emailValue)) {
        return
      }

      setCheckingEmail(true)
      try {
        const response = await api.post('/api/auth/check-email', { 
          email: emailValue.toLowerCase() 
        }, {
          timeout: 5000 // 5 second timeout
        })
        
        if (response.data.exists) {
          navigate('/signin', { state: { email: emailValue } })
        } else {
          setStep('password')
        }
      } catch (err) {
        // If check fails, allow user to proceed
        setStep('password')
      } finally {
        setCheckingEmail(false)
      }
    }, 800) // Wait 800ms after user stops typing
  }

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    const validation = validateEmail(value)
    setEmailError(validation)
    
    // Auto-check email after validation passes
    if (!validation && value.length > 5) {
      checkEmailExists(value)
    }
  }

  const handleEmailBlur = () => {
    setFieldTouched({ ...fieldTouched, email: true })
    const validation = validateEmail(email)
    setEmailError(validation)
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setFieldTouched({ ...fieldTouched, email: true })
    const emailValidation = validateEmail(email)
    setEmailError(emailValidation)
    
    if (emailValidation) {
      return
    }

    setError('')
    setCheckingEmail(true)

    try {
      const response = await api.post('/api/auth/check-email', { 
        email: email.toLowerCase() 
      }, {
        timeout: 5000
      })
      
      if (response.data.exists) {
        navigate('/signin', { state: { email } })
      } else {
        setStep('password')
      }
    } catch (err) {
      setStep('password')
    } finally {
      setCheckingEmail(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Mark all fields as touched
    const allTouched = {
      fullName: true,
      password: true,
      confirmPassword: true,
      phone: true
    }
    setFieldTouched(allTouched)
    
    // Validate all fields
    const newErrors = {}
    const fullNameError = validateFullName(formData.fullName)
    const passwordError = validatePassword(formData.password)
    const phoneError = validatePhone(formData.phone)

    if (fullNameError) newErrors.fullName = fullNameError
    if (passwordError) newErrors.password = passwordError
    if (phoneError) newErrors.phone = phoneError

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setLoading(true)
    
    try {
      console.log('📤 Sending signup request...')
      const response = await api.post('/api/auth/signup', {
        email: email.toLowerCase(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        phone: formData.phone
      }, {
        timeout: 10000
      })
      console.log('✅ Signup response received:', response.data)
      
      if (response.data.success) {
        window.location.href = '/confirm-email?email=' + encodeURIComponent(email)
      }
    } catch (err) {
      // Log error for debugging
      console.error('❌ Signup error:', err)
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          baseURL: err.config?.baseURL,
          method: err.config?.method
        }
      })
      
      // Better error handling with specific messages
      if (err.response?.data?.message) {
        const errorMessage = err.response.data.message
        
        // Check for specific error types
        if (errorMessage.includes('email') || errorMessage.includes('Email')) {
          setError('This email is already registered. Please sign in instead.')
        } else if (errorMessage.includes('phone') || errorMessage.includes('Phone')) {
          setError('This phone number is already in use. Please use a different number.')
        } else if (errorMessage.includes('password') || errorMessage.includes('Password')) {
          setError('Password does not meet requirements. Please check the password requirements above.')
        } else if (errorMessage.includes('validation') || errorMessage.includes('Validation')) {
          setError('Please check all fields and ensure they meet the requirements.')
        } else {
          setError(errorMessage)
        }
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Request timed out. Please check your internet connection and try again.')
      } else if (err.message.includes('Network Error')) {
        setError('Network error. Please check your internet connection and try again.')
      } else {
        setError('An error occurred while creating your account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialAuth = (provider) => {
    alert(`${provider} authentication will be implemented`)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
    // Real-time validation only if field was touched
    if (fieldTouched[name]) {
      let validation = ''
      if (name === 'fullName') {
        validation = validateFullName(value)
      } else if (name === 'password') {
        validation = validatePassword(value)
      } else if (name === 'confirmPassword') {
        if (value && value !== formData.password) {
          validation = 'Passwords do not match'
        }
      }
      if (validation) {
        setErrors({ ...errors, [name]: validation })
      } else {
        const newErrors = { ...errors }
        delete newErrors[name]
        setErrors(newErrors)
      }
    }
  }

  const handleBlur = (fieldName) => {
    setFieldTouched({ ...fieldTouched, [fieldName]: true })
    
    // Validate on blur
    let validation = ''
    if (fieldName === 'fullName') {
      validation = validateFullName(formData.fullName)
    } else if (fieldName === 'password') {
      validation = validatePassword(formData.password)
    } else if (fieldName === 'confirmPassword') {
      if (formData.confirmPassword !== formData.password) {
        validation = 'Passwords do not match'
      }
    }
    
    if (validation) {
      setErrors({ ...errors, [fieldName]: validation })
    }
  }

  const handlePhoneChange = (e) => {
    const phoneValue = e.target.value
    setFormData({
      ...formData,
      phone: phoneValue
    })
    // Clear error when user types
    if (errors.phone) {
      setErrors({
        ...errors,
        phone: ''
      })
    }
    // Only validate if field was touched
    if (fieldTouched.phone) {
      const phoneError = validatePhone(phoneValue)
      if (phoneError) {
        setErrors({ ...errors, phone: phoneError })
      } else {
        const newErrors = { ...errors }
        delete newErrors.phone
        setErrors(newErrors)
      }
    }
  }

  const handlePhoneBlur = () => {
    setFieldTouched({ ...fieldTouched, phone: true })
    const phoneError = validatePhone(formData.phone)
    if (phoneError) {
      setErrors({ ...errors, phone: phoneError })
    } else {
      const newErrors = { ...errors }
      delete newErrors.phone
      setErrors(newErrors)
    }
  }

  useEffect(() => {
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current)
      }
    }
  }, [])

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
                  {siteSettings.site.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {siteSettings.site.name || 'XCrypto'}
            </span>
          </Link>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Create Account</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">Sign up to start trading today</p>

          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs sm:text-sm animate-fade-in">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <>
              {/* Email Input Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4 mb-4 sm:mb-6">
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      required
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                        emailError && fieldTouched.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } ${checkingEmail ? 'pr-10' : ''}`}
                      placeholder="Enter your email"
                      disabled={checkingEmail}
                    />
                    {checkingEmail && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  {emailError && fieldTouched.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 animate-fade-in">{emailError}</p>
                  )}
                  {checkingEmail && (
                    <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">Checking email...</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={checkingEmail || !!emailError || !email}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {checkingEmail ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Checking...
                    </span>
                  ) : 'Continue'}
                </button>
              </form>

              {/* Social Auth Buttons */}
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => handleSocialAuth('Google')}
                  className="w-full flex items-center justify-center space-x-2 sm:space-x-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
                <button
                  onClick={() => handleSocialAuth('Apple')}
                  className="w-full flex items-center justify-center space-x-2 sm:space-x-3 bg-black dark:bg-gray-900 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-800 dark:hover:bg-gray-800 transition shadow-sm transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span>Continue with Apple</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Password Form */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  Creating account for <span className="font-semibold text-indigo-600 dark:text-indigo-400 break-all">{email}</span>
                </p>
                <button
                  onClick={() => setStep('email')}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs sm:text-sm mt-1 font-medium"
                >
                  Change email
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('fullName')}
                    required
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                      errors.fullName && fieldTouched.fullName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && fieldTouched.fullName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 animate-fade-in">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Phone Number
                  </label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    error={errors.phone && fieldTouched.phone ? errors.phone : ''}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      required
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                        errors.password && fieldTouched.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && fieldTouched.password && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 animate-fade-in">{errors.password}</p>
                  )}
                  {!errors.password && formData.password && fieldTouched.password && (
                    <div className="mt-1.5 space-y-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Password requirements:</p>
                      <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-0.5 ml-3">
                        <li className={formData.password.length >= 6 ? 'text-green-600 dark:text-green-400' : ''}>
                          {formData.password.length >= 6 ? '✓' : '○'} At least 6 characters
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      required
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                        errors.confirmPassword && fieldTouched.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && fieldTouched.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 animate-fade-in">{errors.confirmPassword}</p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ Passwords match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : 'Create Account'}
                </button>
              </form>
            </>
          )}

          <p className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/signin" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold">
              Sign In
            </Link>
          </p>
        </div>

        <p className="mt-4 sm:mt-6 text-center text-xs text-gray-500 dark:text-gray-500 px-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
