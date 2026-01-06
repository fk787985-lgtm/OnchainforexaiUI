import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllMetals } from '../services/metalsApi'

export default function MetalsList() {
  const navigate = useNavigate()
  const [metals, setMetals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMetals()
    
    // Auto-refresh every 1 second for REAL-TIME updates (like TradingView)
    const interval = setInterval(() => {
      fetchMetals(false)
    }, 1000) // 1 second - maximum real-time feel
    
    return () => clearInterval(interval)
  }, [])

  const fetchMetals = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    
    try {
      const startTime = Date.now()
      const data = await getAllMetals()
      const fetchTime = Date.now() - startTime
      
      // Only update state if we got valid data
      if (data && data.length > 0) {
        setMetals(data)
        const goldPrice = data.find(m => m.symbol === 'XAU')?.price || 'N/A'
        const silverPrice = data.find(m => m.symbol === 'XAG')?.price || 'N/A'
        console.log(`✅ [${fetchTime}ms] Metals updated at ${new Date().toLocaleTimeString()}: Gold=$${goldPrice}, Silver=$${silverPrice}`)
      } else {
        console.warn('⚠️ No valid metals data received')
      }
    } catch (error) {
      console.error('❌ Error fetching metals:', error.message || error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === 0) return '0.00'
    if (price < 1) {
      return price.toFixed(4)
    }
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

  const filteredMetals = metals.filter(metal =>
    metal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    metal.symbol.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-xl font-bold">Precious Metals</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gold, Silver, Platinum & More</p>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search metals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Metals List */}
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
            ) : filteredMetals.length > 0 ? (
              filteredMetals.map((metal, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-sm">{metal.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{metal.symbol} • {metal.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">${formatPrice(metal.price)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatChange(metal.change24h)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No metals found' : 'No data available'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

