import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStockPrices } from '../services/stocksApi'

export default function StocksList() {
  const navigate = useNavigate()
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Extended stock list
  const stockSymbols = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC',
    'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'DIS', 'BAC', 'XOM', 'CVX',
    'HD', 'PFE', 'ABBV', 'KO', 'PEP', 'TMO', 'COST', 'AVGO', 'ABT', 'CSCO'
  ]

  useEffect(() => {
    fetchStocks()
    
    // Auto-refresh every 5 seconds (reduced to avoid rate limiting)
    const interval = setInterval(() => {
      fetchStocks(false)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchStocks = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    
    try {
      const data = await getStockPrices(stockSymbols)
      setStocks(data)
    } catch (error) {
      console.error('Error fetching stocks:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const formatPrice = (price) => {
    if (price === 0 || !price) return '0.00'
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

  const filteredStocks = stocks.filter(stock =>
    stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <h1 className="text-xl font-bold">Stocks</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">All available stocks</p>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Stocks List */}
      <main className="px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-600 dark:text-gray-400">
            <div>Name</div>
            <div className="text-right">Last Price</div>
            <div className="text-right">24h Change%</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredStocks.length > 0 ? (
              filteredStocks.map((stock, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-sm">{stock.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{stock.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">${formatPrice(stock.price)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatChange(stock.change24h)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No stocks found' : 'No data available'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

