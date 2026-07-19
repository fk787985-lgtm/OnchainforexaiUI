import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import PhoneInput, { isValidPhoneNumber } from '../components/PhoneInput'
import toast from 'react-hot-toast'
import ThemeToggle from '../components/ThemeToggle'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { getImageUrl } from '../utils/imageUrl.js'

export default function GoogleCompleteProfile() {
  const navigate = useNavigate()
  const { settings: siteSettings } = useSiteSettings()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin', { replace: true })
      return
    }
    // If profile already complete, go to dashboard
    ;(async () => {
      try {
        const { data } = await api.get('/api/auth/me')
        if (data.success && data.user?.profileComplete !== false) {
          navigate('/dashboard', { replace: true })
        } else if (data.user?.fullName) {
          setFullName(data.user.fullName)
        }
      } catch {
        /* stay on form */
      }
    })()
  }, [navigate])

  const validate = () => {
    const next = {}
    const name = fullName.trim()
    if (!name || name.length < 2) next.fullName = 'Full name is required (min 2 characters)'
    else if (!/^[a-zA-Z\s'.-]+$/.test(name)) {
      next.fullName = 'Use letters and spaces only'
    }
    if (!phone) next.phone = 'Phone number is required'
    else if (!phone.startsWith('+')) next.phone = 'Include country code (e.g. +1)'
    else {
      try {
        if (!isValidPhoneNumber(phone)) next.phone = 'Enter a valid phone number'
      } catch {
        const digits = phone.replace(/\D/g, '')
        if (digits.length < 8 || digits.length > 15) next.phone = 'Enter a valid phone number'
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/google/complete-profile', {
        fullName: fullName.trim(),
        phone
      })
      if (data.success) {
        toast.success('Profile complete — welcome!')
        navigate('/dashboard')
      } else {
        toast.error(data.message || 'Failed to save profile')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fx-page min-h-screen flex items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md fx-card p-6 sm:p-8 space-y-5">
        <div className="text-center">
          {siteSettings.site.logo ? (
            <img
              src={getImageUrl(siteSettings.site.logo)}
              alt=""
              className="w-12 h-12 mx-auto rounded-xl object-contain mb-3"
            />
          ) : null}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Complete your profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            One more step — add your full name and phone number to access the platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="fx-label">Full name *</label>
            <input
              className="fx-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
            {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
          </div>
          <div>
            <label className="fx-label">Phone number *</label>
            <PhoneInput
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }))
              }}
              error={errors.phone || ''}
              required
            />
            <p className="text-xs text-slate-500 mt-1">Include country code for SMS and verification.</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Continue to dashboard'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          <Link to="/signin" className="text-cyan-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
