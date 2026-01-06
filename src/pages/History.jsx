import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import api from '../utils/axios'

export default function History() {
  const [tradeHistory, setTradeHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterResult, setFilterResult] = useState('all') // all, win, loss
  const [filterSide, setFilterSide] = useState('all') // all, buy, sell
  const [sortBy, setSortBy] = useState('date') // date, profit, symbol
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetchTradeHistory()
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchTradeHistory, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchTradeHistory = async () => {
    try {
      const response = await api.get('/api/trades/history')
      if (response.data.success) {
        setTradeHistory(response.data.trades || [])
      }
    } catch (error) {
      console.error('Error fetching trade history:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const statistics = useMemo(() => {
    const closedTrades = tradeHistory.filter(t => t.status === 'closed')
    const wins = closedTrades.filter(t => t.result === 'win')
    const losses = closedTrades.filter(t => t.result === 'loss')
    
    const totalProfit = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0)
    const winProfit = wins.reduce((sum, t) => sum + (t.profit || 0), 0)
    const lossAmount = losses.reduce((sum, t) => sum + Math.abs(t.profit || 0), 0)
    
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0
    const avgProfit = wins.length > 0 ? winProfit / wins.length : 0
    const avgLoss = losses.length > 0 ? lossAmount / losses.length : 0
    
    return {
      totalTrades: closedTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: winRate.toFixed(1),
      totalProfit: totalProfit.toFixed(2),
      winProfit: winProfit.toFixed(2),
      lossAmount: lossAmount.toFixed(2),
      avgProfit: avgProfit.toFixed(2),
      avgLoss: avgLoss.toFixed(2)
    }
  }, [tradeHistory])

  // Filter and sort trades
  const filteredAndSortedTrades = useMemo(() => {
    let filtered = tradeHistory.filter(trade => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!trade.symbol?.toLowerCase().includes(query)) {
          return false
        }
      }
      
      // Result filter
      if (filterResult !== 'all') {
        if (filterResult === 'win' && trade.result !== 'win') return false
        if (filterResult === 'loss' && trade.result !== 'loss') return false
      }
      
      // Side filter
      if (filterSide !== 'all') {
        if (filterSide === 'buy' && trade.side !== 'buy') return false
        if (filterSide === 'sell' && trade.side !== 'sell') return false
      }
      
      return true
    })
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.closedAt || b.createdAt) - new Date(a.closedAt || a.createdAt)
      } else if (sortBy === 'profit') {
        return (b.profit || 0) - (a.profit || 0)
      } else if (sortBy === 'symbol') {
        return (a.symbol || '').localeCompare(b.symbol || '')
      }
      return 0
    })
    
    return filtered
  }, [tradeHistory, searchQuery, filterResult, filterSide, sortBy])

  const formatPrice = (price) => {
    if (!price) return '0.00'
    return parseFloat(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header - Mobile First */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-3 py-3 sm:px-4 sm:py-4">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Trade History</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{statistics.totalTrades} Trades</p>
              </div>
            </div>
          </div>

          {/* Search and Filters - Mobile Optimized */}
          <div className="space-y-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-3 gap-2">
              {/* Result Filter */}
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                className="px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All</option>
                <option value="win">Wins</option>
                <option value="loss">Loss</option>
              </select>

              {/* Side Filter */}
              <select
                value={filterSide}
                onChange={(e) => setFilterSide(e.target.value)}
                className="px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All</option>
                <option value="buy">Long</option>
                <option value="sell">Short</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="date">Date</option>
                <option value="profit">Profit</option>
                <option value="symbol">Symbol</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Mobile First */}
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          {/* Total Profit/Loss */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">Total P/L</div>
            <div className="flex items-baseline space-x-1 flex-wrap">
              <div className={`text-sm sm:text-lg font-bold ${
                parseFloat(statistics.totalProfit) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {parseFloat(statistics.totalProfit) >= 0 ? '+' : ''}{formatPrice(statistics.totalProfit)}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">USDT</div>
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">Win Rate</div>
            <div className="flex items-baseline space-x-1 flex-wrap">
              <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">{statistics.winRate}%</div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">({statistics.wins}W / {statistics.losses}L)</div>
            </div>
          </div>

          {/* Avg Profit */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Win</div>
            <div className="flex items-baseline space-x-1 flex-wrap">
              <div className="text-sm sm:text-lg font-bold text-green-600 dark:text-green-400">+{formatPrice(statistics.avgProfit)}</div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">USDT</div>
            </div>
          </div>

          {/* Avg Loss */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Loss</div>
            <div className="flex items-baseline space-x-1 flex-wrap">
              <div className="text-sm sm:text-lg font-bold text-red-600 dark:text-red-400">-{formatPrice(statistics.avgLoss)}</div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">USDT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Mobile First */}
      <div className="px-3 sm:px-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredAndSortedTrades.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No trades found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {searchQuery || filterResult !== 'all' || filterSide !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Your completed trades will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-3 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              <div className="col-span-2">Symbol</div>
              <div className="col-span-1">Side</div>
              <div className="col-span-1">Entry</div>
              <div className="col-span-1">Exit</div>
              <div className="col-span-1">Trade Amount</div>
              <div className="col-span-1">Leverage</div>
              <div className="col-span-1">P/L %</div>
              <div className="col-span-1">P/L</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-2">Time</div>
            </div>

            {/* Trade Cards */}
            {filteredAndSortedTrades.map((trade) => {
              const isWin = trade.result === 'win'
              const profitPercent = isWin ? (trade.profitPercent || 0) : (trade.lossPercent || 0)
              
              return (
                      <div 
                        key={trade._id} 
                        onClick={() => navigate(`/order/${trade._id}`, { state: { trade } })}
                  className={`group bg-white dark:bg-gray-800 rounded-lg border transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-md ${
                    isWin 
                      ? 'border-l-4 border-l-green-500 hover:border-l-green-600 border-r border-t border-b border-gray-200 dark:border-gray-700' 
                      : 'border-l-4 border-l-red-500 hover:border-l-red-600 border-r border-t border-b border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Desktop Card - Moderate Fonts and Alignment */}
                  <div className="hidden md:block p-3">
                    {/* Top Section - Symbol, Side, P/L with Icons */}
                    <div className="flex items-start justify-between mb-3">
                      {/* Left: Status Icon + Symbol */}
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          isWin 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {isWin ? '✓' : '✗'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white text-base mb-0.5">{trade.symbol}</div>
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              trade.side === 'buy' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {trade.side === 'buy' ? 'BUY' : 'SELL'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{trade.leverage}x</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: P/L with Icons */}
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className={`flex items-center justify-end space-x-1.5 mb-1 ${
                          isWin 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isWin ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                          )}
                          <div className="text-base font-bold">
                            {isWin ? '+' : '-'}{profitPercent.toFixed(2)}%
                          </div>
                        </div>
                        <div className={`flex items-center justify-end space-x-1.5 mb-1.5 ${
                          isWin 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm font-bold">
                            {trade.profit >= 0 ? '+' : ''}{formatPrice(trade.profit)}
                          </div>
                        </div>
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                          isWin 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {isWin ? 'WIN' : 'LOSS'}
                        </span>
                      </div>
                    </div>

                    {/* Middle Section - Entry, Exit, Amount in Row */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex-1 text-center">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Entry</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">${formatPrice(trade.entryPrice)}</div>
                      </div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 text-center">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Exit</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">${formatPrice(trade.exitPrice)}</div>
                      </div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 text-center">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Trade Amount</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">${formatPrice(trade.marginUsed || trade.amount)}</div>
                        <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">USDT</div>
                      </div>
                    </div>

                    {/* Bottom Section - Date and Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{formatDate(trade.closedAt || trade.createdAt)}</div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{formatTime(trade.closedAt || trade.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Card - Moderate Fonts and Alignment */}
                  <div className="md:hidden p-2.5">
                    {/* Top Section - Symbol, Side, P/L with Icons */}
                    <div className="flex items-start justify-between mb-2.5">
                      {/* Left: Status Icon + Symbol + Side */}
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isWin 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {isWin ? '✓' : '✗'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5 truncate">{trade.symbol}</div>
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              trade.side === 'buy' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {trade.side === 'buy' ? 'BUY' : 'SELL'}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{trade.leverage}x</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: P/L with Icons */}
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className={`flex items-center justify-end space-x-1 mb-1 ${
                          isWin 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isWin ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                          )}
                          <div className="text-sm font-bold">
                            {isWin ? '+' : '-'}{profitPercent.toFixed(2)}%
                          </div>
                        </div>
                        <div className={`flex items-center justify-end space-x-1 mb-1.5 ${
                          isWin 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-xs font-bold">
                            {trade.profit >= 0 ? '+' : ''}{formatPrice(trade.profit)}
                          </div>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isWin 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {isWin ? 'WIN' : 'LOSS'}
                        </span>
                      </div>
                    </div>

                    {/* Middle Section - Entry, Exit, Amount in Row */}
                    <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex-1 text-center">
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">Entry</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-xs">${formatPrice(trade.entryPrice)}</div>
                      </div>
                      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 text-center">
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">Exit</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-xs">${formatPrice(trade.exitPrice)}</div>
                      </div>
                      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 text-center">
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">Trade Amount</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-xs">${formatPrice(trade.marginUsed || trade.amount)}</div>
                        <div className="text-[8px] text-gray-400 dark:text-gray-500 mt-0.5">USDT</div>
                      </div>
                    </div>

                    {/* Bottom Section - Date and Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">{formatDate(trade.closedAt || trade.createdAt)}</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">{formatTime(trade.closedAt || trade.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 safe-area-bottom">
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
                location.pathname === item.route
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
