import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { getCryptoPrices, getFavourites, getCryptoNews } from '../services/cryptoApi'
import { getPopularStocks } from '../services/stocksApi'
import { getForexRates, updateForexRates } from '../services/forexApi'
import { getGoldPrice } from '../services/metalsApi'
import api from '../utils/axios'
import AddFundsModal from '../components/AddFundsModal'

// User Info Card Component
function UserInfoCard() {
  const [user, setUser] = useState(null)
  const [kycStatus, setKycStatus] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUserInfo()
    fetchKYCStatus()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/api/auth/me')
      if (response.data.success) {
        setUser(response.data.user)
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const fetchKYCStatus = async () => {
    try {
      const response = await api.get('/api/kyc/status')
      if (response.data.success) {
        setKycStatus(response.data)
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error)
    }
  }

  if (!user) {
    return <div className="text-sm text-gray-500">Loading...</div>
  }

  return (
    <div className="flex items-center space-x-2 sm:space-x-3">
      <div className="w-10 h-10 sm:w-12 sm:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white/30">
        <span className="text-white font-bold text-base sm:text-lg md:text-xl">
          {user.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1.5 sm:space-x-2 mb-0.5 sm:mb-1">
          <div className="text-xs sm:text-sm font-semibold text-white truncate">
            {user.fullName || user.uniqueId || 'User'}
          </div>
          {kycStatus?.isVerified ? (
            <span className="px-1.5 sm:px-2 py-0.5 bg-green-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium rounded-full flex items-center space-x-0.5 sm:space-x-1">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">Verified</span>
            </span>
          ) : (
            <button
              onClick={() => {
                navigate('/kyc/verify')
              }}
              className="px-1.5 sm:px-2 py-0.5 bg-yellow-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium rounded-full hover:bg-yellow-400/90 transition"
            >
              Verify
            </button>
          )}
        </div>
        <div className="text-[10px] sm:text-xs text-white/80 truncate">
          {user.email}
        </div>
        <div className="text-[10px] sm:text-xs text-white/60 mt-0.5 hidden sm:block">
          ID: {user.uniqueId || 'N/A'}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [activeCryptoTab, setActiveCryptoTab] = useState('hot')
  const [cryptoData, setCryptoData] = useState({})
  const [stocks, setStocks] = useState([])
  const [forex, setForex] = useState([])
  const [news, setNews] = useState([])
  const [gold, setGold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [expandedNotifications, setExpandedNotifications] = useState(new Set())
  const userInteractedRef = useRef(false)
  const audioContextRef = useRef(null)
  const [cryptoLoading, setCryptoLoading] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
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
    } else {
      fetchNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [navigate])

  // Track user interaction for audio playback
  useEffect(() => {
    const handleUserInteraction = () => {
      userInteractedRef.current = true
      // Initialize audio context on first interaction
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        } catch (e) {
          console.log('Audio context initialization failed:', e)
        }
      }
    }
    
    // Listen for any user interaction
    document.addEventListener('click', handleUserInteraction, { once: true })
    document.addEventListener('keydown', handleUserInteraction, { once: true })
    document.addEventListener('touchstart', handleUserInteraction, { once: true })
    
    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [])

  const playNotificationSound = () => {
    // Only play sound if user has interacted with the page
    if (!userInteractedRef.current) {
      console.log('Sound playback skipped: user has not interacted with page yet')
      return
    }
    
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OSfTQ8MUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBtpvfDkn00PDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBACg==')
      audio.volume = 0.5
      
      // Resume audio context if suspended (required by some browsers)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(e => console.log('Audio context resume failed:', e))
      }
      
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          // Only log if it's not a user interaction error
          if (e.name !== 'NotAllowedError') {
            console.log('Sound play failed:', e)
          }
        })
      }
    } catch (error) {
      console.log('Sound notification error:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/auth/notifications')
      if (response.data.success) {
        const newNotifications = response.data.notifications || []
        const previousUnreadCount = unreadCount
        setNotifications(newNotifications)
        const newUnreadCount = newNotifications.filter(n => !n.read).length
        setUnreadCount(newUnreadCount)
        
        // Play sound if new unread notifications
        if (newUnreadCount > previousUnreadCount) {
          const newUnread = newNotifications.filter(n => !n.read && (!notifications.find(old => old._id === n._id) || notifications.find(old => old._id === n._id)?.read))
          if (newUnread.length > 0 && newUnread.some(n => n.playSound !== false)) {
            playNotificationSound()
          }
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      // Convert to string for comparison
      const notificationIdStr = String(notificationId).trim()
      console.log('🔔 [Frontend] Marking notification as read:', notificationIdStr)
      
      // Find the notification
      const notification = notifications.find(n => String(n._id).trim() === notificationIdStr)
      if (!notification) {
        console.error('❌ [Frontend] Notification not found in local state:', notificationIdStr)
        return
      }
      
      // Optimistically update the UI first - mark as read (even if already read, to ensure sync)
      const wasUnread = !notification.read
      setNotifications(prev => {
        const updated = prev.map(n => {
          const nIdStr = String(n._id).trim()
          if (nIdStr === notificationIdStr) {
            console.log('🔔 [Frontend] Optimistically marking as read:', nIdStr)
            return { ...n, read: true }
          }
          return n
        })
        return updated
      })
      
      // Update unread count immediately if it was unread
      if (wasUnread) {
        setUnreadCount(prev => {
          const newCount = Math.max(0, prev - 1)
          console.log('🔔 [Frontend] Unread count updated immediately:', prev, '->', newCount)
          return newCount
        })
      }
      
      // Make API call - ALWAYS call API to ensure server sync
      try {
        const response = await api.put(`/api/auth/notifications/${encodeURIComponent(notificationIdStr)}/read`)
        console.log('🔔 [Frontend] API response:', response.data)
        
        if (response.data.success) {
          console.log('✅ [Frontend] Notification marked as read successfully')
          // Refresh notifications to get updated unread count from server
          await fetchNotifications()
        } else {
          console.error('❌ [Frontend] API returned success: false')
          await fetchNotifications()
        }
      } catch (apiError) {
        console.error('❌ [Frontend] API call error:', apiError)
        // Still refresh to sync with server
        await fetchNotifications()
      }
    } catch (error) {
      console.error('❌ [Frontend] Error marking notification as read:', error)
      console.error('❌ [Frontend] Error details:', error.response?.data)
      // Refresh on error to sync with server
      await fetchNotifications()
    }
  }

  const markAllAsRead = async () => {
    try {
      console.log('🔔 [Frontend] Marking all notifications as read')
      
      // Optimistically update the UI first
      const currentUnreadCount = unreadCount
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      console.log('🔔 [Frontend] Optimistically marked all as read. Previous unread count:', currentUnreadCount)
      
      const response = await api.put('/api/auth/notifications/read-all')
      console.log('🔔 [Frontend] Mark all as read API response:', response.data)
      
      if (response.data.success) {
        console.log('✅ [Frontend] All notifications marked as read successfully')
        // Immediately refresh notifications to ensure sync with server
        await fetchNotifications()
      } else {
        console.error('❌ [Frontend] API returned success: false')
        // If API call failed, revert the optimistic update
        await fetchNotifications()
      }
    } catch (error) {
      console.error('❌ [Frontend] Error marking all as read:', error)
      console.error('❌ [Frontend] Error details:', error.response?.data)
      // Revert optimistic update on error
      await fetchNotifications()
      alert('Failed to mark all notifications as read. Please try again.')
    }
  }

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
    if (price === 0 || !price) return '0.00'
    if (price < 0.01) {
      return price.toFixed(6)
    }
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

  const currentCryptoData = cryptoData[activeCryptoTab] || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors pb-20">
      {/* Header with Hamburger */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              {siteSettings.site.logo ? (
                <img
                  src={siteSettings.site.logo?.startsWith('http') ? siteSettings.site.logo : `${import.meta.env.VITE_API_URL || 'https://api.onchainforexai.com'}${siteSettings.site.logo}`}
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
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition relative"
              title="Customer Service"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition relative"
                title="Notifications"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                    <h3 className="font-bold text-gray-900 dark:text-white">Notifications ({notifications.length})</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          await markAllAsRead()
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(80vh - 80px)' }}>
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.map((notification) => {
                          const notifId = String(notification._id).trim()
                          const isExpanded = expandedNotifications.has(notifId)
                          const messageLength = notification.message?.length || 0
                          const shouldTruncate = messageLength > 150
                          const displayMessage = shouldTruncate && !isExpanded 
                            ? notification.message.substring(0, 150) + '...'
                            : notification.message

                          return (
                            <div
                              key={notification._id}
                              onClick={async (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // ALWAYS mark as read when clicked (even if already read, to ensure sync)
                                console.log('🔔 [Frontend] Clicked notification, marking as read:', notifId)
                                await markAsRead(notifId)
                              }}
                              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                                !notification.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                  notification.type === 'success' ? 'bg-green-500' :
                                  notification.type === 'warning' ? 'bg-yellow-500' :
                                  notification.type === 'error' ? 'bg-red-500' :
                                  'bg-blue-500'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                                    {notification.title}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
                                    {displayMessage}
                                  </div>
                                  {shouldTruncate && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setExpandedNotifications(prev => {
                                          const newSet = new Set(prev)
                                          if (isExpanded) {
                                            newSet.delete(notifId)
                                          } else {
                                            newSet.add(notifId)
                                          }
                                          return newSet
                                        })
                                      }}
                                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 font-medium"
                                    >
                                      {isExpanded ? 'Show less' : 'Show more'}
                                    </button>
                                  )}
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </div>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-56 sm:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out ${
sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header - Improved UI */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 sm:p-4 md:p-5 text-white">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <span className="text-lg font-bold">{siteSettings.site.name || 'XCrypto'}</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <UserInfoCard />
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
            <button 
              onClick={() => {
                navigate('/profile')
                setSidebarOpen(false)
              }}
              className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Personal Info</span>
            </button>
            <button 
              onClick={() => {
                navigate('/profile/deposits')
                setSidebarOpen(false)
              }}
              className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Deposits</span>
            </button>
            <button 
              onClick={() => {
                navigate('/profile/withdrawals')
                setSidebarOpen(false)
              }}
              className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              <span>Withdrawals</span>
            </button>
            <button 
              onClick={() => {
                navigate('/profile/transfers')
                setSidebarOpen(false)
              }}
              className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Transfers</span>
            </button>
            {/* Settings with Submenu */}
            <div>
              <button 
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-between text-sm sm:text-base"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </div>
                <svg 
                  className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Settings Submenu */}
              {settingsOpen && (
                <div className="ml-3 sm:ml-4 mt-1 space-y-0.5 sm:space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3 sm:pl-4">
                  <button 
                    onClick={() => {
                      navigate('/settings/change-password')
                      setSidebarOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>Change Password</span>
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/settings/2fa')
                      setSidebarOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Enable 2FA</span>
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/privacy-policy')
                      setSidebarOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Privacy Policy</span>
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/help-support')
                      setSidebarOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Help & Support</span>
                  </button>
                </div>
              )}
            </div>
            <button className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Spot Trading</span>
            </button>
            <button className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Futures</span>
            </button>
            <button className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>P2P Trading</span>
            </button>
            <button className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Earn</span>
            </button>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 space-y-1 sm:space-y-2">
            <button 
              onClick={() => setShowLanguageModal(true)}
              className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>Language</span>
            </button>
            <button 
              onClick={() => {
                navigate('/customer-service')
                setSidebarOpen(false)
              }}
              className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Customer Service</span>
            </button>
            <button 
              onClick={async () => {
                setSidebarOpen(false)
                await handleLogout()
              }}
              className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base text-red-600 dark:text-red-400"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4 max-w-7xl mx-auto">
        {/* Estimated Total Value */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Total Value (USDT)</span>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition"
            >
              Add Funds
            </button>
          </div>
        </div>

        {/* Crypto Coin List Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {['favourites', 'hot', 'alpha', 'new', 'gainers', 'losers'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCryptoTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    activeCryptoTab === tab
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                <div className="grid grid-cols-3 gap-4 pb-3 mb-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-xs text-gray-600 dark:text-gray-400">
                  <div>Name</div>
                  <div className="text-right">Last Price</div>
                  <div className="text-right">24h Change%</div>
                </div>
                <div className="space-y-3">
                  {currentCryptoData.slice(0, 5).map((coin, index) => (
                    <div key={coin.id || index} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
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
                  className="w-full mt-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  View More
                </button>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* News Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
                <div key={index} className="pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                  <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No news available
              </div>
            )}
          </div>
        </div>

        {/* Stock List Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
                <div className="grid grid-cols-3 gap-4 pb-3 mb-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-xs text-gray-600 dark:text-gray-400">
                  <div>Name</div>
                  <div className="text-right">Last Price</div>
                  <div className="text-right">24h Change%</div>
                </div>
                <div className="space-y-3">
                  {stocks.slice(0, 5).map((stock, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
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
                  className="w-full mt-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  View More
                </button>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No stock data available
              </div>
            )}
          </div>
        </div>

        {/* Forex Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
                <div className="grid grid-cols-3 gap-4 pb-3 mb-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-xs text-gray-600 dark:text-gray-400">
                  <div>Pair</div>
                  <div className="text-right">Last Price</div>
                  <div className="text-right">24h Change%</div>
                </div>
                <div className="space-y-3">
                  {forex.slice(0, 5).map((forexPair, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
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
                  className="w-full mt-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  View More
                </button>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No forex data available
              </div>
            )}
          </div>
        </div>

        {/* Gold Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
                <div className="grid grid-cols-3 gap-4 pb-3 mb-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-xs text-gray-600 dark:text-gray-400">
                  <div>Name</div>
                  <div className="text-right">Last Price</div>
                  <div className="text-right">24h Change%</div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{gold.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{gold.symbol} • {gold.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">${formatPrice(gold.price)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs">{formatChange(gold.change24h)}</div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/metals')}
                  className="w-full mt-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 safe-area-bottom">
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
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Language</h3>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {[
                { code: 'en', name: 'English', flag: '🇺🇸' },
                { code: 'es', name: 'Español', flag: '🇪🇸' },
                { code: 'fr', name: 'Français', flag: '🇫🇷' },
                { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                { code: 'zh', name: '中文', flag: '🇨🇳' },
                { code: 'ja', name: '日本語', flag: '🇯🇵' },
                { code: 'ko', name: '한국어', flag: '🇰🇷' },
                { code: 'ar', name: 'العربية', flag: '🇸🇦' },
                { code: 'pt', name: 'Português', flag: '🇵🇹' },
                { code: 'ru', name: 'Русский', flag: '🇷🇺' }
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
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
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
    </div>
  )
}
