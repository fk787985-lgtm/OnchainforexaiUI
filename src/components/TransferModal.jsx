import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useSiteSettings } from '../context/SiteSettingsContext'
import ModalShell from './common/ModalShell'
import { createTransfer, getRecentTransferRecipients, lookupTransferRecipient } from '../api/modules/transfersApi'
import ConfirmDialog from './ui/ConfirmDialog'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_UNIQUE_ID_LOOKUP_LENGTH = 6

export default function TransferModal({ isOpen, onClose, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [recentRecipients, setRecentRecipients] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [recentLoading, setRecentLoading] = useState(false)
  const [fee, setFee] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [step, setStep] = useState('search') // 'search' or 'confirm'
  const [requires2FA, setRequires2FA] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const { settings: siteSettings } = useSiteSettings()

  useEffect(() => {
    if (amount && siteSettings) {
      calculateFee()
    }
  }, [amount, siteSettings])

  useEffect(() => {
    if (!isOpen) return
    fetchRecentRecipients()
  }, [isOpen])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const query = searchQuery.trim()
      if (!query) {
        setUsers([])
        return
      }

      if (isLookupReady(query)) {
        lookupRecipient(query)
      } else {
        setUsers([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const isLookupReady = (query) => {
    if (!query) return false
    if (query.includes('@')) return EMAIL_REGEX.test(query)
    return query.length >= MIN_UNIQUE_ID_LOOKUP_LENGTH
  }

  const lookupRecipient = async (query) => {
    if (!isLookupReady(query)) return

    setSearching(true)
    try {
      const data = await lookupTransferRecipient(query)
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error looking up recipient:', error)
      toast.error('Failed to lookup recipient')
    } finally {
      setSearching(false)
    }
  }

  const fetchRecentRecipients = async () => {
    setRecentLoading(true)
    try {
      const data = await getRecentTransferRecipients()
      if (data.success) {
        setRecentRecipients(data.recipients || [])
      }
    } catch (error) {
      console.error('Error fetching recent recipients:', error)
      setRecentRecipients([])
    } finally {
      setRecentLoading(false)
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

  const processTransfer = async () => {
    const transferAmount = parseFloat(amount)
    setLoading(true)
    try {
      const data = await createTransfer({
        toUserId: selectedUser._id,
        amount: transferAmount,
        description: description.trim(),
        twoFactorCode: twoFactorCode || undefined
      })

      if (data.requires2FA) {
        setRequires2FA(true)
        setLoading(false)
        toast.error('2FA code is required to complete this transfer')
        return
      }

      if (data.success) {
        toast.success('Transfer completed successfully!')
        onSuccess?.()
        handleClose()
      }
    } catch (error) {
      console.error('Error creating transfer:', error)
      if (error.response?.data?.requires2FA) {
        setRequires2FA(true)
        setLoading(false)
        toast.error('2FA code is required to complete this transfer')
        return
      }
      toast.error(error.response?.data?.message || 'Failed to process transfer')
    } finally {
      setLoading(false)
      setShowConfirmDialog(false)
    }
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

    setShowConfirmDialog(true)
  }

  const handleClose = () => {
    setSearchQuery('')
    setUsers([])
    setRecentRecipients([])
    setSelectedUser(null)
    setAmount('')
    setDescription('')
    setTwoFactorCode('')
    setFee(0)
    setTotalAmount(0)
    setStep('search')
    setRequires2FA(false)
    setShowConfirmDialog(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
    <ModalShell
      title="Internal Transfer"
      onClose={handleClose}
      minHeightClassName="min-h-[500px] sm:min-h-[600px]"
      icon={(
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )}
    >
        {step === 'search' ? (
          <div className="p-6 space-y-5 flex-1 overflow-y-auto flex flex-col min-h-[400px]">
            {/* Search */}
            <div className="flex-shrink-0">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Recipient
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 transition text-base"
                placeholder="Enter full email or full user ID"
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
              {!searching && searchQuery.trim() && !isLookupReady(searchQuery.trim()) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Enter a complete email address or at least {MIN_UNIQUE_ID_LOOKUP_LENGTH} characters of full user ID.
                </p>
              )}
            </div>

            {/* User List */}
            <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto space-y-3 pr-1">
              {searchQuery.trim() && isLookupReady(searchQuery.trim()) && users.length > 0 ? (
                users.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition bg-white dark:bg-gray-800 shadow-sm hover:shadow-md"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">{user.fullName || user.username}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {user.email} {user.uniqueId && `• ID: ${user.uniqueId}`}
                    </div>
                  </button>
                ))
              ) : searchQuery.trim() && isLookupReady(searchQuery.trim()) && !searching ? (
                <div className="flex items-center justify-center h-full min-h-[250px]">
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">No users found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">No recipient with that exact email or user ID</p>
                  </div>
                </div>
              ) : !searchQuery.trim() && recentRecipients.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    Recent Recipients
                  </p>
                  <div className="space-y-3">
                    {recentRecipients.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleUserSelect(user)}
                        className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition bg-white dark:bg-gray-800 shadow-sm hover:shadow-md"
                      >
                        <div className="font-semibold text-gray-900 dark:text-white">{user.fullName || user.username}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {user.email} {user.uniqueId && `• ID: ${user.uniqueId}`}
                        </div>
                        {user.lastTransferAt && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Last sent: {new Date(user.lastTransferAt).toLocaleString()}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : !searchQuery.trim() ? (
                <div className="flex items-center justify-center h-full min-h-[250px]">
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto mb-4 text-indigo-400 dark:text-indigo-500 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {recentLoading ? 'Loading recent recipients...' : 'No recent recipients yet'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Use exact email or full user ID lookup</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="p-6 space-y-5 flex-1 overflow-y-auto flex flex-col min-h-[450px]">
            {/* Selected User Info */}
            <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 shadow-sm">
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wide flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Recipient
              </div>
              <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedUser.fullName || selectedUser.username}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedUser.email}</div>
              {selectedUser.uniqueId && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded inline-block">ID: {selectedUser.uniqueId}</div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Amount ({siteSettings?.site?.currency || 'USDT'})
              </label>
              <input
                type="number"
                step="0.01"
                min={siteSettings?.transfer?.minAmount || 0}
                max={siteSettings?.transfer?.maxAmount || 5000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 transition text-lg font-semibold"
                placeholder="0.00"
                required
              />
              {siteSettings?.transfer && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Min: {siteSettings.transfer.minAmount} {siteSettings.site.currency}</span>
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Max: {siteSettings.transfer.maxAmount} {siteSettings.site.currency}</span>
                </p>
              )}
            </div>

            {/* Fee Display */}
            {amount && fee > 0 && (
              <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Transfer Fee:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{fee.toFixed(2)} {siteSettings?.site?.currency || 'USDT'}</span>
                </div>
                <div className="flex justify-between items-center text-lg pt-3 border-t-2 border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300 font-bold">Total Amount:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xl">{totalAmount.toFixed(2)} {siteSettings?.site?.currency || 'USDT'}</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 transition resize-none"
                placeholder="Add a note..."
                rows="4"
              />
            </div>

            {/* 2FA Code Input */}
            {requires2FA && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                <label className="block text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  2FA Code *
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 border-2 border-amber-300 dark:border-amber-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-amber-500 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-4 mt-auto border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                type="button"
                onClick={() => setStep('search')}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.02] disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  '✓ Confirm Transfer'
                )}
              </button>
            </div>
          </form>
        )}
    </ModalShell>
    <ConfirmDialog
      isOpen={showConfirmDialog}
      title="Confirm Internal Transfer"
      description={`You are sending ${totalAmount.toFixed(2)} ${siteSettings?.site?.currency || 'USDT'} (including fee) to ${selectedUser?.fullName || selectedUser?.email}. Please confirm this secure transfer.`}
      confirmText={loading ? 'Processing...' : 'Confirm Transfer'}
      cancelText="Review Again"
      variant="warning"
      onCancel={() => setShowConfirmDialog(false)}
      onConfirm={processTransfer}
    />
    </>
  )
}

