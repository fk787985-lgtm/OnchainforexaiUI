import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'

export default function Enable2FA() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    check2FAStatus()
  }, [])

  const check2FAStatus = async () => {
    try {
      const response = await api.get('/api/auth/2fa/status')
      if (response.data.success) {
        setIsEnabled(response.data.enabled || false)
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error)
    }
  }

  const handleSetup2FA = async () => {
    setLoading(true)
    try {
      const response = await api.post('/api/auth/2fa/setup')
      if (response.data.success) {
        setQrCode(response.data.qrCode)
        setSecret(response.data.secret)
        toast.success('2FA setup initiated. Please scan the QR code and verify.')
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      toast.error(error.response?.data?.message || 'Failed to setup 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e) => {
    e.preventDefault()
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/auth/2fa/verify', {
        secret,
        code: verificationCode
      })
      if (response.data.success) {
        toast.success('2FA enabled successfully!')
        setIsEnabled(true)
        setQrCode(null)
        setSecret('')
        setVerificationCode('')
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error)
      toast.error(error.response?.data?.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/auth/2fa/disable')
      if (response.data.success) {
        toast.success('2FA disabled successfully')
        setIsEnabled(false)
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      toast.error(error.response?.data?.message || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Two-Factor Authentication</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {/* Status */}
          <div className={`p-4 rounded-lg ${isEnabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isEnabled ? 'bg-green-500' : 'bg-yellow-500'}`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isEnabled ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  )}
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">{isEnabled ? '2FA is Enabled' : '2FA is Disabled'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isEnabled ? 'Your account is protected with two-factor authentication' : 'Enable 2FA to add an extra layer of security'}
                </p>
              </div>
            </div>
          </div>

          {!isEnabled ? (
            <>
              {!qrCode ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">What is Two-Factor Authentication?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Two-factor authentication (2FA) adds an extra layer of security to your account. 
                      You'll need to enter a code from your authenticator app in addition to your password when logging in.
                    </p>
                  </div>
                  <button
                    onClick={handleSetup2FA}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Setting up...' : 'Enable 2FA'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Scan QR Code</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 flex justify-center">
                      {qrCode && <img src={qrCode} alt="QR Code" className="w-48 h-48" />}
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Or enter this code manually:</p>
                      <code className="text-sm font-mono text-gray-900 dark:text-white">{secret}</code>
                    </div>
                  </div>

                  <form onSubmit={handleVerify2FA} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Verification Code</label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-center text-2xl tracking-widest"
                        maxLength={6}
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Enter the 6-digit code from your authenticator app
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={handleDisable2FA}
              disabled={loading}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}



