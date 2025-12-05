// Free API: ExchangeRate-API (no API key required)
const EXCHANGE_RATE_BASE = 'https://api.exchangerate-api.com/v4/latest'

export const getForexRates = async () => {
  try {
    // Get USD base rates
    const response = await fetch(`${EXCHANGE_RATE_BASE}/USD`)
    const data = await response.json()
    
    if (data.rates) {
      const pairs = [
        { pair: 'EUR/USD', base: 'EUR', quote: 'USD' },
        { pair: 'GBP/USD', base: 'GBP', quote: 'USD' },
        { pair: 'USD/JPY', base: 'USD', quote: 'JPY' },
        { pair: 'AUD/USD', base: 'AUD', quote: 'USD' },
        { pair: 'USD/CAD', base: 'USD', quote: 'CAD' },
        { pair: 'USD/CHF', base: 'USD', quote: 'CHF' },
        { pair: 'NZD/USD', base: 'NZD', quote: 'USD' },
        { pair: 'USD/CNY', base: 'USD', quote: 'CNY' }
      ]
      
      const rates = data.rates
      const previousRates = JSON.parse(localStorage.getItem('forex_previous_rates') || '{}')
      
      return pairs.slice(0, 5).map(({ pair, base, quote }) => {
        let price = 0
        let change24h = 0
        
        if (base === 'USD') {
          // USD/XXX pair
          price = rates[quote] || 0
          const prevPrice = previousRates[pair] || price
          change24h = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0
        } else {
          // XXX/USD pair
          price = 1 / (rates[base] || 1)
          const prevPrice = previousRates[pair] || price
          change24h = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0
        }
        
        return {
          pair,
          price: price.toFixed(4),
          change24h
        }
      })
    }
    
    return []
  } catch (error) {
    console.error('Error fetching forex rates:', error)
    return []
  }
}

// Store previous rates for change calculation
export const updateForexRates = async () => {
  try {
    const response = await fetch(`${EXCHANGE_RATE_BASE}/USD`)
    const data = await response.json()
    
    if (data.rates) {
      const pairs = [
        { pair: 'EUR/USD', base: 'EUR' },
        { pair: 'GBP/USD', base: 'GBP' },
        { pair: 'USD/JPY', quote: 'JPY' },
        { pair: 'AUD/USD', base: 'AUD' },
        { pair: 'USD/CAD', quote: 'CAD' }
      ]
      
      const rates = data.rates
      const currentRates = {}
      
      pairs.forEach(({ pair, base, quote }) => {
        if (base) {
          currentRates[pair] = 1 / rates[base]
        } else {
          currentRates[pair] = rates[quote]
        }
      })
      
      localStorage.setItem('forex_previous_rates', JSON.stringify(currentRates))
    }
  } catch (error) {
    console.error('Error updating forex rates:', error)
  }
}






