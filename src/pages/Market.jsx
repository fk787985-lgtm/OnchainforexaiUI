import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCryptoPrices, getFavourites } from '../services/cryptoApi'
import { getPopularStocks } from '../services/stocksApi'
import { getForexRates } from '../services/forexApi'
import { getAllMetals } from '../services/metalsApi'

export default function Market() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('crypto')
  const [cryptoData, setCryptoData] = useState([])
  const [stocks, setStocks] = useState([])
  const [forex, setForex] = useState([])
  const [metals, setMetals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, price, change
  const [sortOrder, setSortOrder] = useState('asc')
  const [cryptoCategory, setCryptoCategory] = useState('hot')

  useEffect(() => {
    fetchAllData()
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchAllData(false)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchCryptoData()
  }, [cryptoCategory])

  const fetchAllData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    
    try {
      await Promise.all([
        fetchCryptoData(false),
        fetchStocks(),
        fetchForex(),
        fetchMetals()
      ])
    } catch (error) {
      console.error('Error fetching market data:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const fetchCryptoData = async (showLoading = true) => {
    try {
      const data = await getCryptoPrices(cryptoCategory)
      setCryptoData(data)
    } catch (error) {
      console.error('Error fetching crypto:', error)
    }
  }

  const fetchStocks = async () => {
    try {
      const data = await getPopularStocks()
      setStocks(data)
    } catch (error) {
      console.error('Error fetching stocks:', error)
    }
  }

  const fetchForex = async () => {
    try {
      const data = await getForexRates()
      setForex(data)
    } catch (error) {
      console.error('Error fetching forex:', error)
    }
  }

  const fetchMetals = async () => {
    try {
      const data = await getAllMetals()
      setMetals(data)
    } catch (error) {
      console.error('Error fetching metals:', error)
    }
  }

  const formatPrice = (price) => {
    if (price === 0 || !price) return '0.00'
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatChange = (change) => {
    if (change === null || change === undefined || change === '') return <span className="text-gray-500">--</span>
    const numChange = typeof change === 'string' ? parseFloat(change) : change
    if (isNaN(numChange)) return <span className="text-gray-500">--</span>
    const isPositive = numChange >= 0
    return (
      <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {isPositive ? '+' : ''}{numChange.toFixed(2)}%
      </span>
    )
  }

  // Popular coins/items to show at top
  const getPopularItems = () => {
    if (activeTab === 'crypto') {
      return ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'LINK']
    } else if (activeTab === 'stocks') {
      return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX']
    } else if (activeTab === 'forex') {
      return ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD']
    } else if (activeTab === 'metals') {
      return ['Gold', 'Silver', 'Platinum', 'Palladium']
    }
    return []
  }

  // Filter and sort data
  const getFilteredAndSortedData = () => {
    let data = []
    
    switch (activeTab) {
      case 'crypto':
        data = cryptoData
        break
      case 'stocks':
        data = stocks
        break
      case 'forex':
        data = forex
        break
      case 'metals':
        data = metals
        break
      default:
        data = []
    }

    // Filter by search term
    let filtered = data.filter(item => {
      if (activeTab === 'forex') {
        return item.pair?.toLowerCase().includes(searchTerm.toLowerCase())
      }
      return (
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

    // Separate popular and other items
    const popularSymbols = getPopularItems()
    const popularItems = []
    const otherItems = []

    filtered.forEach(item => {
      const identifier = activeTab === 'forex' ? item.pair : (item.symbol || item.name)
      if (popularSymbols.some(pop => identifier?.toUpperCase().includes(pop.toUpperCase()))) {
        popularItems.push(item)
      } else {
        otherItems.push(item)
      }
    })

    // Sort both groups
    const sortItems = (items) => {
      return items.sort((a, b) => {
        let aVal, bVal
        
        switch (sortBy) {
          case 'price':
            aVal = a.price || 0
            bVal = b.price || 0
            break
          case 'change':
            aVal = a.change24h || 0
            bVal = b.change24h || 0
            break
          default: // name
            aVal = activeTab === 'forex' ? a.pair : a.name || a.symbol
            bVal = activeTab === 'forex' ? b.pair : b.name || b.symbol
        }
        
        if (typeof aVal === 'string') {
          return sortOrder === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }
        
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      })
    }

    // Return popular items first, then others
    return [...sortItems(popularItems), ...sortItems(otherItems)]
  }

  const filteredData = getFilteredAndSortedData()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 py-3 flex items-center space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Market</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">All Markets Overview</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[73px] z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-2 sm:px-4">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide -mb-px">
            {[
              { id: 'crypto', label: 'Crypto', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'stocks', label: 'Stocks', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'forex', label: 'Forex', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'metals', label: 'Metals', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-t-lg text-xs sm:text-sm font-medium whitespace-nowrap transition active:scale-95 ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Crypto Category Filter (only for crypto tab) */}
      {activeTab === 'crypto' && (
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto scrollbar-hide">
            {['hot', 'gainers', 'losers', 'new', 'alpha', 'favourites'].map((category) => (
              <button
                key={category}
                onClick={() => setCryptoCategory(category)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition active:scale-95 ${
                  cryptoCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search and Sort Bar */}
      <div className="px-3 sm:px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 pl-9 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sort - Mobile optimized */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-2 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="change">Change</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition active:scale-95"
            >
              {sortOrder === 'asc' ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Market Data Table */}
      <main className="px-3 sm:px-4 py-3 sm:py-4">
        {/* Desktop Table View */}
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 font-semibold text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <div className="col-span-2">Name</div>
            <div className="text-right">Price</div>
            <div className="text-right">24h Change</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[calc(100vh-300px)] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredData.length > 0 ? (
              <>
                {/* Popular Section Header */}
                {!searchTerm && (() => {
                  const popularSymbols = getPopularItems()
                  const hasPopular = filteredData.some(item => {
                    const identifier = activeTab === 'forex' ? item.pair : (item.symbol || item.name)
                    return popularSymbols.some(pop => identifier?.toUpperCase().includes(pop.toUpperCase()))
                  })
                  return hasPopular
                })() && (
                  <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Popular</span>
                    </div>
                  </div>
                )}
                {filteredData.map((item, index) => {
                  const displayName = activeTab === 'forex' ? item.pair : item.name
                  const displaySymbol = activeTab === 'forex' ? '' : item.symbol
                  const displayPrice = activeTab === 'forex' ? item.price : `$${formatPrice(item.price)}`
                  const displayUnit = activeTab === 'metals' ? ` • ${item.unit}` : ''
                  const identifier = activeTab === 'forex' ? item.pair : (item.symbol || item.name)
                  const popularSymbols = getPopularItems()
                  const isPopular = !searchTerm && popularSymbols.some(pop => identifier?.toUpperCase().includes(pop.toUpperCase()))
                  const isLastPopular = isPopular && filteredData[index + 1] && (() => {
                    const nextIdentifier = activeTab === 'forex' ? filteredData[index + 1].pair : (filteredData[index + 1].symbol || filteredData[index + 1].name)
                    return !popularSymbols.some(pop => nextIdentifier?.toUpperCase().includes(pop.toUpperCase()))
                  })()
                  
                return (
                  <div
                    key={index}
                    className={`grid grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer active:bg-gray-100 dark:active:bg-gray-600 ${
                      isPopular ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    } ${isLastPopular ? 'border-b-2 border-indigo-200 dark:border-indigo-800 mb-2' : ''}`}
                    onClick={() => {
                      navigate(`/trade/${activeTab}/${encodeURIComponent(activeTab === 'forex' ? item.pair : item.symbol || item.name)}`, {
                        state: { item, type: activeTab }
                      })
                    }}
                  >
                    <div className="col-span-2 flex items-center space-x-2 sm:space-x-3 min-w-0">
                      {item.image && activeTab !== 'crypto' && (
                        <img src={item.image} alt={displayName} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs sm:text-sm truncate">{displayName}</div>
                        {displaySymbol && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {displaySymbol}{displayUnit}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <div className="font-semibold text-xs sm:text-sm">{displayPrice}</div>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <div className="text-xs sm:text-sm">{formatChange(item.change24h)}</div>
                    </div>
                  </div>
                  )
                })}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No results found' : 'No data available'}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-2">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredData.length > 0 ? (
            <>
              {/* Popular Section Header for Mobile */}
              {!searchTerm && (() => {
                const popularSymbols = getPopularItems()
                const hasPopular = filteredData.some(item => {
                  const identifier = activeTab === 'forex' ? item.pair : (item.symbol || item.name)
                  return popularSymbols.some(pop => identifier?.toUpperCase().includes(pop.toUpperCase()))
                })
                return hasPopular
              })() && (
                <div className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg mb-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Popular</span>
                  </div>
                </div>
              )}
              {filteredData.map((item, index) => {
                const displayName = activeTab === 'forex' ? item.pair : item.name
                const displaySymbol = activeTab === 'forex' ? '' : item.symbol
                const displayPrice = activeTab === 'forex' ? item.price : `$${formatPrice(item.price)}`
                const displayUnit = activeTab === 'metals' ? ` • ${item.unit}` : ''
                const identifier = activeTab === 'forex' ? item.pair : (item.symbol || item.name)
                const popularSymbols = getPopularItems()
                const isPopular = !searchTerm && popularSymbols.some(pop => identifier?.toUpperCase().includes(pop.toUpperCase()))
                
                return (
                  <div
                    key={index}
                    onClick={() => {
                      navigate(`/trade/${activeTab}/${encodeURIComponent(activeTab === 'forex' ? item.pair : item.symbol || item.name)}`, {
                        state: { item, type: activeTab }
                      })
                    }}
                    className={`bg-white dark:bg-gray-800 rounded-lg border ${
                      isPopular 
                        ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    } p-3 active:scale-[0.98] transition cursor-pointer`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {item.image && activeTab !== 'crypto' && (
                          <img src={item.image} alt={displayName} className="w-10 h-10 rounded-full flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate">{displayName}</div>
                          {displaySymbol && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {displaySymbol}{displayUnit}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-2">
                        <div className="font-semibold text-sm">{displayPrice}</div>
                        <div className="text-xs">{formatChange(item.change24h)}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No results found' : 'No data available'}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { name: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', route: '/dashboard' },
            { name: 'Market', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', route: '/market' },
            { name: 'Trade', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', route: '/trade' },
            { name: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', route: '/history' },
            { name: 'Asset', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/asset' },
            // { 
            //   name: 'Profile', 
            //   icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 
            //   route: '/profile',
            //   isAction: false
            // },
            // { 
            //   name: 'Logout', 
            //   icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1', 
            //   route: null,
            //   isAction: true
            // }
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

