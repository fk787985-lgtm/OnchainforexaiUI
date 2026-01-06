import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { API_URL } from '../utils/apiUrl.js'
import ThemeToggle from '../components/ThemeToggle'

export default function LandingPage() {
  const { settings: siteSettings } = useSiteSettings()
  const [scrolled, setScrolled] = useState(false)
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme } = useTheme()
  const marketWidgetRef = useRef(null)
  const cryptoChartRef = useRef(null)
  const stockChartRef = useRef(null)
  const forexChartRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false')
      .then(res => res.json())
      .then(data => {
        setCoins(data.slice(0, 10))
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching coins:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (marketWidgetRef.current && !marketWidgetRef.current.querySelector('script')) {
      marketWidgetRef.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>'
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js'
      script.async = true
      script.innerHTML = JSON.stringify({
        colorTheme: theme === 'dark' ? 'dark' : 'light',
        dateRange: "12M",
        showChart: true,
        locale: "en",
        largeChartUrl: "",
        isTransparent: false,
        showSymbolLogo: true,
        showFloatingTooltip: false,
        width: "100%",
        height: "400",
        tabs: [
          {
            title: "Crypto",
            symbols: [
              { s: "BINANCE:BTCUSDT", d: "Bitcoin" },
              { s: "BINANCE:ETHUSDT", d: "Ethereum" },
              { s: "BINANCE:BNBUSDT", d: "BNB" },
              { s: "BINANCE:SOLUSDT", d: "Solana" },
              { s: "BINANCE:ADAUSDT", d: "Cardano" },
              { s: "BINANCE:XRPUSDT", d: "Ripple" }
            ],
            originalTitle: "Crypto"
          },
          {
            title: "Stocks",
            symbols: [
              { s: "NASDAQ:AAPL", d: "Apple" },
              { s: "NASDAQ:MSFT", d: "Microsoft" },
              { s: "NASDAQ:GOOGL", d: "Google" },
              { s: "NASDAQ:AMZN", d: "Amazon" },
              { s: "NASDAQ:TSLA", d: "Tesla" },
              { s: "NYSE:META", d: "Meta" }
            ],
            originalTitle: "Stocks"
          },
          {
            title: "Forex",
            symbols: [
              { s: "FX:EURUSD", d: "EUR/USD" },
              { s: "FX:GBPUSD", d: "GBP/USD" },
              { s: "FX:USDJPY", d: "USD/JPY" },
              { s: "FX:USDCHF", d: "USD/CHF" },
              { s: "FX:AUDUSD", d: "AUD/USD" },
              { s: "FX:USDCAD", d: "USD/CAD" }
            ],
            originalTitle: "Forex"
          }
        ]
      })
      marketWidgetRef.current.appendChild(script)
    }
  }, [theme])

  useEffect(() => {
    if (cryptoChartRef.current && !cryptoChartRef.current.querySelector('script')) {
      cryptoChartRef.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>'
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
      script.async = true
      script.innerHTML = JSON.stringify({
        symbol: "BINANCE:BTCUSDT",
        width: "100%",
        height: "300",
        locale: "en",
        dateRange: "12M",
        colorTheme: theme === 'dark' ? 'dark' : 'light',
        isTransparent: false,
        autosize: true,
        largeChartUrl: ""
      })
      cryptoChartRef.current.appendChild(script)
    }
  }, [theme])

  useEffect(() => {
    if (stockChartRef.current && !stockChartRef.current.querySelector('script')) {
      stockChartRef.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>'
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
      script.async = true
      script.innerHTML = JSON.stringify({
        symbol: "NASDAQ:AAPL",
        width: "100%",
        height: "300",
        locale: "en",
        dateRange: "12M",
        colorTheme: theme === 'dark' ? 'dark' : 'light',
        isTransparent: false,
        autosize: true,
        largeChartUrl: ""
      })
      stockChartRef.current.appendChild(script)
    }
  }, [theme])

  useEffect(() => {
    if (forexChartRef.current && !forexChartRef.current.querySelector('script')) {
      forexChartRef.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>'
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
      script.async = true
      script.innerHTML = JSON.stringify({
        symbol: "FX:EURUSD",
        width: "100%",
        height: "300",
        locale: "en",
        dateRange: "12M",
        colorTheme: theme === 'dark' ? 'dark' : 'light',
        isTransparent: false,
        autosize: true,
        largeChartUrl: ""
      })
      forexChartRef.current.appendChild(script)
    }
  }, [theme])

  const formatPrice = (price) => {
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    return price.toFixed(2)
  }

  const formatChange = (change) => {
    const isPositive = change >= 0
    return (
      <span className={isPositive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      {/* Navigation */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-gray-800' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {siteSettings.site.logo ? (
                <img
                  src={siteSettings.site.logo?.startsWith('http') ? siteSettings.site.logo : `${API_URL}${siteSettings.site.logo}`}
                  alt={siteSettings.site.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-base sm:text-lg">
                    {siteSettings.site.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {siteSettings.site.name || 'XCrypto'}
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#markets" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Markets</a>
              <a href="#features" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Features</a>
              <a href="#about" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">About</a>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <ThemeToggle />
              <Link
                to="/signin"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-3 sm:px-4 sm:px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg text-xs sm:text-sm"
              >
                Get Started
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col space-y-3 pt-4">
                <a 
                  href="#markets" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition px-4"
                >
                  Markets
                </a>
                <a 
                  href="#features" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition px-4"
                >
                  Features
                </a>
                <a 
                  href="#about" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition px-4"
                >
                  About
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Trade Forex & Crypto
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
              The World's Leading Exchange
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
              Buy, sell, and trade cryptocurrencies and forex with confidence. 
              Join millions of traders worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-base sm:text-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-xl transform hover:scale-105 text-center"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 border-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 rounded-lg font-bold text-base sm:text-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition text-center"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 mt-12 sm:mt-20 max-w-5xl mx-auto px-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-1 sm:mb-2">$2.4T+</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">24h Trading Volume</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-1 sm:mb-2">200+</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Countries & Regions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-1 sm:mb-2">150M+</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Registered Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-1 sm:mb-2">350+</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Trading Pairs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section id="markets" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">Top Cryptocurrencies</h2>
          
          {/* TradingView Market Overview Widget */}
          <div className="mb-12">
            <div 
              ref={marketWidgetRef}
              className="tradingview-widget-container rounded-xl overflow-hidden shadow-lg" 
              style={{ height: '400px', width: '100%' }}
            ></div>
          </div>

          {/* Coin List Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">#</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Coin</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">24h Change</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading markets...</span>
                      </div>
                    </td>
                  </tr>
                ) : coins.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-600 dark:text-gray-400">
                      No data available
                    </td>
                  </tr>
                ) : (
                  coins.map((coin, index) => (
                    <tr 
                      key={coin.id} 
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-medium">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={coin.image} 
                            alt={coin.name} 
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{coin.symbol.toUpperCase()}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">{coin.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">${formatPrice(coin.current_price)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatChange(coin.price_change_percentage_24h)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                        ${(coin.market_cap / 1e9).toFixed(2)}B
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TradingView Chart Widget */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900 dark:text-white">Live Market Charts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Bitcoin (BTC)</h3>
              <div 
                ref={cryptoChartRef}
                className="tradingview-widget-container rounded-lg overflow-hidden" 
                style={{ height: '300px', width: '100%' }}
              ></div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Apple (AAPL)</h3>
              <div 
                ref={stockChartRef}
                className="tradingview-widget-container rounded-lg overflow-hidden" 
                style={{ height: '300px', width: '100%' }}
              ></div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">EUR/USD</h3>
              <div 
                ref={forexChartRef}
                className="tradingview-widget-container rounded-lg overflow-hidden" 
                style={{ height: '300px', width: '100%' }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900 dark:text-white">Why Choose Us</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-8 rounded-xl border border-indigo-100 dark:border-indigo-800 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Secure & Safe</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your funds are protected with industry-leading security measures and insurance coverage.
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-8 rounded-xl border border-indigo-100 dark:border-indigo-800 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Execute trades in milliseconds with our high-performance matching engine.
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-8 rounded-xl border border-indigo-100 dark:border-indigo-800 hover:shadow-xl transition sm:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Low Fees</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Competitive trading fees starting from 0.1% with volume-based discounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 text-white">Ready to Start Trading?</h2>
          <p className="text-lg sm:text-xl text-indigo-100 mb-6 sm:mb-8">
            Join millions of traders and start your journey today.
          </p>
          <Link
            to="/signup"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-600 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-100 transition shadow-2xl transform hover:scale-105"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                {siteSettings.site.logo ? (
                  <img
                    src={siteSettings.site.logo?.startsWith('http') ? siteSettings.site.logo : `${API_URL}${siteSettings.site.logo}`}
                    alt={siteSettings.site.name}
                    className="w-10 h-10 rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {siteSettings.site.name.charAt(0).toUpperCase() || 'X'}
                    </span>
                  </div>
                )}
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {siteSettings.site.name || 'XCrypto'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The world's leading cryptocurrency and forex exchange.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Products</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Spot Trading</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Futures</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Forex</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Company</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Support</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">API</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
            <p>&copy; 2024 {siteSettings.site.name || 'XCrypto'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
