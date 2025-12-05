import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'

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

  useEffect(() => {
    if (isOpen) {
      fetchCoins()
      fetchSettings()
    }
  }, [isOpen])

  useEffect(() => {
    if (amount && selectedCoin && settings) {
      calculateFee()
    }
  }, [amount, selectedCoin, settings])

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
      const response = await api.get('/api/withdrawals/settings')
      if (response.data.success) {
        setSettings({ withdrawal: response.data.settings.withdrawal })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedCoin || !amount || !walletAddress) {
      toast.error('Please fill in all fields')
      return
    }

    const withdrawalAmount = parseFloat(amount)
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!settings) {
      toast.error('Settings not loaded. Please try again.')
      return
    }

    const withdrawalSettings = settings.withdrawal

    if (withdrawalAmount < withdrawalSettings.minAmount) {
      toast.error(`Minimum withdrawal amount is ${withdrawalSettings.minAmount} USDT`)
      return
    }

    if (withdrawalAmount > withdrawalSettings.maxAmount) {
      toast.error(`Maximum withdrawal amount is ${withdrawalSettings.maxAmount} USDT`)
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/withdrawals/create', {
        coinId: selectedCoin._id,
        coinSymbol: selectedCoin.symbol,
        amount: withdrawalAmount,
        walletAddress: walletAddress.trim(),
        network
      })

      if (response.data.success) {
        toast.success('Withdrawal request submitted successfully!')
        onSuccess?.()
        handleClose()
        // Navigate to withdrawal detail page
        navigate(`/withdrawal/${response.data.withdrawal._id}`)
      }
    } catch (error) {
      console.error('Error creating withdrawal:', error)
      toast.error(error.response?.data?.message || 'Failed to create withdrawal request')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedCoin(null)
    setAmount('')
    setWalletAddress('')
    setNetwork('onchain')
    setFee(0)
    setTotalAmount(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-500 to-red-600 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Withdraw Funds</h3>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
              min={settings?.withdrawal?.minAmount || 0}
              max={settings?.withdrawal?.maxAmount || 10000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-gray-900 dark:text-white text-lg font-semibold"
              placeholder="0.00"
              required
            />
            {settings && (
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
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? 'Submitting...' : 'Submit Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

