import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import api from '../utils/axios'

export default function OrderDetail() {
  const navigate = useNavigate()
  const { tradeId } = useParams()
  const location = useLocation()
  const { theme } = useTheme()
  const tradeFromState = location.state?.trade
  
  const [trade, setTrade] = useState(tradeFromState || null)
  const [loading, setLoading] = useState(!tradeFromState)
  
  // Poll for trade completion if trade is still pending
  const pollForTradeCompletion = () => {
    if (!tradeId) return
    
    const maxPolls = 10 // Poll up to 10 times (10 seconds)
    let pollCount = 0
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/api/trades/${tradeId}`)
        if (response.data.success) {
          const fetchedTrade = response.data.trade
          
          // Update trade if status changed to closed with result
          if (fetchedTrade.status === 'closed' && (fetchedTrade.result === 'win' || fetchedTrade.result === 'loss')) {
            setTrade(fetchedTrade)
            clearInterval(pollInterval)
            return
          }
          
          pollCount++
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Error polling trade status:', error)
        clearInterval(pollInterval)
      }
    }, 1000) // Poll every 1 second
    
    return pollInterval // Return interval for cleanup if needed
  }

  const fetchTradeDetail = async () => {
    if (!tradeId) return
    
    try {
      setLoading(true)
      const response = await api.get(`/api/trades/${tradeId}`)
      if (response.data.success) {
        const fetchedTrade = response.data.trade
        setTrade(fetchedTrade)
        setLoading(false)
        
        // If trade is still pending/open, poll for updates until it's completed
        if (fetchedTrade.status === 'open' || fetchedTrade.result === 'pending') {
          pollForTradeCompletion()
        }
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching trade detail:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tradeId) {
      // Always fetch latest trade data to ensure it's up to date (even if passed from state)
      fetchTradeDetail()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Trade not found</div>
      </div>
    )
  }

  const isWin = trade.result === 'win'
  const isPending = trade.status === 'open' || trade.result === 'pending'
  const profitLoss = trade.profit || 0
  const profitPercent = isWin ? (trade.profitPercent || 0) : (trade.lossPercent || 0)

  const formatPrice = (price) => {
    if (!price) return '0.00'
    return parseFloat(price).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }

  const formatDateTime = (date) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Order Detail</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">EN</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Status Badge and Symbol */}
        <div className="flex items-center justify-between mb-4">
          <button className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition ${
            isPending 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}>
            {isPending ? 'PENDING' : 'FILLED 100%'}
          </button>
          <div className="text-gray-900 dark:text-white font-semibold text-base">{trade.symbol} / USDT</div>
        </div>

        {/* Order Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Order No</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs">{trade._id?.slice(-24) || 'N/A'}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Type</span>
            <span className={`font-semibold ${trade.side === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              Market / {trade.side === 'buy' ? 'BUY' : 'SELL'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Trade Amount</span>
            <span className="text-gray-900 dark:text-white font-semibold">${formatPrice(trade.marginUsed || trade.amount)} USDT</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Avg. / Price</span>
            <span className="text-gray-900 dark:text-white font-semibold">
              {formatPrice(trade.entryPrice)} / {formatPrice(trade.exitPrice || trade.entryPrice)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Create Time</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {formatDateTime(trade.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Update Time</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {formatDateTime(trade.closedAt || trade.createdAt)}
            </span>
          </div>
        </div>

        {/* Trade Details Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-900 dark:text-white font-bold mb-4 uppercase text-sm tracking-wide">TRADE DETAILS</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Date</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatDate(trade.closedAt || trade.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Open Price</span>
              <span className="text-gray-900 dark:text-white font-semibold">{formatPrice(trade.entryPrice)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Close Price</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {trade.exitPrice ? formatPrice(trade.exitPrice) : '---'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Trade Amount</span>
              <span className="text-gray-900 dark:text-white font-semibold">${formatPrice(trade.marginUsed || trade.amount)} USDT</span>
            </div>

            {/* Result - Highlighted with Red Glow */}
            {!isPending && (
              <>
                <div className={`flex items-center justify-between text-sm p-3 rounded-lg ${
                  isWin 
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50' 
                    : 'bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-600/60 shadow-lg shadow-red-200/50 dark:shadow-red-900/50'
                }`}>
                  <span className="text-gray-700 dark:text-gray-300">Result</span>
                  <span className={`font-bold ${isWin ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isWin ? 'Win' : 'Loss'}
                  </span>
                </div>

                {/* Profit / Loss - Highlighted with Red Glow */}
                <div className={`flex items-center justify-between text-sm p-3 rounded-lg ${
                  isWin 
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50' 
                    : 'bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-600/60 shadow-lg shadow-red-200/50 dark:shadow-red-900/50'
                }`}>
                  <span className="text-gray-700 dark:text-gray-300">Profit / Loss</span>
                  <span className={`font-bold ${isWin ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {profitLoss >= 0 ? '+' : ''}{formatPrice(profitLoss)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-30 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { name: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', route: '/dashboard' },
            { name: 'Market', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', route: '/market' },
            { name: 'Trade', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', route: '/trade' },
            { name: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', route: '/history' },
            { name: 'Asset', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/asset' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => item.route && navigate(item.route)}
              className={`flex flex-col items-center space-y-1 px-2 py-1.5 rounded-lg transition flex-1 ${
                location.pathname === item.route || (item.route === '/history' && location.pathname.startsWith('/order'))
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

