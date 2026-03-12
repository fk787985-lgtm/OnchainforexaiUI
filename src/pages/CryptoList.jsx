import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCryptoPrices, getFavourites } from '../services/cryptoApi'
import MarketListPage from '../modules/markets/components/MarketListPage'

export default function CryptoList() {
  const { category } = useParams()
  const navigate = useNavigate()
  const [cryptoData, setCryptoData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCryptoData()
    
    // Auto-refresh every 5 seconds (reduced to avoid rate limiting)
    const interval = setInterval(() => {
      fetchCryptoData(false)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [category])

  const fetchCryptoData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    
    try {
      let data = []
      if (category === 'favourites') {
        data = await getFavourites()
      } else {
        data = await getCryptoPrices(category || 'hot')
      }
      setCryptoData(data)
    } catch (error) {
      console.error('Error fetching crypto data:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const filteredData = cryptoData.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categoryName = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Hot'

  return (
    <MarketListPage
      title={`${categoryName} Cryptocurrencies`}
      subtitle={`All ${categoryName.toLowerCase()} coins`}
      searchPlaceholder="Search coins..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      loading={loading}
      data={filteredData}
      emptyLabel={searchTerm ? 'No coins found' : 'No data available'}
      rowLabel="Name"
      onBack={() => navigate('/dashboard')}
      getName={(coin) => coin.name}
      getSubLabel={(coin) => coin.symbol}
      getPrice={(coin) => coin.price}
      getChange={(coin) => coin.change24h}
      onRowClick={(coin) => console.log('Coin clicked:', coin)}
    />
  )
}

