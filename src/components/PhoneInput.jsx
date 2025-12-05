import { useState, useEffect } from 'react'
import PhoneInputLib from 'react-phone-number-input'
import { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

export default function PhoneInput({ value, onChange, onBlur, error, required, name = 'phone' }) {
  const [phoneValue, setPhoneValue] = useState(value || '')

  useEffect(() => {
    if (value !== phoneValue) {
      setPhoneValue(value || '')
    }
  }, [value])

  const handleChange = (val) => {
    if (!val) {
      setPhoneValue('')
      if (onChange) {
        onChange({ target: { name, value: '' } })
      }
      return
    }
    
    // Extract just digits to check length (E.164 format: max 15 digits)
    const digitsOnly = val.replace(/[^\d]/g, '')
    
    // Strict limit: maximum 15 digits total
    if (digitsOnly.length > 15) {
      // Truncate to 15 digits
      const truncated = val.substring(0, val.length - (digitsOnly.length - 15))
      setPhoneValue(truncated)
      if (onChange) {
        onChange({ target: { name, value: truncated } })
      }
      return
    }
    
    // Minimum check: at least country code + some digits
    if (digitsOnly.length > 0 && digitsOnly.length < 4) {
      // Too short, might be just country code
      setPhoneValue(val)
      if (onChange) {
        onChange({ target: { name, value: val } })
      }
      return
    }
    
    setPhoneValue(val)
    if (onChange) {
      onChange({ target: { name, value: val } })
    }
  }

  return (
    <div>
      <div className={`phone-input-wrapper ${error ? 'phone-input-error' : ''}`}>
        <PhoneInputLib
          international
          defaultCountry="US"
          value={phoneValue}
          onChange={handleChange}
          onBlur={onBlur}
          className="phone-input"
          limitMaxLength={true}
          numberInputProps={{
            className: 'phone-input-field',
            required: required
          }}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400 animate-fade-in">{error}</p>
      )}
    </div>
  )
}

// Export validation function
export { isValidPhoneNumber }
