import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { toast } from 'react-hot-toast'
import api from '../utils/axios'
import TradeOpeningModal from '../components/TradeOpeningModal'
import TradeDetailModal from '../components/TradeDetailModal'
import AnimatedPercentage from '../components/AnimatedPercentage'
import AnimatedProgressPercentage from '../components/AnimatedProgressPercentage'

export default function TradeDetail() {
  const navigate = useNavigate()
  const { type, symbol } = useParams()
  const location = useLocation()
  const item = location.state?.item || {}
  const { theme } = useTheme()
  const chartRef = useRef(null)
  
  const [orderType, setOrderType] = useState('limit')
  const [side, setSide] = useState('buy')
  const [price, setPrice] = useState(item.price || 0)
  const [amount, setAmount] = useState('')
  const [leverage, setLeverage] = useState(5)
  const [marginMode, setMarginMode] = useState('cross')
  const [timeInForce, setTimeInForce] = useState('GTC')
  const [reduceOnly, setReduceOnly] = useState(false)
  const [activeTab, setActiveTab] = useState('positions')
  const [tradeTimer, setTradeTimer] = useState(60) // Default 60 seconds
  const [tradeEndTime, setTradeEndTime] = useState(null)
  
  const [currentPrice, setCurrentPrice] = useState(item.price || 0)
  const [priceChange, setPriceChange] = useState(item.change24h || 0)
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] })
  const [availableBalance, setAvailableBalance] = useState(0)
  const [positions, setPositions] = useState([])
  const [openOrders, setOpenOrders] = useState([])
  const [tradeHistory, setTradeHistory] = useState([])
  const [chartVisible, setChartVisible] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const notifiedTradesRef = useRef(new Set()) // Track notified trades to prevent duplicates
  const [tradeOpeningModal, setTradeOpeningModal] = useState(null) // { tradeId, symbol, side, timer, endTime }
  const [selectedTradeDetail, setSelectedTradeDetail] = useState(null) // Selected trade for detail view
  const [historyScrollHeight, setHistoryScrollHeight] = useState(null) // Dynamic height for history tab
  const historyScrollRef = useRef(null)
  
  const displayName = type === 'forex' ? item.pair : item.name
  const displaySymbol = type === 'forex' ? item.pair : (item.symbol || symbol)
  
  // Get TradingView symbol format
  const getTradingViewSymbol = () => {
    if (type === 'crypto') {
      return `BINANCE:${displaySymbol}USDT`
    } else if (type === 'stocks') {
      return `NASDAQ:${displaySymbol}`
    } else if (type === 'forex') {
      return `FX:${displaySymbol.replace('/', '')}`
    }
    return `BINANCE:BTCUSDT` // fallback
  }

  useEffect(() => {
    // Initialize TradingView chart only when chart is visible
    if (chartVisible && chartRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (chartRef.current && !chartRef.current.querySelector('.tradingview-widget-container')) {
          // Clear previous chart
          chartRef.current.innerHTML = ''
          
          const container = document.createElement('div')
          container.className = 'tradingview-widget-container'
          const uniqueId = `tradingview_chart_${Date.now()}`
          container.id = uniqueId
          container.style.width = '100%'
          container.style.height = '100%'
          chartRef.current.appendChild(container)
          
          const script = document.createElement('script')
          script.type = 'text/javascript'
          script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
          script.async = true
          script.innerHTML = JSON.stringify({
            autosize: true,
            symbol: getTradingViewSymbol(),
            interval: '1',
            timezone: 'Etc/UTC',
            theme: theme === 'dark' ? 'dark' : 'light',
            style: '1',
            locale: 'en',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            gridColor: theme === 'dark' ? '#374151' : '#e5e7eb',
            width: '100%',
            height: '100%',
            hide_side_toolbar: false,
            allow_symbol_change: false,
            save_image: false,
            studies: [
              'Volume@tv-basicstudies',
              'RSI@tv-basicstudies'
            ],
            container_id: uniqueId
          })
          
          container.appendChild(script)
        }
      }, 100)
      
      return () => {
        clearTimeout(timer)
        if (chartRef.current) {
          chartRef.current.innerHTML = ''
        }
      }
    } else if (!chartVisible && chartRef.current) {
      // Clear chart when hidden
      chartRef.current.innerHTML = ''
    }
  }, [chartVisible, displaySymbol, theme])

  // Initialize price when currentPrice is available
  useEffect(() => {
    if (price <= 0 && currentPrice > 0) {
      setPrice(currentPrice)
    }
  }, [currentPrice])

  useEffect(() => {
    // Real-time price updates
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        if (prev <= 0) {
          // If currentPrice is 0, initialize from item.price
          return parseFloat(item.price) || 1000
        }
        const change = (Math.random() - 0.5) * 0.001 * prev
        return Math.max(0.01, prev + change)
      })
      generateOrderBook()
    }, 1000)
    
    generateOrderBook()
    
    return () => clearInterval(interval)
  }, [])

  // Trade timer countdown and closure monitoring
  useEffect(() => {
    if (!tradeEndTime && !tradeOpeningModal) return

    const timer = setInterval(() => {
      const now = new Date()
      
      // Update trade opening modal countdown
      if (tradeOpeningModal) {
        const remaining = Math.max(0, Math.floor((new Date(tradeOpeningModal.endTime) - now) / 1000))
        if (remaining <= 0) {
          // Timer ended - get trade ID and navigate to order detail
          const completedTradeId = tradeOpeningModal.tradeId
          setTradeOpeningModal(null)
          setTradeEndTime(null)
          setCountdown(null)
          
          // Wait longer for backend to process trade completion, then navigate to order detail
          // Try multiple times to ensure trade is completed before navigating
          const maxRetries = 5
          let retryCount = 0
          
          const checkAndNavigate = async () => {
            try {
              const historyRes = await api.get('/api/trades/history')
              if (historyRes.data.success) {
                const trades = historyRes.data.trades || []
                
                // Find the completed trade
                let completedTrade = null
                if (completedTradeId) {
                  completedTrade = trades.find(t => (t._id === completedTradeId || t.id === completedTradeId))
                }
                if (!completedTrade && trades.length > 0) {
                  completedTrade = trades.find(t => t.status === 'closed') || trades[0]
                }
                
                // Check if trade is actually completed (not just found)
                if (completedTrade && completedTrade.status === 'closed') {
                  // Trade is completed, navigate to order detail
                  const tradeIdToNavigate = completedTrade._id || completedTrade.id || completedTradeId
                  if (tradeIdToNavigate) {
                    navigate(`/order/${tradeIdToNavigate}`, { state: { trade: completedTrade } })
                    return true // Successfully navigated
                  }
                } else if (retryCount < maxRetries) {
                  // Trade not completed yet, retry after delay
                  retryCount++
                  setTimeout(checkAndNavigate, 1000) // Wait 1 second and try again
                  return false
                }
              }
              
              // If we get here and haven't navigated yet, navigate anyway (will auto-refresh on OrderDetail page)
              if (completedTradeId) {
                navigate(`/order/${completedTradeId}`)
                return true
              } else {
                navigate('/history')
                return true
              }
            } catch (error) {
              console.error('Error checking trade completion:', error)
              // Navigate to order detail with stored tradeId if available (will auto-refresh)
              if (completedTradeId) {
                navigate(`/order/${completedTradeId}`)
                return true
              } else {
                navigate('/history')
                return true
              }
            }
          }
          
          // Start checking after initial delay
          setTimeout(checkAndNavigate, 1500) // Wait 1.5 seconds initially
        }
      }
      
      // Update regular countdown
      if (tradeEndTime) {
        const remaining = Math.max(0, Math.floor((tradeEndTime - now) / 1000))
        setCountdown(remaining)
        
        if (remaining <= 0) {
          setTradeEndTime(null)
          setCountdown(null)
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [tradeEndTime, tradeOpeningModal])

  // Monitor for closed trades and show notifications
  useEffect(() => {
    const checkClosedTrades = async () => {
      try {
        const historyRes = await api.get('/api/trades/history')
        if (historyRes.data.success) {
          const trades = historyRes.data.trades || []
          const recentTrades = trades.filter(trade => {
            if (!trade.closedAt || trade.status !== 'closed') return false
            const tradeId = trade._id || trade.id
            // Only show notification if we haven't notified about this trade yet
            if (notifiedTradesRef.current.has(tradeId)) return false
            
            const closedAt = new Date(trade.closedAt)
            const now = new Date()
            // Check if trade was closed in the last 5 seconds
            return (now - closedAt) < 5000
          })
          
          recentTrades.forEach(trade => {
            const tradeId = trade._id || trade.id
            notifiedTradesRef.current.add(tradeId) // Mark as notified
            
            const sideLabel = trade.side === 'buy' ? 'Long' : 'Short'
            const resultEmoji = trade.result === 'win' ? '🎉' : '📉'
            const profitColor = trade.result === 'win' ? 'text-green-400' : 'text-red-400'
            const profitSign = trade.result === 'win' ? '+' : '-'
            const profitValue = trade.result === 'win' ? (trade.profitPercent || 0) : (trade.lossPercent || 0)
            
            toast.success(
              (t) => (
                <div className="space-y-1">
                  <div className="font-semibold text-base">{resultEmoji} Trade Closed!</div>
                  <div className="text-sm opacity-90">
                    <div>{sideLabel.toUpperCase()} {trade.symbol}</div>
                    <div className={`mt-1 ${profitColor}`}>
                      {trade.result === 'win' ? 'Win' : 'Loss'}: {profitSign}{profitValue.toFixed(2)}%
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      Profit: ${trade.profit > 0 ? '+' : ''}{trade.profit.toFixed(2)} USDT
                    </div>
                  </div>
                </div>
              ),
              {
                duration: 5000,
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  border: trade.result === 'win' ? '1px solid #10b981' : '1px solid #ef4444',
                },
                onClick: () => {
                  const tradeIdToNavigate = trade._id || trade.id
                  if (tradeIdToNavigate) {
                    navigate(`/order/${tradeIdToNavigate}`, { state: { trade } })
                  } else {
                    navigate('/history')
                  }
                },
              }
            )
            
            // Navigate to order detail page after a short delay
            const tradeIdToNavigate = trade._id || trade.id
            setTimeout(() => {
              if (tradeIdToNavigate) {
                navigate(`/order/${tradeIdToNavigate}`, { state: { trade } })
              } else {
                navigate('/history')
              }
            }, 2000)
          })
        }
      } catch (error) {
        console.error('Error checking closed trades:', error)
      }
    }

    const interval = setInterval(checkClosedTrades, 2000) // Check every 2 seconds
    return () => clearInterval(interval)
  }, [])

  const generateOrderBook = () => {
    const basePrice = parseFloat(currentPrice) || parseFloat(item.price) || 1000
    if (isNaN(basePrice) || basePrice <= 0) {
      // If basePrice is invalid, use default
      const defaultPrice = 1000
      const bids = []
      const asks = []
      
      for (let i = 1; i <= 15; i++) {
        const bidPrice = defaultPrice - (i * 0.1)
        const bidAmount = Math.random() * 1000 + 100
        bids.push({
          price: bidPrice.toFixed(2),
          amount: bidAmount.toFixed(2),
          total: (bidPrice * bidAmount).toFixed(2)
        })
        
        const askPrice = defaultPrice + (i * 0.1)
        const askAmount = Math.random() * 1000 + 100
        asks.push({
          price: askPrice.toFixed(2),
          amount: askAmount.toFixed(2),
          total: (askPrice * askAmount).toFixed(2)
        })
      }
      
      setOrderBook({ bids: bids.reverse(), asks })
      return
    }
    
    const bids = []
    const asks = []
    
    for (let i = 1; i <= 15; i++) {
      const bidPrice = basePrice - (i * 0.1)
      const bidAmount = Math.random() * 1000 + 100
      bids.push({
        price: bidPrice.toFixed(2),
        amount: bidAmount.toFixed(2),
        total: (bidPrice * bidAmount).toFixed(2)
      })
      
      const askPrice = basePrice + (i * 0.1)
      const askAmount = Math.random() * 1000 + 100
      asks.push({
        price: askPrice.toFixed(2),
        amount: askAmount.toFixed(2),
        total: (askPrice * askAmount).toFixed(2)
      })
    }
    
    setOrderBook({ bids: bids.reverse(), asks })
  }

  const formatPrice = (price) => {
    if (!price) return '0.00'
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatChange = (change) => {
    if (change === null || change === undefined) return '0.00%'
    const numChange = typeof change === 'string' ? parseFloat(change) : change
    if (isNaN(numChange)) return '0.00%'
    const isPositive = numChange >= 0
    return (
      <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {isPositive ? '+' : ''}{numChange.toFixed(2)}%
      </span>
    )
  }

  const handlePriceAdjust = (direction) => {
    const step = currentPrice * 0.001
    setPrice(prev => {
      const newPrice = direction === 'up' ? prev + step : prev - step
      return Math.max(0.01, newPrice)
    })
  }

  const handleAmountAdjust = (direction) => {
    const step = 10 // Step in USDT
    setAmount(prev => {
      const numAmount = parseFloat(prev) || 0
      const newAmount = direction === 'up' ? numAmount + step : Math.max(0, numAmount - step)
      return newAmount.toFixed(2)
    })
  }

  const calculateMax = () => {
    // Max is now in USDT (user balance)
    return userBalance.toFixed(2)
  }

  const calculateCost = () => {
    // Cost is the USDT amount entered
    if (!amount) return '0.00'
    return parseFloat(amount).toFixed(2)
  }

  const calculateAssetAmount = () => {
    // Convert USDT amount to asset amount
    if (!amount || !currentPrice) return '0.00'
    const usdtAmount = parseFloat(amount) || 0
    const assetAmount = usdtAmount / currentPrice
    return assetAmount.toFixed(8)
  }

  const [userBalance, setUserBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch user balance
    const fetchUserBalance = async () => {
      try {
        const response = await api.get('/api/auth/me')
        if (response.data.success) {
          const balance = response.data.user.balance || 0
          setUserBalance(balance)
          setAvailableBalance(balance)
        }
      } catch (error) {
        console.error('Error fetching user balance:', error)
      }
    }
    
    const fetchTrades = async () => {
      try {
        const [positionsRes, historyRes] = await Promise.all([
          api.get('/api/trades/positions'),
          api.get('/api/trades/history')
        ])
        if (positionsRes.data.success) {
          setOpenOrders(positionsRes.data.positions || [])
        }
        if (historyRes.data.success) {
          setTradeHistory(historyRes.data.trades || [])
        }
      } catch (error) {
        console.error('Error fetching trades:', error)
      }
    }
    
    // Initial fetch
    fetchUserBalance()
    fetchTrades()
    
    // Refresh balance and trades every 2 seconds
    const interval = setInterval(() => {
      fetchUserBalance()
      fetchTrades()
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const handleOrder = async (tradeSide = null) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid USDT amount')
      return
    }

    // Use the side passed as parameter, or fall back to current state
    // This ensures the correct side is used even if setState hasn't completed
    const orderSide = tradeSide !== null && tradeSide !== undefined ? tradeSide : side

    // User enters amount in USDT - send it directly
    let usdtAmount = parseFloat(amount)
    
    // Get trade price - ensure it's a valid number
    let tradePrice
    if (orderType === 'limit') {
      // For limit orders, use price if set, otherwise fallback to currentPrice
      tradePrice = parseFloat(price) || parseFloat(currentPrice) || parseFloat(item.price) || 0
      if (!tradePrice || tradePrice <= 0 || isNaN(tradePrice)) {
        toast.error('Please enter a valid price for limit order or click BBO to use current price')
        return
      }
    } else {
      // Market order uses current price
      tradePrice = parseFloat(currentPrice) || parseFloat(item.price) || 0
      if (!tradePrice || tradePrice <= 0 || isNaN(tradePrice)) {
        toast.error('Current price is not available. Please try again.')
        return
      }
    }

    // Use a small tolerance for floating point comparison (0.01 USDT)
    if (usdtAmount > userBalance + 0.01) {
      toast.error(`Insufficient balance. Available: ${userBalance.toFixed(2)} USDT`)
      return
    }
    
    // Ensure we don't exceed balance due to rounding - cap at available balance
    usdtAmount = Math.min(usdtAmount, userBalance)

    if (usdtAmount <= 0 || isNaN(usdtAmount)) {
      toast.error('Invalid amount')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/trades/place', {
        symbol: displaySymbol,
        type: type || 'crypto',
        side: orderSide, // Use the side passed or current state
        orderType,
        price: tradePrice,
        amount: usdtAmount, // Send USDT amount directly - backend will use this as margin
        leverage,
        marginMode,
        timer: tradeTimer
      })

      if (response.data.success) {
        const { timer, status, entryPrice, symbol: tradeSymbol, side: tradeSide, amount: tradeAmount, marginUsed, leverage: tradeLeverage } = response.data.trade
        
        // Trade is now open, will close when timer ends
        // amount and marginUsed are the same (USDT amount user traded with)
        const tradeMarginAmount = marginUsed || tradeAmount
        
        if (status === 'open') {
          const endTime = new Date(Date.now() + timer * 1000)
          setTradeEndTime(endTime)
          setCountdown(timer)
          
          // Show modern trade opening modal
          // Use tradeSide from response (most accurate), fallback to orderSide
          setTradeOpeningModal({
            tradeId: response.data.trade.id,
            symbol: tradeSymbol || displaySymbol,
            side: tradeSide || orderSide || side,
            timer,
            endTime,
            entryPrice,
            amount: tradeMarginAmount, // USDT amount (margin)
            leverage: tradeLeverage
          })
          
          // Refresh open orders
          const positionsRes = await api.get('/api/trades/positions')
          if (positionsRes.data.success) {
            setOpenOrders(positionsRes.data.positions || [])
          }
          
          // Show simple toast notification
          toast.success('Trade opened successfully!', {
            duration: 2000,
            style: {
              background: '#1f2937',
              color: '#fff',
            },
          })
        }
        
        // Refresh actual balance from server (don't use estimated)
        const balanceRes = await api.get('/api/auth/me')
        if (balanceRes.data.success) {
          const actualBalance = balanceRes.data.user.balance || 0
          setUserBalance(actualBalance)
          setAvailableBalance(actualBalance)
        }
        
        // Reset form
        setAmount('')
      }
    } catch (error) {
      console.error('Error placing trade:', error)
      toast.error(error.response?.data?.message || 'Failed to place trade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pb-20 sm:pb-0">
      {/* Top Header Bar */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            <button
              onClick={() => navigate('/market')}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {/* Chart Icon Button - Top Left */}
            <button
              onClick={() => setChartVisible(!chartVisible)}
              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 ${
                chartVisible ? 'bg-indigo-100 dark:bg-indigo-900' : ''
              }`}
              title={chartVisible ? 'Hide Chart' : 'Show Chart'}
            >
              <svg className={`w-5 h-5 ${chartVisible ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold truncate">{displayName}</h1>
                <span className="text-xs text-gray-500 dark:text-gray-400">{displaySymbol}</span>
                {type === 'crypto' && <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Perp</span>}
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm flex-wrap">
                {formatChange(priceChange)}
                <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">Funding (8h) / Countdown</span>
                <span className="text-gray-700 dark:text-gray-300 text-xs">0.00229% / 00:58:42</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button className="p-1.5 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="p-1.5 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Trading Interface - All in row with managed sizes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Order Book - Compact on mobile */}
        <div className="w-28 sm:w-32 md:w-40 lg:w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-1.5 sm:p-2 md:p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <h3 className="text-xs sm:text-sm font-semibold hidden sm:block">Order Book</h3>
              <h3 className="text-xs font-semibold sm:hidden">Book</h3>
              <div className="flex items-center space-x-0.5 sm:space-x-1">
                <input
                  type="number"
                  defaultValue="0.1"
                  className="w-8 sm:w-10 md:w-12 px-0.5 sm:px-1 py-0.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                />
                <button className="p-0.5 sm:p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
              <div className="truncate">Price</div>
              <div className="text-right truncate">Amt</div>
              <div className="text-right truncate hidden sm:block">Total</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Asks (Sell Orders - Red) */}
            <div className="space-y-0">
              {orderBook.asks.slice(0, 8).map((ask, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 sm:gap-1 px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer"
                  onClick={() => setPrice(parseFloat(ask.price))}
                >
                  <span className="text-red-500 truncate">{parseFloat(ask.price).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</span>
                  <span className="text-right text-gray-600 dark:text-gray-400 truncate">{parseFloat(ask.amount).toFixed(1)}</span>
                  <span className="text-right text-gray-500 dark:text-gray-500 truncate hidden sm:block">{parseFloat(ask.total).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>

            {/* Current Price */}
            <div className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 border-y border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <div className="text-sm sm:text-base md:text-lg font-bold">{formatPrice(currentPrice)}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{formatChange(priceChange)}</div>
              </div>
            </div>

            {/* Bids (Buy Orders - Green) */}
            <div className="space-y-0">
              {orderBook.bids.slice(0, 8).map((bid, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 sm:gap-1 px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs hover:bg-green-50 dark:hover:bg-green-900/10 cursor-pointer"
                  onClick={() => setPrice(parseFloat(bid.price))}
                >
                  <span className="text-green-500 truncate">{parseFloat(bid.price).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</span>
                  <span className="text-right text-gray-600 dark:text-gray-400 truncate">{parseFloat(bid.amount).toFixed(1)}</span>
                  <span className="text-right text-gray-500 dark:text-gray-500 truncate hidden sm:block">{parseFloat(bid.total).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Volume Bar */}
          <div className="p-1.5 sm:p-2 md:p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex h-1 sm:h-1.5 rounded overflow-hidden mb-0.5 sm:mb-1">
              <div className="bg-green-500" style={{ width: '34.83%' }}></div>
              <div className="bg-red-500" style={{ width: '65.17%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              <span>35%</span>
              <span>65%</span>
            </div>
          </div>
        </div>


        {/* Right: Order Entry - Optimized and compact */}
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
          <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 space-y-1.5 sm:space-y-2 flex-shrink-0">
            {/* Margin Mode & Leverage */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMarginMode('cross')}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium ${
                  marginMode === 'cross'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Cross
              </button>
              <button
                onClick={() => setMarginMode('isolated')}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium ${
                  marginMode === 'isolated'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Isolated
              </button>
              <select
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="px-2 py-1.5 rounded text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
              >
                {[1, 2, 3, 5, 10, 20, 50, 100].map(lev => (
                  <option key={lev} value={lev}>{lev}x</option>
                ))}
              </select>
            </div>

            {/* Available Balance */}
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Available</span>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold">{userBalance.toFixed(2)} USDT</span>
                  <button className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Order Type - Compact */}
            <div className="flex space-x-1.5">
              <button
                onClick={() => setOrderType('limit')}
                className={`flex-1 py-1.5 rounded text-xs sm:text-sm font-medium ${
                  orderType === 'limit'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Limit
              </button>
              <button
                onClick={() => setOrderType('market')}
                className={`flex-1 py-1.5 rounded text-xs sm:text-sm font-medium ${
                  orderType === 'market'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Market
              </button>
            </div>

            {/* Price Input - Compact */}
            {orderType === 'limit' && (
              <div>
                <label className="block text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5">Price (USDT)</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePriceAdjust('down')}
                    className="px-1.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={price > 0 ? formatPrice(price) : (currentPrice > 0 ? formatPrice(currentPrice) : '')}
                    onChange={(e) => {
                      const newPrice = parseFloat(e.target.value) || 0
                      setPrice(newPrice > 0 ? newPrice : currentPrice || 0)
                    }}
                    onFocus={(e) => {
                      // If price is 0, set it to currentPrice when focused
                      if (price <= 0 && currentPrice > 0) {
                        setPrice(currentPrice)
                      }
                    }}
                    className="flex-1 px-2 py-1.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handlePriceAdjust('up')}
                    className="px-1.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setPrice(currentPrice > 0 ? currentPrice : parseFloat(item.price) || 0)}
                    className="px-2 py-1.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-[10px] sm:text-xs font-medium active:scale-95"
                  >
                    BBO
                  </button>
                </div>
              </div>
            )}

            {/* Amount Input - Compact (USDT) */}
            <div>
              <label className="block text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                Amount <span className="text-indigo-600 dark:text-indigo-400 font-semibold">(USDT)</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAmountAdjust('down')}
                  className="px-1.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95"
                >
                  -
                </button>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-2 py-1.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={() => handleAmountAdjust('up')}
                  className="px-1.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95"
                >
                  +
                </button>
                <div className="px-2 py-1.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-[10px] sm:text-xs font-semibold">
                  USDT
                </div>
              </div>
              {/* Conversion Display */}
              {amount && parseFloat(amount) > 0 && currentPrice && (
                <div className="mt-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-[10px] sm:text-xs">
                  <div className="flex items-center justify-between text-blue-700 dark:text-blue-300">
                    <span>You will receive:</span>
                    <span className="font-semibold">{calculateAssetAmount()} {displaySymbol}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Percentage Buttons - Compact Grid */}
            <div className="grid grid-cols-4 gap-1">
              {[25, 50, 75, 100].map(percent => (
                <button
                  key={percent}
                  onClick={() => {
                    // Use userBalance directly (it's already a number)
                    const maxBalance = userBalance || 0
                    const calculatedAmount = (maxBalance * percent / 100)
                    // Round to 2 decimal places to avoid precision issues
                    setAmount(Math.floor(calculatedAmount * 100) / 100)
                  }}
                  className="px-1.5 py-1 text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95"
                >
                  {percent}%
                </button>
              ))}
            </div>

            {/* Options Row - Compact */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5">
                <input
                  type="checkbox"
                  id="reduceOnly"
                  checked={reduceOnly}
                  onChange={(e) => setReduceOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="reduceOnly" className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300">
                  Reduce Only
                </label>
              </div>
              {orderType === 'limit' && (
                <select
                  value={timeInForce}
                  onChange={(e) => setTimeInForce(e.target.value)}
                  className="flex-1 px-1.5 py-1 text-[10px] sm:text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="GTC">GTC</option>
                  <option value="IOC">IOC</option>
                  <option value="FOK">FOK</option>
                </select>
              )}
            </div>

            {/* Order Summary - Compact */}
            <div className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-900 rounded text-[10px] sm:text-xs">
              <div className="flex items-center space-x-3">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Max: </span>
                  <span className="font-semibold">{calculateMax()} USDT</span>
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Amount: </span>
                    <span className="font-semibold">{calculateAssetAmount()} {displaySymbol}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trade Timer Selector */}
            <div>
              <label className="block text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5">Trade Timer</label>
              <select
                value={tradeTimer}
                onChange={(e) => setTradeTimer(parseInt(e.target.value))}
                className="w-full px-2 py-1.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={180}>3 minutes</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
              </select>
            </div>

            {/* Action Buttons - Compact */}
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setSide('buy')
                  handleOrder('buy') // Pass 'buy' directly to handleOrder
                }}
                className="w-full py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded font-semibold text-sm transition active:scale-[0.98]"
              >
                Buy/Long
              </button>
              <button
                onClick={() => {
                  setSide('sell')
                  handleOrder('sell') // Pass 'sell' directly to handleOrder
                }}
                className="w-full py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded font-semibold text-sm transition active:scale-[0.98]"
              >
                Sell/Short
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Overlay - Full screen when visible */}
      {chartVisible && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-in fade-in duration-200">
          {/* Chart Header - Improved UI */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 shadow-sm">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <button
                onClick={() => setChartVisible(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-2 min-w-0">
                <h3 className="text-base sm:text-lg font-bold flex-shrink-0">{displayName}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">{displaySymbol}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
                {['1m', '5m', '15m', '1h', '4h', '1d'].map((timeframe) => (
                  <button
                    key={timeframe}
                    className="px-2.5 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 whitespace-nowrap transition"
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setChartVisible(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition ml-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Chart Content - Full height */}
          <div className="flex-1 relative min-h-0 bg-white dark:bg-gray-900 overflow-hidden">
            <div ref={chartRef} className="w-full h-full" style={{ minHeight: '500px' }}>
              {/* TradingView chart will be injected here */}
            </div>
          </div>

          {/* Bottom Action Buttons - Improved UI */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2 flex-shrink-0 shadow-lg">
            <button
              onClick={() => setChartVisible(false)}
              className="w-full py-3.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl font-semibold text-base transition active:scale-[0.98] shadow-md hover:shadow-lg"
            >
              Buy/Long
            </button>
            <button
              onClick={() => setChartVisible(false)}
              className="w-full py-3.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-xl font-semibold text-base transition active:scale-[0.98] shadow-md hover:shadow-lg"
            >
              Sell/Short
            </button>
          </div>
        </div>
      )}

      {/* Bottom Tabs: Positions, Orders, Trade History - Only show when chart is hidden */}
      {!chartVisible && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 left-0 right-0 z-30 sm:relative">
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
              { id: 'positions', label: `Positions (${positions.length})` },
              { id: 'orders', label: `Orders (${openOrders.length})` },
              { id: 'history', label: 'History' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                setActiveTab(tab.id)
                // Reset history scroll height when switching tabs
                if (tab.id !== 'history') {
                  setHistoryScrollHeight(null)
                }
              }}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div 
            ref={activeTab === 'history' ? historyScrollRef : null}
            className={`p-3 sm:p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-all duration-700 ease-in-out ${
              activeTab === 'history' && historyScrollHeight 
                ? '' 
                : 'max-h-48 sm:max-h-64'
            }`}
            style={activeTab === 'history' && historyScrollHeight ? { maxHeight: `${historyScrollHeight}px` } : {}}
            onScroll={(e) => {
              if (activeTab === 'history') {
                const scrollTop = e.target.scrollTop
                const scrollHeight = e.target.scrollHeight
                const clientHeight = e.target.clientHeight
                const maxScroll = scrollHeight - clientHeight
                
                if (maxScroll <= 0) return // No scroll needed
                
                const scrollPercentage = scrollTop / maxScroll
                
                // Gradually increase height as user scrolls down
                if (scrollPercentage > 0.05) {
                  const baseHeight = window.innerWidth >= 640 ? 256 : 192 // sm:max-h-64 = 256px, max-h-48 = 192px
                  const maxHeight = Math.min(window.innerHeight * 0.75, scrollHeight + 30) // 75% of viewport or content height
                  const newHeight = baseHeight + (maxHeight - baseHeight) * Math.min(scrollPercentage * 1.5, 1)
                  setHistoryScrollHeight(Math.max(newHeight, baseHeight))
                } else if (scrollTop < 5 && historyScrollHeight) {
                  // Only reset if scrolled back to very top
                  setHistoryScrollHeight(null)
                }
              }
            }}
          >
            {activeTab === 'orders' && (
              <div className="space-y-3">
                {openOrders.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-12">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-medium">No open orders</p>
                  </div>
                ) : (
                  openOrders.map((order) => {
                    const timeRemaining = order.timer ? Math.max(0, order.timer - Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000)) : 0
                    const progress = order.timer ? ((order.timer - timeRemaining) / order.timer) * 100 : 0
                    const potentialWinPercent = order.profitPercent || 0
                    const potentialLossPercent = order.lossPercent || 0
                    const targetPercent = potentialWinPercent > 0 ? potentialWinPercent : potentialLossPercent
                    const isWin = potentialWinPercent > 0
                    
                    return (
                      <div 
                        key={order._id} 
                        onClick={() => setSelectedTradeDetail({ ...order, result: 'pending', status: 'open' })}
                        className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
                      >
                        {/* Header */}
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm ${
                              order.side === 'buy' 
                                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                            }`}>
                              {order.side === 'buy' ? 'L' : 'S'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white text-base">{order.symbol} / USDT</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {order.side === 'buy' ? 'Long' : 'Short'} • {order.leverage}x
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {targetPercent > 0 && (
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  <AnimatedProgressPercentage
                                    targetPercent={targetPercent}
                                    progress={progress}
                                    isWin={isWin}
                                  />
                                </div>
                              </div>
                            )}
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm">
                              PENDING
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
                          {/* Timer Progress */}
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Time Remaining</span>
                              <span className="font-bold text-gray-900 dark:text-white">{timeRemaining}s</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 shadow-sm"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Trade Details Grid */}
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Entry Price</div>
                              <div className="font-semibold text-gray-900 dark:text-white text-sm">${formatPrice(order.entryPrice)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trade Amount</div>
                              <div className="font-semibold text-gray-900 dark:text-white text-sm">${formatPrice(order.marginUsed || order.amount)} USDT</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order ID</div>
                              <div className="font-mono text-xs text-gray-600 dark:text-gray-500 truncate">{order._id?.slice(-8) || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created</div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {new Date(order.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
            {activeTab === 'history' && (
              <div className="space-y-2.5">
                {tradeHistory.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-12">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">No trade history</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {tradeHistory.slice(0, 20).map((trade) => {
                      const isWin = trade.result === 'win'
                      const profitPercent = isWin ? (trade.profitPercent || 0) : (trade.lossPercent || 0)
                      
                      return (
                        <div 
                          key={trade._id} 
                          onClick={() => setSelectedTradeDetail(trade)}
                          className={`group bg-white dark:bg-gray-900 rounded-lg border-l-4 transition-all cursor-pointer overflow-hidden ${
                            isWin 
                              ? 'border-l-green-500 hover:border-l-green-600 border-r border-t border-b border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700/50 shadow-sm hover:shadow-md bg-gradient-to-r from-white via-green-50/30 to-white dark:from-gray-900 dark:via-green-900/5 dark:to-gray-900' 
                              : 'border-l-red-500 hover:border-l-red-600 border-r border-t border-b border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700/50 shadow-sm hover:shadow-md bg-gradient-to-r from-white via-red-50/30 to-white dark:from-gray-900 dark:via-red-900/5 dark:to-gray-900'
                          }`}
                        >
                          {/* Main Content - Professional Layout */}
                          <div className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              {/* Left Section */}
                              <div className="flex items-center space-x-4 flex-1 min-w-0">
                                {/* Status Badge */}
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shadow-md flex-shrink-0 ${
                                  isWin 
                                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white ring-2 ring-green-200 dark:ring-green-800/50' 
                                    : 'bg-gradient-to-br from-red-500 to-red-600 text-white ring-2 ring-red-200 dark:ring-red-800/50'
                                }`}>
                                  {isWin ? '✓' : '✗'}
                                </div>
                                
                                  {/* Symbol & Type */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline space-x-2 mb-1.5">
                                      <div className="font-bold text-gray-900 dark:text-white text-lg">{trade.symbol}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">/ USDT</div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${
                                        trade.side === 'buy' 
                                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                                          : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                      }`}>
                                        {trade.side === 'buy' ? 'LONG' : 'SHORT'}
                                      </span>
                                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">•</span>
                                      <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{trade.leverage}x</span>
                                    </div>
                                  </div>
                              </div>

                              {/* Center Section - Prices */}
                              <div className="hidden sm:flex items-center space-x-6 flex-shrink-0">
                                <div className="text-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Entry</div>
                                  <div className="font-bold text-gray-900 dark:text-white text-sm">${formatPrice(trade.entryPrice)}</div>
                                </div>
                                <div className="text-gray-300 dark:text-gray-600 text-xl font-bold">→</div>
                                <div className="text-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Exit</div>
                                  <div className="font-bold text-gray-900 dark:text-white text-sm">${formatPrice(trade.exitPrice)}</div>
                                </div>
                              </div>

                              {/* Right Section - Result */}
                              <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                                <div className={`text-2xl font-bold ${
                                  isWin 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {isWin ? '+' : '-'}{profitPercent.toFixed(2)}%
                                </div>
                                <div className={`text-base font-bold ${
                                  isWin 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {trade.profit >= 0 ? '+' : ''}{formatPrice(trade.profit)} USDT
                                </div>
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-md ${
                                  isWin 
                                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}>
                                  {isWin ? 'WIN' : 'LOSS'}
                                </span>
                              </div>
                            </div>

                            {/* Mobile View - Details */}
                            <div className="sm:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold">Entry Price</div>
                                  <div className="font-bold text-gray-900 dark:text-white text-sm">${formatPrice(trade.entryPrice)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold">Exit Price</div>
                                  <div className="font-bold text-gray-900 dark:text-white text-sm">${formatPrice(trade.exitPrice)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold">Date</div>
                                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                    {new Date(trade.closedAt || trade.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold">Time</div>
                                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                    {new Date(trade.closedAt || trade.createdAt).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'positions' && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                No open positions
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trade Opening Modal */}
      {tradeOpeningModal && (
        <TradeOpeningModal
          trade={tradeOpeningModal}
          onClose={() => setTradeOpeningModal(null)}
        />
      )}

      {/* Trade Detail Modal */}
      {selectedTradeDetail && (
        <TradeDetailModal
          trade={selectedTradeDetail}
          onClose={() => setSelectedTradeDetail(null)}
        />
      )}
    </div>
  )
}
