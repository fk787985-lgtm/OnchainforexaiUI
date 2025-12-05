import { useState, useEffect } from 'react'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import { useSiteSettings } from '../context/SiteSettingsContext'

export default function TransferModal({ isOpen, onClose, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [fee, setFee] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [step, setStep] = useState('search') // 'search' or 'confirm'
  const [requires2FA, setRequires2FA] = useState(false)
  const { settings: siteSettings } = useSiteSettings()

  useEffect(() => {
    if (amount && siteSettings) {
      calculateFee()
    }
  }, [amount, siteSettings])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers()
      } else {
        setUsers([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const searchUsers = async () => {
    if (searchQuery.length < 2) return

    setSearching(true)
    try {
      const response = await api.get(`/api/transfers/search?query=${encodeURIComponent(searchQuery)}`)
      if (response.data.success) {
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setSearching(false)
    }
  }

  const calculateFee = () => {
    if (!siteSettings?.transfer || !amount) {
      setFee(0)
      setTotalAmount(0)
      return
    }

    const transferAmount = parseFloat(amount) || 0
    const transferSettings = siteSettings.transfer

    let calculatedFee = 0
    if (transferSettings.feeType === 'percentage') {
      calculatedFee = (transferAmount * transferSettings.fee) / 100
    } else {
      calculatedFee = transferSettings.fee
    }

    setFee(calculatedFee)
    setTotalAmount(transferAmount + calculatedFee)
  }

  const handleUserSelect = (user) => {
    setSelectedUser(user)
    setStep('confirm')
  }

  const handleConfirm = async (e) => {
    e.preventDefault()

    if (!selectedUser || !amount) {
      toast.error('Please fill in all fields')
      return
    }

    const transferAmount = parseFloat(amount)
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!siteSettings?.transfer) {
      toast.error('Settings not loaded. Please try again.')
      return
    }

    const transferSettings = siteSettings.transfer
    const currency = siteSettings.site?.currency || 'USDT'

    if (transferAmount < transferSettings.minAmount) {
      toast.error(`Minimum transfer amount is ${transferSettings.minAmount} ${currency}`)
      return
    }

    if (transferAmount > transferSettings.maxAmount) {
      toast.error(`Maximum transfer amount is ${transferSettings.maxAmount} ${currency}`)
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/transfers/create', {
        toUserId: selectedUser._id,
        amount: transferAmount,
        description: description.trim(),
        twoFactorCode: twoFactorCode || undefined
      })

      // Check if 2FA is required
      if (response.data.requires2FA) {
        setRequires2FA(true)
        setLoading(false)
        toast.error('2FA code is required to complete this transfer')
        return
      }

      if (response.data.success) {
        toast.success('Transfer completed successfully!')
        onSuccess?.()
        handleClose()
      }
    } catch (error) {
      console.error('Error creating transfer:', error)
      
      // Check if 2FA is required
      if (error.response?.data?.requires2FA) {
        setRequires2FA(true)
        setLoading(false)
        toast.error('2FA code is required to complete this transfer')
        return
      }
      
      toast.error(error.response?.data?.message || 'Failed to process transfer')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setUsers([])
    setSelectedUser(null)
    setAmount('')
    setDescription('')
    setTwoFactorCode('')
    setFee(0)
    setTotalAmount(0)
    setStep('search')
    setRequires2FA(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Internal Transfer</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {step === 'search' ? (
          <div className="p-6 space-y-5">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Search User</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900 dark:text-white"
                placeholder="Search by username, email, or ID..."
              />
              {searching && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </p>
              )}
            </div>

            {/* User List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {users.length > 0 ? (
                users.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition bg-white dark:bg-gray-700"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">{user.fullName || user.username}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {user.email} {user.uniqueId && `• ID: ${user.uniqueId}`}
                    </div>
                  </button>
                ))
              ) : searchQuery.length >= 2 && !searching ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No users found</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="p-6 space-y-5">
            {/* Selected User Info */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wide">Recipient</div>
              <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedUser.fullName || selectedUser.username}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedUser.email}</div>
              {selectedUser.uniqueId && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono">ID: {selectedUser.uniqueId}</div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Amount ({siteSettings?.site?.currency || 'USDT'})</label>
              <input
                type="number"
                step="0.01"
                min={siteSettings?.transfer?.minAmount || 0}
                max={siteSettings?.transfer?.maxAmount || 5000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900 dark:text-white text-lg font-semibold"
                placeholder="0.00"
                required
              />
              {siteSettings?.transfer && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Min: {siteSettings.transfer.minAmount} {siteSettings.site.currency} | Max: {siteSettings.transfer.maxAmount} {siteSettings.site.currency}
                </p>
              )}
            </div>

            {/* Fee Display */}
            {amount && fee > 0 && (
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Transfer Fee:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{fee.toFixed(2)} {siteSettings?.site?.currency || 'USDT'}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">Total Amount:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalAmount.toFixed(2)} {siteSettings?.site?.currency || 'USDT'}</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900 dark:text-white resize-none"
                placeholder="Add a note..."
                rows="3"
              />
            </div>

            {/* 2FA Code Input */}
            {requires2FA && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">2FA Code *</label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest font-mono text-gray-900 dark:text-white"
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('search')}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition shadow-md hover:shadow-lg"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? 'Processing...' : 'Confirm Transfer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

