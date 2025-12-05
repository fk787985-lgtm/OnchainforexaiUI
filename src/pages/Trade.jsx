import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCryptoPrices } from '../services/cryptoApi'
import { getPopularStocks } from '../services/stocksApi'
import { getForexRates } from '../services/forexApi'
import { getAllMetals } from '../services/metalsApi'
import api from '../utils/axios'

export default function Trade() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedType, setSelectedType] = useState('crypto')
  const [cryptoAssets, setCryptoAssets] = useState([])
  const [stocksAssets, setStocksAssets] = useState([])
  const [forexAssets, setForexAssets] = useState([])
  const [metalsAssets, setMetalsAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userBalance, setUserBalance] = useState(0)

  useEffect(() => {
    // Fetch user balance
    const fetchUserBalance = async () => {
      try {
        const response = await api.get('/api/auth/me')
        if (response.data.success) {
          setUserBalance(response.data.user.balance || 0)
        }
      } catch (error) {
        console.error('Error fetching user balance:', error)
      }
    }
    
    fetchUserBalance()
    fetchAllAssets()
    
    const interval = setInterval(() => {
      fetchAllAssets()
      fetchUserBalance()
    }, 5000) // Refresh every 5 seconds
    
    return () => clearInterval(interval)
  }, [])

  const fetchAllAssets = async () => {
    try {
      const [crypto, stocks, forex, metals] = await Promise.all([
        getCryptoPrices('hot').catch(() => []),
        getPopularStocks().catch(() => []),
        getForexRates().catch(() => []),
        getAllMetals().catch(() => [])
      ])
      
      setCryptoAssets(crypto)
      setStocksAssets(stocks)
      setForexAssets(forex)
      setMetalsAssets(metals)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching assets:', error)
      setLoading(false)
    }
  }

  const getCurrentAssets = () => {
    switch (selectedType) {
      case 'crypto': return cryptoAssets
      case 'stocks': return stocksAssets
      case 'forex': return forexAssets
      case 'metals': return metalsAssets
      default: return []
    }
  }

  const filteredAssets = getCurrentAssets().filter(asset => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    if (selectedType === 'forex') {
      return asset.pair?.toLowerCase().includes(query)
    }
    return (
      asset.name?.toLowerCase().includes(query) ||
      asset.symbol?.toLowerCase().includes(query)
    )
  })

  const formatPrice = (price) => {
    // Convert to number first
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price)
    
    // Check if valid number
    if (!price && price !== 0) return '0.00'
    if (isNaN(numPrice)) return '0.00'
    
    // Format based on value
    if (numPrice < 0.01) return numPrice.toFixed(6)
    if (numPrice < 1) return numPrice.toFixed(4)
    return numPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatChange = (change) => {
    if (!change && change !== 0) return '0.00%'
    const value = typeof change === 'string' ? parseFloat(change) : change
    if (isNaN(value)) return '0.00%'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const handleAssetClick = (asset) => {
    const symbol = selectedType === 'forex' ? asset.pair : (asset.symbol || asset.name)
    navigate(`/trade/${selectedType}/${encodeURIComponent(symbol)}`, {
      state: { item: asset, type: selectedType }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header with Balance - Binance Style */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Balance Bar */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Available Balance</span>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {userBalance.toFixed(2)} <span className="text-sm text-gray-500 dark:text-gray-400">USDT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-4 py-3">
          {/* Type Tabs */}
          <div className="flex space-x-2 mb-3 overflow-x-auto scrollbar-hide">
            {['crypto', 'stocks', 'forex', 'metals'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type)
                  setSearchQuery('')
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  selectedType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${selectedType}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </header>

      {/* Assets List */}
      <main className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Table Header - Desktop */}
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2 text-right">Last Price</div>
              <div className="col-span-2 text-right">24h Change</div>
              <div className="col-span-2 text-right">24h High</div>
              <div className="col-span-2 text-right">24h Low</div>
            </div>

            {/* Assets List */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAssets.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No {selectedType} found
                </div>
              ) : (
                filteredAssets.map((asset, index) => {
                  // Ensure all values are numbers
                  const price = parseFloat(asset.price || asset.lastPrice || 0) || 0
                  const change = parseFloat(asset.change24h || asset.change || 0) || 0
                  const high24h = parseFloat(asset.high24h || asset.high || 0) || 0
                  const low24h = parseFloat(asset.low24h || asset.low || 0) || 0
                  const name = selectedType === 'forex' ? asset.pair : asset.name
                  const symbol = selectedType === 'forex' ? asset.pair : asset.symbol
                  const image = asset.image || (selectedType === 'crypto' ? `https://assets.coingecko.com/coins/images/${Math.floor(Math.random() * 1000)}/small/${symbol?.toLowerCase() || 'bitcoin'}.png` : null)

                  return (
                    <div
                      key={index}
                      onClick={() => handleAssetClick(asset)}
                      className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                    >
                      {/* Rank - Desktop Only */}
                      <div className="hidden sm:block col-span-1 text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400">{index + 1}</div>
                      </div>
                      
                      {/* Name with Logo - Mobile & Desktop */}
                      <div className="col-span-6 sm:col-span-3">
                        <div className="flex items-center space-x-2">
                          {selectedType === 'crypto' && image && (
                            <img 
                              src={image} 
                              alt={symbol}
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{symbol}/USDT</div>
                          </div>
                        </div>
                      </div>

                      {/* Last Price - Mobile & Desktop */}
                      <div className="col-span-6 sm:col-span-2 text-right sm:text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(price)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">Price (USDT)</div>
                      </div>

                      {/* 24h Change - Mobile & Desktop */}
                      <div className="col-span-6 sm:col-span-2 text-right sm:text-right">
                        <div className={`font-semibold ${
                          change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatChange(change)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">Change</div>
                      </div>

                      {/* 24h High - Desktop Only */}
                      <div className="hidden sm:block col-span-2 text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${formatPrice(high24h)}
                        </div>
                      </div>

                      {/* 24h Low - Desktop Only */}
                      <div className="hidden sm:block col-span-2 text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${formatPrice(low24h)}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </main>

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
                location.pathname === item.route || (item.route === '/trade' && location.pathname.startsWith('/trade'))
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
