import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllMetals } from '../services/metalsApi'
import MarketListPage from '../modules/markets/components/MarketListPage'

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

  const filteredMetals = metals.filter(metal =>
    metal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    metal.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MarketListPage
      title="Precious Metals"
      subtitle="Gold, Silver, Platinum & More"
      searchPlaceholder="Search metals..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      loading={loading}
      data={filteredMetals}
      emptyLabel={searchTerm ? 'No metals found' : 'No data available'}
      rowLabel="Name"
      onBack={() => navigate('/dashboard')}
      getName={(metal) => metal.name}
      getSubLabel={(metal) => `${metal.symbol} • ${metal.unit}`}
      getPrice={(metal) => metal.price}
      getChange={(metal) => metal.change24h}
    />
  )
}

