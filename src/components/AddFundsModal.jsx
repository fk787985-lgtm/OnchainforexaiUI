import { useState, useEffect, useMemo, useRef } from 'react'
import api from '../utils/axios'
import { useTheme } from '../context/ThemeContext'
import { QRCodeSVG } from 'qrcode.react'
import { API_URL } from '../utils/apiUrl.js'
import toast from 'react-hot-toast'

// Module-level cache for coins (persists across component unmounts)
let coinsCache = null
let coinsCacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function AddFundsModal({ isOpen, onClose, selectedCoin, onSuccess }) {
  const [coins, setCoins] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPaymentCoin, setSelectedPaymentCoin] = useState(selectedCoin || null)
  const [usdtAmount, setUsdtAmount] = useState('')
  const [step, setStep] = useState('select') // 'select', 'address', 'amount', or 'payment'
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('waiting')
  const [statusCheckInterval, setStatusCheckInterval] = useState(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [submittingDeposit, setSubmittingDeposit] = useState(false)
  const { theme } = useTheme()
  const isFetchingRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      // Load coins immediately (from cache if available)
      loadCoins()
      if (selectedCoin) {
        setSelectedPaymentCoin(selectedCoin)
      }
      // Reset form fields when modal opens
      setDepositAmount('')
      setScreenshot(null)
      setScreenshotPreview(null)
    }
  }, [isOpen, selectedCoin])

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
      }
    }
  }, [statusCheckInterval])

  // Sort and filter coins function (memoized)
  const sortAndFilterCoins = (coinsData) => {
    // Priority order: BTC, ETH, USDT, then ERC20 tokens, then others
    const prioritySymbols = ['BTC', 'ETH', 'USDT']
    const erc20Symbols = ['USDC', 'DAI', 'LINK', 'UNI', 'AAVE', 'WBTC', 'WETH']
    
    return coinsData
      .filter(coin => coin.isActive)
      .sort((a, b) => {
        // First priority: BTC, ETH, USDT
        const aPriority = prioritySymbols.indexOf(a.symbol)
        const bPriority = prioritySymbols.indexOf(b.symbol)
        if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority
        if (aPriority !== -1) return -1
        if (bPriority !== -1) return 1
        
        // Second priority: ERC20 tokens
        const aErc20 = erc20Symbols.indexOf(a.symbol)
        const bErc20 = erc20Symbols.indexOf(b.symbol)
        if (aErc20 !== -1 && bErc20 !== -1) return aErc20 - bErc20
        if (aErc20 !== -1) return -1
        if (bErc20 !== -1) return 1
        
        // Then by rank (higher rank first)
        return (b.rank || 999) - (a.rank || 999)
      })
  }

  const loadCoins = async () => {
    // Check if cache is valid
    const now = Date.now()
    const isCacheValid = coinsCache && coinsCacheTimestamp && (now - coinsCacheTimestamp < CACHE_DURATION)
    
    // If cache is valid, use it immediately
    if (isCacheValid) {
      console.log('✅ Using cached coins data')
      setCoins(coinsCache)
      
      // Optionally refresh in background (don't wait for it)
      if (!isFetchingRef.current) {
        fetchCoins(true) // Background refresh
      }
      return
    }
    
    // Cache is invalid or doesn't exist, fetch fresh data
    await fetchCoins(false)
  }

  const fetchCoins = async (background = false) => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return
    }
    
    isFetchingRef.current = true
    if (!background) {
      setLoading(true)
    }
    
    try {
      const response = await api.get('/api/coins')
      if (response.data.success) {
        const sortedCoins = sortAndFilterCoins(response.data.coins)
        
        // Update cache
        coinsCache = sortedCoins
        coinsCacheTimestamp = Date.now()
        
        // Update state
        setCoins(sortedCoins)
        
        console.log(`✅ ${background ? 'Background ' : ''}Fetched ${sortedCoins.length} coins`)
      }
    } catch (error) {
      console.error('Error fetching coins:', error)
      // If fetch fails but we have cache, keep using cache
      if (coinsCache) {
        console.log('⚠️ Using stale cache due to fetch error')
        setCoins(coinsCache)
      }
    } finally {
      isFetchingRef.current = false
      if (!background) {
        setLoading(false)
      }
    }
  }

  // Memoize filtered coins to avoid recalculating on every render
  const { topCoins, filteredCoins } = useMemo(() => {
    const top = coins.slice(0, 5)
    const filtered = coins.filter(coin =>
      coin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return { topCoins: top, filteredCoins: filtered }
  }, [coins, searchQuery])

  const handleCoinSelect = (coin) => {
    // Check if coin has address configured
    if (!coin.address || coin.address.trim() === '') {
      alert(`Wallet address not configured for ${coin.name}. Please contact admin.`)
      return
    }
    setSelectedPaymentCoin(coin)
    setStep('address') // Show address and QR code instead of amount input
  }

  const handleCopyAddress = () => {
    if (selectedPaymentCoin?.address) {
      navigator.clipboard.writeText(selectedPaymentCoin.address).then(() => {
        alert('Address copied to clipboard!')
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = selectedPaymentCoin.address
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Address copied to clipboard!')
      })
    }
  }

  const handleSubmitDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) < 1) {
      toast.error('Please enter a valid amount (minimum 1 USDT)')
      return
    }

    setSubmittingDeposit(true)
    try {
      const formData = new FormData()
      formData.append('amount', parseFloat(depositAmount))
      formData.append('coinId', selectedPaymentCoin._id || selectedPaymentCoin.id)
      formData.append('coinSymbol', selectedPaymentCoin.symbol)
      if (screenshot) {
        formData.append('screenshot', screenshot)
      }

      const response = await api.post('/api/deposits/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        toast.success('Deposit request submitted successfully! Waiting for admin approval.')
        // Reset form
        setDepositAmount('')
        setScreenshot(null)
        setScreenshotPreview(null)
        if (document.getElementById('screenshot-upload')) {
          document.getElementById('screenshot-upload').value = ''
        }
        // Close modal and refresh
        if (onSuccess) onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error submitting deposit:', error)
      toast.error(error.response?.data?.message || 'Failed to submit deposit request')
    } finally {
      setSubmittingDeposit(false)
    }
  }

  const handleCreatePayment = async () => {
    if (!selectedPaymentCoin || !usdtAmount || parseFloat(usdtAmount) <= 0) {
      alert('Please enter a valid USDT amount')
      return
    }

    setProcessing(true)
    try {
      const response = await api.post('/api/deposits/create', {
        coinId: selectedPaymentCoin._id || selectedPaymentCoin.id,
        coinSymbol: selectedPaymentCoin.symbol,
        usdtAmount: parseFloat(usdtAmount)
      })

      if (response.data.success) {
        const payment = response.data.payment
        console.log('Full payment response:', response.data)
        console.log('Payment object:', payment)
        setPaymentData(payment)
        setPaymentStatus(payment.paymentStatus || payment.payment_status || 'waiting')
        setStep('payment')
        
        // Automatically redirect to NOWPayments checkout page
        // Check all possible field names for payment URL
        const paymentUrl = payment.payUrl || payment.pay_url || payment.invoiceUrl || payment.invoice_url || 
                          payment.paymentUrl || payment.payment_url || payment.checkoutUrl || payment.checkout_url ||
                          payment.url || payment.link || payment.checkout_link
        
        console.log('Payment URL check:', {
          payUrl: payment.payUrl,
          pay_url: payment.pay_url,
          invoiceUrl: payment.invoiceUrl,
          invoice_url: payment.invoice_url,
          paymentUrl: payment.paymentUrl,
          found: paymentUrl,
          fullPayment: payment
        })
        
        if (paymentUrl) {
          console.log('Found payment URL, automatically redirecting to NOWPayments:', paymentUrl)
          // Automatically redirect to NOWPayments checkout page immediately
          // The NOWPayments page will automatically show:
          // - QR code (barcode) for the payment
          // - Amount to pay
          // - Coin selected
          // All values are already included in the payment URL
          window.location.href = paymentUrl
          return // Exit early - user is being redirected
        } else {
          console.error('No payment URL found! Full payment object:', payment)
          toast.error('Payment URL not found. Please check the payment details below.')
        }
        
        // Start checking payment status
        const interval = setInterval(async () => {
          try {
            const statusResponse = await api.get(`/api/deposits/status/${payment.paymentId || payment.payment_id}`)
            if (statusResponse.data.success) {
              const status = statusResponse.data.payment.payment_status
              setPaymentStatus(status)
              
              if (status === 'confirmed' || status === 'finished') {
                clearInterval(interval)
                alert('Payment confirmed! Your balance has been updated.')
                onSuccess?.()
                setTimeout(() => {
                  handleClose()
                }, 2000)
              }
            }
          } catch (error) {
            console.error('Error checking payment status:', error)
          }
        }, 5000) // Check every 5 seconds
        
        setStatusCheckInterval(interval)
      } else {
        alert(response.data.message || 'Error creating payment')
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      alert(error.response?.data?.message || 'Error creating payment. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleCheckStatus = async () => {
    if (!paymentData?.paymentId) return
    
    try {
      const response = await api.get(`/api/deposits/status/${paymentData.paymentId}`)
      if (response.data.success) {
        const status = response.data.payment.payment_status
        setPaymentStatus(status)
        
        if (status === 'confirmed' || status === 'finished') {
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval)
          }
          alert('Payment confirmed! Your balance has been updated.')
          onSuccess?.()
          setTimeout(() => {
            handleClose()
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
  }

  const handleClose = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval)
    }
    setStep('select')
    setSelectedPaymentCoin(null)
    setUsdtAmount('')
    setPaymentData(null)
    setPaymentStatus('waiting')
    setSearchQuery('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg"
        onClick={handleClose}
      />
      
      {/* Modal Card - Dark/Light Theme */}
      <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:max-w-2xl sm:max-h-[90vh] sm:h-auto flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header - Gradient Background */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-t-none sm:rounded-t-2xl flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">Add Funds</h3>
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

        {/* Content */}
        <div className="p-4 sm:p-6 h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900">
          {step === 'select' ? (
            <>
              {/* Loading indicator (only show if initial load, not background refresh) */}
              {loading && coins.length === 0 && (
                <div className="mb-4 flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Loading coins...</span>
                </div>
              )}
              
              {/* Search */}
              <div className="mb-4 sm:mb-6 flex-shrink-0">
                <input
                  type="text"
                  placeholder="Search coins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-sm sm:text-base"
                />
              </div>

              {/* Top Coins - Compact */}
              {topCoins.length > 0 && (
                <div className="mb-4 sm:mb-6 flex-shrink-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">Top Coins</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                    {topCoins.map((coin) => (
                      <button
                        key={coin._id || coin.id}
                        onClick={() => handleCoinSelect(coin)}
                        className="p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-green-500 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition text-left"
                      >
                        <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                          {coin.image ? (
                            <img
                              src={coin.image.startsWith('http') ? coin.image : `${API_URL}${coin.image}`}
                              alt={coin.symbol}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{coin.symbol.charAt(0)}</span>
                            </div>
                          )}
                          <div className="text-center w-full">
                            <div className="font-semibold text-xs sm:text-sm truncate text-gray-900 dark:text-white">{coin.symbol}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">${coin.price.toFixed(2)}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Coins List - Scrollable */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 flex-shrink-0">
                  All Coins {filteredCoins.length > 0 && `(${filteredCoins.length})`}
                </h4>
                <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 pr-1">
                  {filteredCoins.length > 0 ? (
                    filteredCoins.map((coin) => (
                      <button
                        key={coin._id || coin.id}
                        onClick={() => handleCoinSelect(coin)}
                        className="w-full p-2.5 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-green-500 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          {coin.image ? (
                            <img
                              src={coin.image.startsWith('http') ? coin.image : `${API_URL}${coin.image}`}
                              alt={coin.symbol}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">{coin.symbol.charAt(0)}</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs sm:text-sm truncate text-gray-900 dark:text-white">{coin.symbol}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{coin.name}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">${coin.price.toFixed(2)}</div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No coins found
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : step === 'address' && selectedPaymentCoin ? (
            <>
              {/* Coin Address and QR Code Display - Reorganized for Better UX */}
              <div className="space-y-4 sm:space-y-5 h-full flex flex-col overflow-y-auto">
                {/* Coin Info Header */}
                <div className="flex-shrink-0 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedPaymentCoin.image ? (
                        <img
                          src={selectedPaymentCoin.image.startsWith('http') ? selectedPaymentCoin.image : `${API_URL}${selectedPaymentCoin.image}`}
                          alt={selectedPaymentCoin.symbol}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-300">{selectedPaymentCoin.symbol.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">{selectedPaymentCoin.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{selectedPaymentCoin.symbol}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setStep('select')}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Deposit Limits Info */}
                {(selectedPaymentCoin.minDeposit > 0 || selectedPaymentCoin.maxDeposit > 0) && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex-shrink-0">
                    <div className="text-xs font-semibold mb-1.5 text-blue-900 dark:text-blue-200">💡 Deposit Limits</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 flex flex-wrap gap-x-4 gap-y-1">
                      {selectedPaymentCoin.minDeposit > 0 && (
                        <span>Minimum: {selectedPaymentCoin.minDeposit} USDT</span>
                      )}
                      {selectedPaymentCoin.maxDeposit > 0 && (
                        <span>Maximum: {selectedPaymentCoin.maxDeposit} USDT</span>
                      )}
                    </div>
                  </div>
                )}

                {/* QR Code - Prominent Display */}
                <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Scan QR Code to Deposit</div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px]">
                      <QRCodeSVG
                        value={selectedPaymentCoin.address}
                        size={240}
                        level="H"
                        includeMargin={true}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                    Scan with your wallet app
                  </p>
                </div>

                {/* Wallet Address - Copy Button at End */}
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Wallet Address
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <input
                      type="text"
                      readOnly
                      value={selectedPaymentCoin.address}
                      className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm font-mono break-all text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleCopyAddress}
                      className="p-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white rounded-lg transition flex-shrink-0"
                      title="Copy address"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Amount (USDT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount in USDT"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-base"
                  />
                  {selectedPaymentCoin.minDeposit > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      Minimum: {selectedPaymentCoin.minDeposit} USDT
                    </p>
                  )}
                </div>

                {/* Screenshot Upload */}
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Payment Screenshot <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          setScreenshot(file)
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setScreenshotPreview(reader.result)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label
                      htmlFor="screenshot-upload"
                      className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-green-500 dark:hover:border-green-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <svg className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {screenshot ? screenshot.name : 'Click to upload screenshot'}
                      </span>
                    </label>
                    {screenshotPreview && (
                      <div className="relative mt-2">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-48 object-contain bg-gray-50 dark:bg-gray-800"
                        />
                        <button
                          onClick={() => {
                            setScreenshot(null)
                            setScreenshotPreview(null)
                            document.getElementById('screenshot-upload').value = ''
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                          title="Remove screenshot"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Important Instructions */}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 flex-shrink-0">
                  <div className="text-xs font-semibold mb-1.5 text-amber-900 dark:text-amber-200 flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Important Notes
                  </div>
                  <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
                    <li>Only send <strong>{selectedPaymentCoin.symbol}</strong> to this address</li>
                    <li>Double-check the address before sending</li>
                    <li>Your deposit will be reviewed by admin after submission</li>
                    <li>Processing may take a few minutes</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex-shrink-0 space-y-2.5">
                  <button
                    onClick={handleSubmitDeposit}
                    disabled={submittingDeposit || !depositAmount || parseFloat(depositAmount) < 1}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-base transition shadow-md hover:shadow-lg"
                  >
                    {submittingDeposit ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Deposit Request'
                    )}
                  </button>
                  <button
                    onClick={() => setStep('select')}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition"
                  >
                    ← Back to Coin Selection
                  </button>
                </div>
              </div>
            </>
          ) : step === 'amount' ? (
            <>
              {/* Selected Coin Info */}
              {selectedPaymentCoin && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3 mb-2">
                    {selectedPaymentCoin.image ? (
                      <img
                        src={selectedPaymentCoin.image.startsWith('http') ? selectedPaymentCoin.image : `${API_URL}${selectedPaymentCoin.image}`}
                        alt={selectedPaymentCoin.symbol}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{selectedPaymentCoin.symbol.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedPaymentCoin.symbol}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedPaymentCoin.name}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('select')}
                    className="text-sm text-green-600 dark:text-green-400 hover:underline"
                  >
                    Change coin
                  </button>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Amount (USDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={usdtAmount}
                    onChange={(e) => setUsdtAmount(e.target.value)}
                    placeholder="Enter amount in USDT"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-lg"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum: 1 USDT
                  </p>
                </div>

                {usdtAmount && parseFloat(usdtAmount) > 0 && selectedPaymentCoin && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">You will pay approximately:</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {(parseFloat(usdtAmount) / (selectedPaymentCoin.price || 1)).toFixed(8)} {selectedPaymentCoin.symbol}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Rate: 1 {selectedPaymentCoin.symbol} = ${selectedPaymentCoin.price.toFixed(2)} USDT
                    </div>
                  </div>
                )}

                <div className="pt-4 flex space-x-4">
                  <button
                    onClick={handleCreatePayment}
                    disabled={processing || !usdtAmount || parseFloat(usdtAmount) < 1}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
                  >
                    {processing ? 'Creating Payment...' : 'Continue to Payment'}
                  </button>
                  <button
                    onClick={() => setStep('select')}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                </div>
              </div>
            </>
          ) : step === 'payment' && paymentData ? (
            <>
              {/* Payment Processing Screen */}
              <div className="text-center space-y-6">
                <div>
                  <h4 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Complete Your Payment</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pay {(paymentData.payAmount || paymentData.pay_amount || '0')} {(paymentData.payCurrency || paymentData.pay_currency || '').toUpperCase()} to complete your deposit
                  </p>
                </div>

                {/* Payment Status */}
                <div className={`p-4 rounded-lg ${
                  paymentStatus === 'confirmed' || paymentStatus === 'finished' 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : paymentStatus === 'waiting' || paymentStatus === 'waiting'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}>
                  <div className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">Payment Status:</div>
                  <div className="text-lg font-bold capitalize text-gray-900 dark:text-white">{paymentStatus}</div>
                </div>

                {/* Payment URL/QR Code */}
                {(() => {
                  const paymentUrl = paymentData.payUrl || paymentData.pay_url || paymentData.invoiceUrl || paymentData.invoice_url
                  if (paymentUrl) {
                    return (
                      <div className="space-y-4">
                        <div>
                          <button
                            onClick={() => {
                              // Try to open in new tab, fallback to same window if blocked
                              const newWindow = window.open(paymentUrl, '_blank', 'noopener,noreferrer')
                              if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                                // Popup blocked, redirect in same window
                                if (window.confirm('Popup blocked. Redirect to payment page in this window?')) {
                                  window.location.href = paymentUrl
                                }
                              }
                            }}
                            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white rounded-lg font-semibold transition text-lg"
                          >
                            → Go to NOWPayments Checkout
                          </button>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-left">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment URL:</div>
                          <div className="text-xs font-mono break-all text-gray-900 dark:text-white">
                            {paymentUrl}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Payment ID: {paymentData.paymentId || paymentData.payment_id}
                        </div>
                        {(paymentData.payAmount || paymentData.pay_amount) && (
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            Amount: {paymentData.payAmount || paymentData.pay_amount} {(paymentData.payCurrency || paymentData.pay_currency || '').toUpperCase()}
                          </div>
                        )}
                      </div>
                    )
                  } else {
                    return (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                          ⚠️ Payment URL not available
                        </div>
                        <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                          Please check the browser console (F12) for payment details.
                        </div>
                        <details className="text-xs text-amber-600 dark:text-amber-400">
                          <summary className="cursor-pointer text-amber-800 dark:text-amber-200">View Payment Data</summary>
                          <pre className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/40 rounded overflow-auto text-gray-900 dark:text-white border border-amber-200 dark:border-amber-800">
                            {JSON.stringify(paymentData, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )
                  }
                })()}

                {/* Manual Check Button */}
                <button
                  onClick={handleCheckStatus}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm transition"
                >
                  Check Payment Status
                </button>

                <div className="pt-4">
                  <button
                    onClick={() => setStep('amount')}
                    className="text-sm text-green-600 dark:text-green-400 hover:underline"
                  >
                    ← Back to Amount
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

