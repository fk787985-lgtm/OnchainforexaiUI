import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getForexRates } from '../services/forexApi'
import MarketListPage from '../modules/markets/components/MarketListPage'

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

  const filteredForex = forex.filter(forexPair =>
    forexPair.pair.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MarketListPage
      title="Forex Pairs"
      subtitle="All currency pairs"
      searchPlaceholder="Search forex pairs..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      loading={loading}
      data={filteredForex}
      emptyLabel={searchTerm ? 'No pairs found' : 'No data available'}
      rowLabel="Pair"
      onBack={() => navigate('/dashboard')}
      getName={(item) => item.pair}
      getSubLabel={() => ''}
      getPrice={(item) => item.price}
      renderPrice={(item) => item.price}
      getChange={(item) => item.change24h}
    />
  )
}

