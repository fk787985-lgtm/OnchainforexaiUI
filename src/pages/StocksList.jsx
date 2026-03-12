import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStockPrices } from '../services/stocksApi'
import MarketListPage from '../modules/markets/components/MarketListPage'

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

  const filteredStocks = stocks.filter(stock =>
    stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MarketListPage
      title="Stocks"
      subtitle="All available stocks"
      searchPlaceholder="Search stocks..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      loading={loading}
      data={filteredStocks}
      emptyLabel={searchTerm ? 'No stocks found' : 'No data available'}
      rowLabel="Name"
      onBack={() => navigate('/dashboard')}
      getName={(stock) => stock.name}
      getSubLabel={(stock) => stock.symbol}
      getPrice={(stock) => stock.price}
      getChange={(stock) => stock.change24h}
    />
  )
}

