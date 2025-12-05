// Stocks API - Using mock data with realistic variations
// Free APIs have CORS/rate limiting issues, so we use calculated prices

// Base prices for major stocks (realistic values)
const BASE_PRICES = {
  'AAPL': 175.50, 'MSFT': 378.90, 'GOOGL': 142.30, 'AMZN': 148.75, 'TSLA': 245.60,
  'META': 485.20, 'NVDA': 495.80, 'NFLX': 485.50, 'AMD': 145.30, 'INTC': 45.20,
  'JPM': 180.40, 'V': 275.60, 'JNJ': 160.25, 'WMT': 165.80, 'PG': 155.40,
  'MA': 450.20, 'DIS': 95.60, 'BAC': 35.40, 'XOM': 115.80, 'CVX': 150.20,
  'HD': 380.50, 'PFE': 28.40, 'ABBV': 175.60, 'KO': 60.20, 'PEP': 170.80,
  'TMO': 580.40, 'COST': 720.60, 'AVGO': 1350.20, 'ABT': 115.40, 'CSCO': 55.80
}

const STOCK_NAMES = {
  'AAPL': 'Apple Inc',
  'MSFT': 'Microsoft',
  'GOOGL': 'Google',
  'AMZN': 'Amazon',
  'TSLA': 'Tesla',
  'META': 'Meta',
  'NVDA': 'NVIDIA',
  'NFLX': 'Netflix',
  'AMD': 'AMD',
  'INTC': 'Intel',
  'JPM': 'JPMorgan Chase',
  'V': 'Visa',
  'JNJ': 'Johnson & Johnson',
  'WMT': 'Walmart',
  'PG': 'Procter & Gamble',
  'MA': 'Mastercard',
  'DIS': 'Disney',
  'BAC': 'Bank of America',
  'XOM': 'Exxon Mobil',
  'CVX': 'Chevron',
  'HD': 'Home Depot',
  'PFE': 'Pfizer',
  'ABBV': 'AbbVie',
  'KO': 'Coca-Cola',
  'PEP': 'PepsiCo',
  'TMO': 'Thermo Fisher',
  'COST': 'Costco',
  'AVGO': 'Broadcom',
  'ABT': 'Abbott',
  'CSCO': 'Cisco'
}

// Store previous prices for change calculation
const getPreviousPrices = () => {
  const stored = localStorage.getItem('stock_previous_prices')
  return stored ? JSON.parse(stored) : {}
}

const setPreviousPrices = (prices) => {
  localStorage.setItem('stock_previous_prices', JSON.stringify(prices))
}

export const getStockPrices = async (symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']) => {
  try {
    const previousPrices = getPreviousPrices()
    const currentPrices = {}
    const results = []
    
    symbols.forEach(symbol => {
      const basePrice = BASE_PRICES[symbol] || 100
      
      // Add small random variation (±2%)
      const variation = (Math.random() * 0.04 - 0.02) * basePrice
      const currentPrice = basePrice + variation
      
      // Calculate 24h change
      const prevPrice = previousPrices[symbol] || currentPrice
      const change24h = prevPrice ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0
      
      currentPrices[symbol] = currentPrice
      
      results.push({
        name: STOCK_NAMES[symbol] || symbol,
        symbol: symbol,
        price: parseFloat(currentPrice.toFixed(2)),
        change24h: parseFloat(change24h.toFixed(2))
      })
    })
    
    // Store current prices for next calculation
    setPreviousPrices(currentPrices)
    
    return results
  } catch (error) {
    console.error('Error fetching stock prices:', error)
    // Fallback to simple mock data
    return symbols.map(symbol => ({
      name: STOCK_NAMES[symbol] || symbol,
      symbol: symbol,
      price: BASE_PRICES[symbol] || 100,
      change24h: (Math.random() * 4 - 2).toFixed(2)
    }))
  }
}

export const getPopularStocks = async () => {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC']
  return getStockPrices(symbols)
}
