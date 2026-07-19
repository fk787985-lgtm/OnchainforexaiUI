import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { getCryptoPrices, getFavourites, getCryptoNews } from '../services/cryptoApi'
import { getPopularStocks } from '../services/stocksApi'
import { getForexRates, updateForexRates } from '../services/forexApi'
import { getGoldPrice } from '../services/metalsApi'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import AddFundsModal from '../components/AddFundsModal'
import TransferModal from '../components/TransferModal'
import { getImageUrl } from '../utils/imageUrl.js'
import { formatMarketPrice, getChangeMeta } from '../utils/formatters/marketFormatters'
import NotificationBell from '../components/notifications/NotificationBell'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import UserSidebar from '../components/UserSidebar'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [activeCryptoTab, setActiveCryptoTab] = useState('hot')
  const [cryptoData, setCryptoData] = useState({})
  const [stocks, setStocks] = useState([])
  const [forex, setForex] = useState([])
  const [news, setNews] = useState([])
  const [gold, setGold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cryptoLoading, setCryptoLoading] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [userLanguage, setUserLanguage] = useState('en')
  const { theme, toggleTheme } = useTheme()
  const { settings: siteSettings } = useSiteSettings()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Fetch user balance and language
    const fetchUserBalance = async () => {
      try {
        const response = await api.get('/api/auth/me')
        if (response.data.success) {
          setUserBalance(response.data.user.balance || 0)
          setUserLanguage(response.data.user.language || 'en')
        }
      } catch (error) {
        console.error('Error fetching user balance:', error)
      }
    }
    fetchUserBalance()
    
    // Refresh balance every 5 seconds
    const balanceInterval = setInterval(fetchUserBalance, 5000)
    return () => clearInterval(balanceInterval)
  }, [])

  const estimatedValue = userBalance

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData()
    
    // Set up auto-refresh every 5 seconds (reduced to avoid rate limiting)
    const interval = setInterval(() => {
      fetchAllData(false) // Don't show loading on refresh
    }, 5000)

    // Initial forex rates update for change calculation
    updateForexRates()
    
    return () => clearInterval(interval)
  }, [])

  // Fetch crypto data when tab changes
  useEffect(() => {
    fetchCryptoData(activeCryptoTab)
  }, [activeCryptoTab])

  const fetchAllData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    
    try {
      await Promise.all([
        fetchCryptoData(activeCryptoTab, false),
        fetchStocks(),
        fetchForex(),
        fetchNews(),
        fetchGold()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const fetchCryptoData = async (category, showLoading = true) => {
    if (showLoading) setCryptoLoading(true)
    
    try {
      let data = []
      if (category === 'favourites') {
        data = await getFavourites()
      } else {
        data = await getCryptoPrices(category)
      }
      
      setCryptoData(prev => ({
        ...prev,
        [category]: data
      }))
    } catch (error) {
      console.error('Error fetching crypto data:', error)
    } finally {
      if (showLoading) setCryptoLoading(false)
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

  const fetchNews = async () => {
    try {
      const data = await getCryptoNews()
      setNews(data)
    } catch (error) {
      console.error('Error fetching news:', error)
    }
  }

  const fetchGold = async () => {
    try {
      const data = await getGoldPrice()
      setGold(data)
    } catch (error) {
      console.error('Error fetching gold:', error)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
      return
    }
    // Google first-time users must complete name + phone before using the app
    ;(async () => {
      try {
        const { data } = await api.get('/api/auth/me')
        if (data.success && data.user?.profileComplete === false) {
          navigate('/auth/complete-profile', { replace: true })
          return
        }
      } catch {
        /* ignore — other requests will 401 if needed */
      }
    })()
  }, [navigate])

  const handleLogout = async () => {
    try {
      const api = (await import('../utils/axios')).default
      await api.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      navigate('/signin')
    }
  }

  const formatPrice = (price) => {
    return formatMarketPrice(price)
  }

  const formatChange = (change) => {
    const changeMeta = getChangeMeta(change)
    if (!changeMeta) return <span className="text-gray-500">--</span>
    return (
      <span className={changeMeta.isPositive ? 'text-green-500' : 'text-red-500'}>
        {changeMeta.label}
      </span>
    )
  }

  const currentCryptoData = cryptoData[activeCryptoTab] || []

  return (
    <div className="fx-page transition-colors pb-20">
      {/* Header with Hamburger */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              {siteSettings.site.logo ? (
                <img
                  src={getImageUrl(siteSettings.site.logo)}
                  alt={siteSettings.site.name}
                  className="w-8 h-8 rounded-lg object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{siteSettings.site.name.charAt(0)}</span>
                </div>
              )}
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {siteSettings.site.name}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button 
              onClick={() => navigate('/customer-service')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              title="Customer Service"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <NotificationBell />
          </div>
        </div>
      </header>

      <UserSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        siteName={siteSettings.site.name || 'Onchainforexai'}
        logo={siteSettings.site.logo}
        onLogout={handleLogout}
        onOpenTransfer={() => setShowTransferModal(true)}
        onOpenLanguage={() => setShowLanguageModal(true)}
      />


      {/* Main Content */}
      <main className="px-4 py-4 space-y-4 max-w-7xl mx-auto">
        {/* Estimated Total Value */}
        <div className="fx-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Total Value (USDT)</span>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {balanceVisible ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {balanceVisible ? `$${formatPrice(userBalance)}` : '****'}
            </span>
            <button 
              onClick={() => setShowAddFundsModal(true)}
              className="fx-btn fx-btn-primary fx-btn-sm"
            >
              Add Funds
            </button>
          </div>
        </div>

        {/* Crypto Coin List Card */}
        <div className="fx-card">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {['favourites', 'hot', 'alpha', 'new', 'gainers', 'losers'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCryptoTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    activeCryptoTab === tab
                      ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            {cryptoLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : currentCryptoData.length > 0 ? (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-3 gap-4 pb-3 mb-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-600 dark:text-slate-400">
                  <div>Name</div>
                  <div className="text-right">Last Price</div>
                  <div className="text-right">24h Change%</div>
                </div>
                <div className="space-y-3">
                  {currentCryptoData.slice(0, 5).map((coin, index) => (
                    <div key={coin.id || index} className="grid grid-cols-3 gap-4 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{coin.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{coin.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">${formatPrice(coin.price)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs">{formatChange(coin.change24h)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate(`/crypto/${activeCryptoTab}`)}
                  className="w-full mt-4 py-2 text-cyan-600 dark:text-cyan-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  View More
                </button>
              </>
            ) : (
              <EmptyState title="No market data available" icon="market" />
            )}
          </div>
        </div>

        {/* News Card */}
        <div className="fx-card">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg">Discover</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Crypto News & Updates</p>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : news.length > 0 ? (
              news.map((item, index) => (
                <div key={index} className="pb-3 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                  <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{item.source}</span>
                    <span>â€¢</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No news available" icon="search" />
            )}
          </div>
        </div>

        {/* Stock List Card */}
        <div className="fx-card">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg">Stocks</h3>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : stocks.length > 0 ? (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-3 gap-4 pb-3 mb-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-600 dark:text-slate-400">
                  <div>Name</div>
                  <div className="text-right">Last Price</div>
                  <div className="text-right">24h Change%</div>
                </div>
                <div className="space-y-3">
                  {stocks.slice(0, 5).map((stock, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{stock.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{stock.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">${formatPrice(stock.price)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs">{formatChange(stock.change24h)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate('/stocks')}
                  className="w-full mt-4 py-2 text-cyan-600 dark:text-cyan-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  View More
                </button>
              </>
            ) : (
              <EmptyState title="No stock data available" icon="market" />
            )}
          </div>
        </div>

        {/* Forex Card */}
        <div className="fx-card">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg">Forex</h3>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : forex.length > 0 ? (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-3 gap-4 pb-3 mb-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-600 dark:text-slate-400">
                  <div>Pair</div>
                  <div className="text-right">Last Price</div>
                  <div className="text-right">24h Change%</div>
                </div>
                <div className="space-y-3">
                  {forex.slice(0, 5).map((forexPair, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{forexPair.pair}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{forexPair.price}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs">{formatChange(forexPair.change24h)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate('/forex')}
                  className="w-full mt-4 py-2 text-cyan-600 dark:text-cyan-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  View More
                </button>
              </>
            ) : (
              <EmptyState title="No forex data available" icon="market" />
            )}
          </div>
        </div>

        {/* Gold Card */}
        <div className="fx-card">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg">Precious Metals</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gold, Silver & More</p>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : gold ? (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-3 gap-4 pb-3 mb-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-600 dark:text-slate-400">
                  <div>Name</div>
                  <div className="text-right">Last Price</div>
                  <div className="text-right">24h Change%</div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{gold.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{gold.symbol} â€¢ {gold.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">${formatPrice(gold?.price)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs">{formatChange(gold.change24h)}</div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/metals')}
                  className="w-full mt-4 py-2 text-cyan-600 dark:text-cyan-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  View More
                </button>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                Loading gold price...
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-700 z-30 safe-area-bottom backdrop-blur">
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { name: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', route: '/dashboard' },
            { name: 'Market', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', route: '/market' },
            { name: 'Trade', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', route: '/trade' },
            { name: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', route: '/history' },
            { name: 'Asset', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/asset' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={async () => {
                if (item.isAction && item.action) {
                  await item.action()
                } else if (item.route) {
                  navigate(item.route)
                }
              }}
              className={`flex flex-col items-center space-y-1 px-2 py-1.5 rounded-lg transition flex-1 ${
                item.isAction
                  ? 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
                  : location.pathname === item.route
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Language</h3>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {[
                { code: 'en', name: 'English', flag: 'ðŸ‡ºðŸ‡¸' },
                { code: 'es', name: 'EspaÃ±ol', flag: 'ðŸ‡ªðŸ‡¸' },
                { code: 'fr', name: 'FranÃ§ais', flag: 'ðŸ‡«ðŸ‡·' },
                { code: 'de', name: 'Deutsch', flag: 'ðŸ‡©ðŸ‡ª' },
                { code: 'zh', name: 'ä¸­æ–‡', flag: 'ðŸ‡¨ðŸ‡³' },
                { code: 'ja', name: 'æ—¥æœ¬èªž', flag: 'ðŸ‡¯ðŸ‡µ' },
                { code: 'ko', name: 'í•œêµ­ì–´', flag: 'ðŸ‡°ðŸ‡·' },
                { code: 'ar', name: 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©', flag: 'ðŸ‡¸ðŸ‡¦' },
                { code: 'pt', name: 'PortuguÃªs', flag: 'ðŸ‡µðŸ‡¹' },
                { code: 'ru', name: 'Ð ÑƒÑÑÐºÐ¸Ð¹', flag: 'ðŸ‡·ðŸ‡º' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={async () => {
                    try {
                      const response = await api.put('/api/auth/language', { language: lang.code })
                      if (response.data.success) {
                        setUserLanguage(lang.code)
                        setShowLanguageModal(false)
                        // Show success message
                        const toast = (await import('react-hot-toast')).default
                        toast.success(`Language changed to ${lang.name}`)
                      }
                    } catch (error) {
                      console.error('Error updating language:', error)
                      const toast = (await import('react-hot-toast')).default
                      toast.error('Failed to update language')
                    }
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center space-x-3 ${
                    userLanguage === lang.code
                      ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                  {userLanguage === lang.code && (
                    <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              Language preference is saved and will be used for chat and customer service
            </div>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        onSuccess={() => {
          const fetchUserBalance = async () => {
            try {
              const response = await api.get('/api/auth/me')
              if (response.data.success) {
                setUserBalance(response.data.user.balance || 0)
              }
            } catch (error) {
              console.error('Error fetching user balance:', error)
            }
          }
          fetchUserBalance()
        }}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={() => {
          const fetchUserBalance = async () => {
            try {
              const response = await api.get('/api/auth/me')
              if (response.data.success) {
                setUserBalance(response.data.user.balance || 0)
              }
            } catch (error) {
              console.error('Error fetching user balance:', error)
            }
          }
          fetchUserBalance()
        }}
      />
    </div>
  )
}
