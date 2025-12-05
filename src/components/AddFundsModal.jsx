import { useState, useEffect } from 'react'
import api from '../utils/axios'
import { useTheme } from '../context/ThemeContext'
import { QRCodeSVG } from 'qrcode.react'

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
  const { theme } = useTheme()

  useEffect(() => {
    if (isOpen) {
      fetchCoins()
      if (selectedCoin) {
        setSelectedPaymentCoin(selectedCoin)
      }
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

  const fetchCoins = async () => {
    try {
      const response = await api.get('/api/coins')
      if (response.data.success) {
        // Priority order: BTC, ETH, USDT, then ERC20 tokens, then others
        const prioritySymbols = ['BTC', 'ETH', 'USDT']
        const erc20Symbols = ['USDC', 'DAI', 'LINK', 'UNI', 'AAVE', 'WBTC', 'WETH']
        
        const sortedCoins = response.data.coins
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
        setCoins(sortedCoins)
      }
    } catch (error) {
      console.error('Error fetching coins:', error)
    }
  }

  const topCoins = coins.slice(0, 5)
  const filteredCoins = coins.filter(coin =>
    coin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:max-w-2xl sm:max-h-[90vh] sm:h-auto flex flex-col overflow-hidden">
        {/* Header - Compact */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-bold">Add Funds</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 h-full flex flex-col overflow-hidden">
          {step === 'select' ? (
            <>
              {/* Search */}
              <div className="mb-4 sm:mb-6 flex-shrink-0">
                <input
                  type="text"
                  placeholder="Search coins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
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
                        className="p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition text-left"
                      >
                        <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                          {coin.image ? (
                            <img
                              src={coin.image.startsWith('http') ? coin.image : `${import.meta.env.VITE_API_URL || 'https://api.onchainforexai.com'}${coin.image}`}
                              alt={coin.symbol}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-xs font-bold">{coin.symbol.charAt(0)}</span>
                            </div>
                          )}
                          <div className="text-center w-full">
                            <div className="font-semibold text-xs sm:text-sm truncate">{coin.symbol}</div>
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
                        className="w-full p-2.5 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          {coin.image ? (
                            <img
                              src={coin.image.startsWith('http') ? coin.image : `${import.meta.env.VITE_API_URL || 'https://api.onchainforexai.com'}${coin.image}`}
                              alt={coin.symbol}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold">{coin.symbol.charAt(0)}</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs sm:text-sm truncate">{coin.symbol}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{coin.name}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-xs sm:text-sm font-semibold">${coin.price.toFixed(2)}</div>
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
              {/* Coin Address and QR Code Display - Mobile Responsive & Compact */}
              <div className="space-y-3 sm:space-y-4 h-full flex flex-col overflow-y-auto">
                {/* Coin Info - Compact */}
                <div className="flex-shrink-0 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {selectedPaymentCoin.image ? (
                      <img
                        src={selectedPaymentCoin.image.startsWith('http') ? selectedPaymentCoin.image : `${import.meta.env.VITE_API_URL || 'https://api.onchainforexai.com'}${selectedPaymentCoin.image}`}
                        alt={selectedPaymentCoin.symbol}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm sm:text-base font-bold">{selectedPaymentCoin.symbol.charAt(0)}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm sm:text-base truncate">{selectedPaymentCoin.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{selectedPaymentCoin.symbol}</div>
                    </div>
                  </div>
                </div>

                {/* Deposit Limits Info - Compact */}
                {(selectedPaymentCoin.minDeposit > 0 || selectedPaymentCoin.maxDeposit > 0) && (
                  <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex-shrink-0">
                    <div className="text-xs font-semibold mb-1">Deposit Limits:</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-0.5">
                      {selectedPaymentCoin.minDeposit > 0 && (
                        <span>Min: {selectedPaymentCoin.minDeposit} USDT</span>
                      )}
                      {selectedPaymentCoin.maxDeposit > 0 && (
                        <span>Max: {selectedPaymentCoin.maxDeposit} USDT</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Wallet Address - Mobile Responsive & Compact */}
                <div className="flex-shrink-0">
                  <label className="block text-xs font-medium mb-1.5">Send {selectedPaymentCoin.symbol} to this address:</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <input
                      type="text"
                      readOnly
                      value={selectedPaymentCoin.address}
                      className="flex-1 bg-transparent border-none outline-none text-xs font-mono break-all px-1 py-1"
                    />
                    <button
                      onClick={handleCopyAddress}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex-shrink-0 flex items-center justify-center space-x-1"
                      title="Copy address"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">Copy</span>
                    </button>
                  </div>
                </div>

                {/* QR Code - Mobile Responsive & Compact */}
                <div className="flex flex-col items-center space-y-1.5 sm:space-y-2 flex-shrink-0">
                  <div className="text-xs font-medium">Scan QR Code</div>
                  <div className="p-2 bg-white rounded-lg border-2 border-gray-200 dark:border-gray-600">
                    <div className="w-[160px] h-[160px] sm:w-[180px] sm:h-[180px]">
                      <QRCodeSVG
                        value={selectedPaymentCoin.address}
                        size={200}
                        level="H"
                        includeMargin={true}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs px-2">
                    Scan with your wallet app
                  </p>
                </div>

                {/* Instructions - Mobile Responsive & Compact */}
                <div className="p-2.5 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 flex-shrink-0">
                  <div className="text-xs font-semibold mb-1">⚠️ Important:</div>
                  <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-0.5 list-disc list-inside">
                    <li>Only send {selectedPaymentCoin.symbol} to this address</li>
                    <li>Double-check the address before sending</li>
                    <li>Deposits may take a few minutes to confirm</li>
                    {selectedPaymentCoin.minDeposit > 0 && (
                      <li>Minimum: {selectedPaymentCoin.minDeposit} USDT</li>
                    )}
                  </ul>
                </div>

                {/* Back Button - Mobile Responsive */}
                <div className="pt-2 flex-shrink-0">
                  <button
                    onClick={() => setStep('select')}
                    className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-lg font-semibold text-sm transition"
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
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center space-x-3 mb-2">
                    {selectedPaymentCoin.image ? (
                      <img
                        src={selectedPaymentCoin.image.startsWith('http') ? selectedPaymentCoin.image : `${import.meta.env.VITE_API_URL || 'https://api.onchainforexai.com'}${selectedPaymentCoin.image}`}
                        alt={selectedPaymentCoin.symbol}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-lg font-bold">{selectedPaymentCoin.symbol.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-lg">{selectedPaymentCoin.symbol}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedPaymentCoin.name}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('select')}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Change coin
                  </button>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount (USDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={usdtAmount}
                    onChange={(e) => setUsdtAmount(e.target.value)}
                    placeholder="Enter amount in USDT"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum: 1 USDT
                  </p>
                </div>

                {usdtAmount && parseFloat(usdtAmount) > 0 && selectedPaymentCoin && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">You will pay approximately:</div>
                    <div className="text-xl font-bold">
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
                    className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
                  >
                    {processing ? 'Creating Payment...' : 'Continue to Payment'}
                  </button>
                  <button
                    onClick={() => setStep('select')}
                    className="px-6 py-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
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
                  <h4 className="text-lg font-bold mb-2">Complete Your Payment</h4>
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
                  <div className="text-sm font-semibold mb-1">Payment Status:</div>
                  <div className="text-lg font-bold capitalize">{paymentStatus}</div>
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
                            className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition text-lg"
                          >
                            → Go to NOWPayments Checkout
                          </button>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-left">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment URL:</div>
                          <div className="text-xs font-mono break-all text-gray-700 dark:text-gray-300">
                            {paymentUrl}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Payment ID: {paymentData.paymentId || paymentData.payment_id}
                        </div>
                        {(paymentData.payAmount || paymentData.pay_amount) && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Amount: {paymentData.payAmount || paymentData.pay_amount} {(paymentData.payCurrency || paymentData.pay_currency || '').toUpperCase()}
                          </div>
                        )}
                      </div>
                    )
                  } else {
                    return (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                          ⚠️ Payment URL not available
                        </div>
                        <div className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                          Please check the browser console (F12) for payment details.
                        </div>
                        <details className="text-xs text-yellow-600 dark:text-yellow-400">
                          <summary className="cursor-pointer">View Payment Data</summary>
                          <pre className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded overflow-auto">
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
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
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

