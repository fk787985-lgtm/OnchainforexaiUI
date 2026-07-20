import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../utils/axios'
import { useTheme } from '../context/ThemeContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import PhoneInput, { isValidPhoneNumber } from '../components/PhoneInput'
import GoogleAuthButton from '../components/GoogleAuthButton'
import AuthFancyShell from '../components/AuthFancyShell'

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

  // Only update the field while typing — do not advance until Continue is clicked
  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    setError('')
    if (fieldTouched.email) {
      setEmailError(validateEmail(value))
    } else {
      setEmailError('')
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

  const handleGoogleSuccess = () => {
    navigate('/dashboard')
  }

  const handleGoogleNeedsProfile = () => {
    navigate('/auth/complete-profile')
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

  return (
    <AuthFancyShell
      siteName={siteSettings.site.name || 'XCrypto'}
      logo={siteSettings.site.logo}
      title="Start your trading journey"
      subtitle="Create an account in minutes and access crypto markets worldwide."
    >
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1 sm:mb-2">Create Account</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">Sign up to start trading crypto today</p>

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
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-[#0c1524] border rounded-xl text-sm sm:text-base text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1199fa]/40 focus:border-[#1199fa] transition ${
                        emailError && fieldTouched.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
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
                  disabled={checkingEmail || !email.trim()}
                  className="fx-btn fx-btn-primary fx-btn-block"
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

              {/* Google Auth — existing users login; first-time asks name + phone */}
              <div className="relative my-4 sm:my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="auth-divider-label px-3 sm:px-4 text-gray-500 dark:text-slate-400">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <GoogleAuthButton
                  onSuccess={handleGoogleSuccess}
                  onRequiresProfile={handleGoogleNeedsProfile}
                  onError={(msg) => setError(msg)}
                  label="Continue with Google"
                />
              </div>
            </>
          ) : (
            <>
              {/* Password Form */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-[#0c1524]/90 rounded-xl border border-blue-100 dark:border-[#2d3f5c] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300">
                  Creating account for <span className="font-semibold text-[#2da8ff] break-all">{email}</span>
                </p>
                <button
                  onClick={() => setStep('email')}
                  className="text-[#1199fa] hover:text-blue-400 text-xs sm:text-sm mt-1 font-medium"
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
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-[#0c1524] border rounded-xl text-sm sm:text-base text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1199fa]/40 focus:border-[#1199fa] transition ${
                      errors.fullName && fieldTouched.fullName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
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
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 bg-slate-50 dark:bg-[#0c1524] border rounded-xl text-sm sm:text-base text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1199fa]/40 focus:border-[#1199fa] transition ${
                        errors.password && fieldTouched.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
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
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 bg-slate-50 dark:bg-[#0c1524] border rounded-xl text-sm sm:text-base text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1199fa]/40 focus:border-[#1199fa] transition ${
                        errors.confirmPassword && fieldTouched.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
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
                  className="fx-btn fx-btn-primary fx-btn-block"
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
            <Link to="/signin" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold">
              Sign In
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
    </AuthFancyShell>
  )
}
