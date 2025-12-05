import { useState } from 'react'

export default function PasswordInput({ value, onChange, onBlur, placeholder, required, className = '', id, name, error }) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const isAdminInput = className.includes('admin-input')

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center ${
        isFocused 
          ? isAdminInput 
            ? 'ring-2 ring-purple-400/50' 
            : 'ring-2 ring-indigo-500/50'
          : ''
      } rounded-lg transition-all duration-200`}>
        {/* Lock Icon */}
        <div className={`absolute left-4 flex items-center ${
          isAdminInput 
            ? 'text-purple-300/70' 
            : 'text-gray-400 dark:text-gray-500'
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Password Input */}
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false)
            if (onBlur) onBlur(e)
          }}
          onFocus={() => setIsFocused(true)}
          required={required}
          placeholder={placeholder || "Enter your password"}
          className={`w-full pl-12 pr-12 py-3.5 text-sm sm:text-base font-medium transition-all duration-200 ${
            isAdminInput
              ? 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/15'
              : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-700'
          } ${
            error 
              ? isAdminInput
                ? 'border-red-400/50 focus:border-red-400/70 focus:ring-red-400/30'
                : 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/30'
              : ''
          } rounded-lg shadow-sm`}
        />

        {/* Show/Hide Password Toggle */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`absolute right-3 flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
            isAdminInput
              ? 'text-purple-200 hover:text-purple-100 hover:bg-white/10 active:bg-white/15'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isAdminInput ? 'focus:ring-purple-400/50' : 'focus:ring-indigo-500'
          }`}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Password Strength Indicator (optional, can be added later) */}
      {value && value.length > 0 && !error && (
        <div className="mt-2 flex items-center space-x-1">
          <div className={`h-1 flex-1 rounded-full ${
            value.length < 6 
              ? 'bg-red-300 dark:bg-red-700' 
              : value.length < 10 
                ? 'bg-yellow-300 dark:bg-yellow-700' 
                : 'bg-green-300 dark:bg-green-700'
          }`}></div>
        </div>
      )}
    </div>
  )
}
