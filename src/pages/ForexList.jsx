import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getForexRates } from '../services/forexApi'

export default function ForexList() {
  const navigate = useNavigate()
  const [forex, setForex] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Extended forex pairs list
  const forexPairs = [
    { pair: 'EUR/USD', base: 'EUR', quote: 'USD' },
    { pair: 'GBP/USD', base: 'GBP', quote: 'USD' },
    { pair: 'USD/JPY', base: 'USD', quote: 'JPY' },
    { pair: 'AUD/USD', base: 'AUD', quote: 'USD' },
    { pair: 'USD/CAD', base: 'USD', quote: 'CAD' },
    { pair: 'USD/CHF', base: 'USD', quote: 'CHF' },
    { pair: 'NZD/USD', base: 'NZD', quote: 'USD' },
    { pair: 'USD/CNY', base: 'USD', quote: 'CNY' },
    { pair: 'EUR/GBP', base: 'EUR', quote: 'GBP' },
    { pair: 'EUR/JPY', base: 'EUR', quote: 'JPY' },
    { pair: 'GBP/JPY', base: 'GBP', quote: 'JPY' },
    { pair: 'AUD/JPY', base: 'AUD', quote: 'JPY' },
    { pair: 'EUR/CHF', base: 'EUR', quote: 'CHF' },
    { pair: 'USD/SGD', base: 'USD', quote: 'SGD' },
    { pair: 'USD/HKD', base: 'USD', quote: 'HKD' },
    { pair: 'USD/SEK', base: 'USD', quote: 'SEK' },
    { pair: 'USD/NOK', base: 'USD', quote: 'NOK' },
    { pair: 'USD/ZAR', base: 'USD', quote: 'ZAR' },
    { pair: 'EUR/AUD', base: 'EUR', quote: 'AUD' },
    { pair: 'GBP/AUD', base: 'GBP', quote: 'AUD' }
  ]

  useEffect(() => {
    fetchForex()
    
    // Auto-refresh every 5 seconds (reduced to avoid rate limiting)
    const interval = setInterval(() => {
      fetchForex(false)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchForex = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    
    try {
      // Get all forex pairs
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      if (response.ok) {
        const data = await response.json()
        const rates = data.rates
        const previousRates = JSON.parse(localStorage.getItem('forex_previous_rates') || '{}')
        
        const forexData = forexPairs.map(({ pair, base, quote }) => {
          let price = 0
          let change24h = 0
          
          if (base === 'USD') {
            // USD/XXX pair
            price = rates[quote] || 0
            const prevPrice = previousRates[pair] || price
            change24h = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0
          } else if (quote === 'USD') {
            // XXX/USD pair
            price = 1 / (rates[base] || 1)
            const prevPrice = previousRates[pair] || price
            change24h = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0
          } else {
            // Cross pair (e.g., EUR/GBP)
            const baseToUsd = 1 / (rates[base] || 1)
            const quoteToUsd = 1 / (rates[quote] || 1)
            price = baseToUsd / quoteToUsd
            const prevPrice = previousRates[pair] || price
            change24h = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0
          }
          
          return {
            pair,
            price: price.toFixed(4),
            change24h
          }
        })
        
        setForex(forexData)
        
        // Store current rates for next calculation
        const currentRates = {}
        forexPairs.forEach(({ pair, base, quote }) => {
          if (base === 'USD') {
            currentRates[pair] = rates[quote]
          } else if (quote === 'USD') {
            currentRates[pair] = 1 / rates[base]
          } else {
            const baseToUsd = 1 / rates[base]
            const quoteToUsd = 1 / rates[quote]
            currentRates[pair] = baseToUsd / quoteToUsd
          }
        })
        localStorage.setItem('forex_previous_rates', JSON.stringify(currentRates))
      }
    } catch (error) {
      console.error('Error fetching forex:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
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

  const filteredForex = forex.filter(forexPair =>
    forexPair.pair.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-xl font-bold">Forex Pairs</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">All currency pairs</p>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search forex pairs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Forex List */}
      <main className="px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-600 dark:text-gray-400">
            <div>Pair</div>
            <div className="text-right">Last Price</div>
            <div className="text-right">24h Change%</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredForex.length > 0 ? (
              filteredForex.map((forexPair, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-sm">{forexPair.pair}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{forexPair.price}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatChange(forexPair.change24h)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No pairs found' : 'No data available'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

