import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import ModalShell from './common/ModalShell'
import { createWithdrawal, getWithdrawalSettings } from '../api/modules/withdrawalsApi'
import ConfirmDialog from './ui/ConfirmDialog'

export default function WithdrawalModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate()
  const [coins, setCoins] = useState([])
  const [selectedCoin, setSelectedCoin] = useState(null)
  const [amount, setAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [network, setNetwork] = useState('onchain')
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState(null)
  const [fee, setFee] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [amountError, setAmountError] = useState('')
  const [eligibilityChecking, setEligibilityChecking] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const checkWithdrawalEligibility = async () => {
    setEligibilityChecking(true)
    try {
      // Fetch latest user data and KYC status
      const [userResponse, kycResponse] = await Promise.all([
        api.get('/api/auth/me'),
        api.get('/api/kyc/status')
      ])

      if (userResponse.data.success && kycResponse.data.success) {
        const user = userResponse.data.user
        const kyc = kycResponse.data

        // Check if user is allowed to withdraw
        if (!user.allowWithdraw) {
          toast.error('Withdrawals are not allowed for your account. Please contact support.')
          onClose()
          return
        }

        // Check if user account is verified
        if (!kyc.isVerified || kyc.kyc?.status !== 'approved') {
          toast.error('Your account must be verified before you can withdraw. Please complete KYC verification.', {
            duration: 5000
          })
          onClose()
          navigate('/kyc/verify')
          return
        }
      }
    } catch (error) {
      console.error('Error checking withdrawal eligibility:', error)
      toast.error('Unable to verify withdrawal eligibility. Please try again.')
      onClose()
    } finally {
      setEligibilityChecking(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      checkWithdrawalEligibility()
      fetchCoins()
      fetchSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (amount && selectedCoin && settings) {
      calculateFee()
      validateAmount()
    } else {
      setAmountError('')
    }
  }, [amount, selectedCoin, settings])

  const validateAmount = () => {
    if (!amount || !selectedCoin) {
      setAmountError('')
      return
    }

    const withdrawalAmount = parseFloat(amount)
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setAmountError('Amount must be greater than 0')
      return
    }

    // Use coin-specific limits if available, otherwise fall back to platform settings
    const minAmount = selectedCoin.minWithdraw || settings?.withdrawal?.minAmount || 0
    const maxAmount = selectedCoin.maxWithdraw || settings?.withdrawal?.maxAmount || 10000

    if (withdrawalAmount < minAmount) {
      setAmountError(`Minimum withdrawal amount is ${minAmount} USDT`)
      return
    }

    if (withdrawalAmount > maxAmount) {
      setAmountError(`Maximum withdrawal amount is ${maxAmount} USDT`)
      return
    }

    setAmountError('')
  }

  const fetchCoins = async () => {
    try {
      const response = await api.get('/api/coins')
      if (response.data.success) {
        setCoins(response.data.coins.filter(coin => coin.isActive))
      }
    } catch (error) {
      console.error('Error fetching coins:', error)
      toast.error('Failed to fetch coins')
    }
  }

  const fetchSettings = async () => {
    try {
      const data = await getWithdrawalSettings()
      if (data.success) {
        setSettings({ withdrawal: data.settings.withdrawal })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const calculateFee = () => {
    if (!settings || !amount) {
      setFee(0)
      setTotalAmount(0)
      return
    }

    const withdrawalAmount = parseFloat(amount) || 0
    const withdrawalSettings = settings.withdrawal

    let calculatedFee = 0
    if (withdrawalSettings.feeType === 'percentage') {
      calculatedFee = (withdrawalAmount * withdrawalSettings.fee) / 100
    } else {
      calculatedFee = withdrawalSettings.fee
    }

    setFee(calculatedFee)
    setTotalAmount(withdrawalAmount + calculatedFee)
  }

  const validateWithdrawalForm = () => {
    if (!selectedCoin || !amount || !walletAddress) {
      toast.error('Please fill in all fields')
      return false
    }
    if (amountError) {
      toast.error(amountError)
      return false
    }
    const withdrawalAmount = parseFloat(amount)
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast.error('Please enter a valid amount')
      return false
    }
    if (!settings) {
      toast.error('Settings not loaded. Please try again.')
      return false
    }
    if (walletAddress.trim().length < 10) {
      toast.error('Please enter a valid wallet address')
      return false
    }
    const minAmount = selectedCoin.minWithdraw || settings.withdrawal.minAmount || 0
    const maxAmount = selectedCoin.maxWithdraw || settings.withdrawal.maxAmount || 10000
    if (withdrawalAmount < minAmount) {
      toast.error(`Minimum withdrawal amount is ${minAmount} USDT`)
      return false
    }
    if (withdrawalAmount > maxAmount) {
      toast.error(`Maximum withdrawal amount is ${maxAmount} USDT`)
      return false
    }
    return true
  }

  const processWithdrawal = async () => {
    const withdrawalAmount = parseFloat(amount)
    setLoading(true)
    try {
      const data = await createWithdrawal({
        coinId: selectedCoin._id,
        coinSymbol: selectedCoin.symbol,
        amount: withdrawalAmount,
        walletAddress: walletAddress.trim(),
        network
      })

      if (data.success) {
        toast.success('Withdrawal request submitted successfully!')
        onSuccess?.()
        handleClose()
        // Navigate to withdrawal detail page
        navigate(`/withdrawal/${data.withdrawal._id}`)
      }
    } catch (error) {
      console.error('Error creating withdrawal:', error)
      toast.error(error.response?.data?.message || 'Failed to create withdrawal request')
    } finally {
      setLoading(false)
      setShowConfirmDialog(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    if (!validateWithdrawalForm()) return
    setShowConfirmDialog(true)
  }

  const handleClose = () => {
    if (loading) return
    setSelectedCoin(null)
    setAmount('')
    setWalletAddress('')
    setNetwork('onchain')
    setFee(0)
    setTotalAmount(0)
    setAmountError('')
    setShowConfirmDialog(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
    <ModalShell
      title="Withdraw Funds"
      onClose={handleClose}
      headerClassName="from-red-500 to-red-600"
      overlayClassName="bg-black/60 dark:bg-black/80 backdrop-blur-sm"
      icon={(
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      )}
    >
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {eligibilityChecking && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
              Checking withdrawal eligibility...
            </div>
          )}
          {/* Coin Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Coin</label>
            <select
              value={selectedCoin?._id || ''}
              onChange={(e) => {
                const coin = coins.find(c => c._id === e.target.value)
                setSelectedCoin(coin)
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-gray-900 dark:text-white"
              required
            >
              <option value="">Select a coin</option>
              {coins.map((coin) => (
                <option key={coin._id} value={coin._id}>
                  {coin.symbol} - {coin.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Amount (USDT)</label>
            <input
              type="number"
              step="0.01"
              min={selectedCoin?.minWithdraw || settings?.withdrawal?.minAmount || 0}
              max={selectedCoin?.maxWithdraw || settings?.withdrawal?.maxAmount || 10000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 transition text-gray-900 dark:text-white text-lg font-semibold ${
                amountError
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 dark:border-gray-600 focus:ring-red-500 focus:border-red-500'
              }`}
              placeholder="0.00"
              required
            />
            {amountError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                {amountError}
              </p>
            )}
            {!amountError && selectedCoin && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Min: {selectedCoin.minWithdraw || settings?.withdrawal?.minAmount || 0} USDT | Max: {selectedCoin.maxWithdraw || settings?.withdrawal?.maxAmount || 10000} USDT
              </p>
            )}
            {!amountError && !selectedCoin && settings && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Min: {settings.withdrawal.minAmount} USDT | Max: {settings.withdrawal.maxAmount} USDT
              </p>
            )}
          </div>

          {/* Fee Display */}
          {amount && fee > 0 && (
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Withdrawal Fee:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{fee.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">Total Deducted:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{totalAmount.toFixed(2)} USDT</span>
              </div>
            </div>
          )}

          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Wallet Address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition font-mono text-sm text-gray-900 dark:text-white"
              minLength={10}
              placeholder="Enter your wallet address"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">⚠️ Double-check the address before submitting</p>
          </div>

          {/* Network */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-gray-900 dark:text-white"
            >
              <option value="onchain">Onchain</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition shadow-md hover:shadow-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || eligibilityChecking || !!amountError}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? 'Submitting...' : 'Submit Withdrawal'}
            </button>
          </div>
        </form>
    </ModalShell>
    <ConfirmDialog
      isOpen={showConfirmDialog}
      title="Confirm Withdrawal Request"
      description={`You are requesting ${amount || '0'} ${selectedCoin?.symbol || ''} withdrawal to wallet ${walletAddress || '-'} with a total deduction of ${totalAmount.toFixed(2)} USDT.`}
      confirmText={loading ? 'Submitting...' : 'Submit Withdrawal'}
      cancelText="Review Again"
      variant="warning"
      onCancel={() => setShowConfirmDialog(false)}
      onConfirm={processWithdrawal}
    />
    </>
  )
}

