import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { getImageUrl } from '../utils/imageUrl.js'
import ThemeToggle from '../components/ThemeToggle'
import AppDownloadSection from '../components/AppDownloadSection'
import ProfitShowcase from '../components/landing/ProfitShowcase'
import { formatMarketPrice, getChangeMeta, formatMarketCapBillions } from '../utils/formatters/marketFormatters'

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
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

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
    return formatMarketPrice(price)
  }

  const formatChange = (change) => {
    const changeMeta = getChangeMeta(change)
    if (!changeMeta) {
      return <span className="text-gray-500 dark:text-gray-400">--</span>
    }
    return (
      <span className={changeMeta.isPositive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
        {changeMeta.label}
      </span>
    )
  }

  const formatMarketCap = (marketCap) => {
    return formatMarketCapBillions(marketCap)
  }

  const supportEmail =
    siteSettings?.site?.contact?.email || 'support@onchainforexai.com'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors">
      {/* Navigation + support strip */}
      <nav
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-slate-950/95 backdrop-blur-md shadow-lg border-b border-slate-800'
            : 'bg-slate-950/40 backdrop-blur-sm border-b border-white/5'
        }`}
      >
        {/* Fancy support strip */}
        <div className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#060b14] via-[#0b1f3a] to-[#061525]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(17,153,250,0.12),transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1199fa]/70 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[36px] py-1.5 flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: support email chip */}
            <a
              href={`mailto:${supportEmail}`}
              className="group inline-flex items-center gap-2 min-w-0 max-w-[70%] sm:max-w-none rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/[0.1] hover:border-[#1199fa]/40 px-2.5 sm:px-3 py-1 transition backdrop-blur-sm"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1199fa] to-[#0066cc] shadow-md shadow-blue-500/30">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <span className="truncate text-[11px] sm:text-xs">
                <span className="hidden md:inline text-slate-400 font-medium">Support · </span>
                <span className="font-semibold text-[#7dd3fc] group-hover:text-white transition">
                  {supportEmail}
                </span>
              </span>
            </a>

            {/* Center note (desktop) */}
            <p className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 font-medium tracking-wide">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              Markets never sleep — trade anytime
              <span className="text-slate-600">|</span>
              <span className="text-slate-500">Bank-grade security · Instant deposits</span>
            </p>

            {/* Right: status pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                24/7 live
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-slate-300">
                <svg className="w-3 h-3 text-[#2da8ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Secure
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {siteSettings.site.logo ? (
                <img
                  src={getImageUrl(siteSettings.site.logo)}
                  alt={siteSettings.site.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-base sm:text-lg">
                    {siteSettings.site.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                {siteSettings.site.name || 'Onchainforexai'}
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a href="#markets" className="text-sm font-medium text-slate-300 hover:text-cyan-300 transition">Markets</a>
              <a href="#products" className="text-sm font-medium text-slate-300 hover:text-cyan-300 transition">Products</a>
              <a href="#profits" className="text-sm font-medium text-slate-300 hover:text-cyan-300 transition">Performance</a>
              <a href="#features" className="text-sm font-medium text-slate-300 hover:text-cyan-300 transition">Features</a>
              <a href="#security" className="text-sm font-medium text-slate-300 hover:text-cyan-300 transition">Security</a>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />
              <a
                href="#download"
                className="hidden lg:inline-flex text-xs font-semibold text-slate-300 hover:text-[#2da8ff] transition px-2"
              >
                Download
              </a>
              {/* Sign In as clear option next to Sign Up */}
              <Link
                to="/signin"
                className="hidden sm:inline-flex fx-btn fx-btn-sm !min-h-[36px] !px-4 !bg-transparent !text-white !border !border-white/25 hover:!bg-white/10 hover:!border-cyan-400/50"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="hidden sm:inline-flex fx-btn fx-btn-primary fx-btn-sm !min-h-[36px] !px-5"
              >
                Sign Up
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-cyan-300"
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
            <div className="md:hidden mt-2 pb-4 border-t border-slate-800 animate-fade-in">
              <div className="flex flex-col space-y-3 pt-4">
                <a
                  href={`mailto:${supportEmail}`}
                  className="mx-4 text-xs text-[#2da8ff] font-semibold"
                >
                  {supportEmail}
                </a>
                <p className="mx-4 text-[11px] text-slate-500 -mt-1">
                  24/7 trading support · Markets never sleep
                </p>
                <a 
                  href="#markets" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-slate-300 hover:text-cyan-300 transition px-4 py-2 rounded-lg hover:bg-slate-900"
                >
                  Markets
                </a>
                <a 
                  href="#features" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-slate-300 hover:text-cyan-300 transition px-4 py-2 rounded-lg hover:bg-slate-900"
                >
                  Features
                </a>
                <a 
                  href="#security" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-slate-300 hover:text-cyan-300 transition px-4 py-2 rounded-lg hover:bg-slate-900"
                >
                  Security
                </a>
                <div className="pt-2 grid grid-cols-2 gap-2 px-4">
                  <Link
                    to="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-2.5 border border-white/25 text-white rounded-full text-sm font-semibold hover:bg-white/10"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-2.5 fx-btn fx-btn-primary !min-h-[42px] text-sm font-semibold"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section — fancy background (extra top pad for support strip + nav) */}
      <section className="relative pt-28 sm:pt-36 pb-14 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=2400&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060b14]/90 via-[#0b1426]/85 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(17,153,250,0.35),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(0,212,170,0.15),transparent_40%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="text-center lg:text-left">
              <p className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-200 text-[11px] sm:text-sm font-semibold mb-5 sm:mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Spot · Crypto · Forex · CFDs — live now
              </p>
              <h1 className="text-3xl sm:text-5xl md:text-[3.4rem] font-extrabold leading-[1.08] mb-4 sm:mb-6 tracking-tight text-white">
                The exchange for{' '}
                <span className="bg-gradient-to-r from-cyan-300 via-[#2da8ff] to-emerald-300 bg-clip-text text-transparent">
                  serious crypto traders
                </span>
              </h1>
              <p className="text-sm sm:text-lg text-slate-300 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Buy, sell, and manage crypto with live order books, pro charts, and bank-grade security.
                Multi-asset markets in one wallet — the standard set by Crypto.com, Binance, and Coinbase.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/signup" className="fx-btn fx-btn-primary fx-btn-lg">
                  Sign Up — it&apos;s free
                </Link>
                <Link
                  to="/signin"
                  className="fx-btn fx-btn-lg !bg-white/10 !text-white !border !border-white/25 hover:!bg-white/15"
                >
                  Sign In
                </Link>
                <a href="#markets" className="fx-btn fx-btn-lg !bg-transparent !text-cyan-200 !border !border-cyan-400/40">
                  View markets
                </a>
              </div>
              <p className="mt-4 text-[11px] sm:text-xs text-slate-500">
                No commitment · KYC when you need higher limits · Support {supportEmail}
              </p>
            </div>

            {/* Exchange-style portfolio mock */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-6 bg-[#1199fa]/25 blur-3xl rounded-full" />
              <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80"
                  alt="Trading chart"
                  className="w-full h-48 sm:h-56 object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                <div className="relative p-5 -mt-16">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur-xl p-4 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Estimated balance
                        </p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                          $128,402.18
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-400/25 px-2 py-1 rounded-full">
                        +9.4%
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      {[
                        { s: 'BTC', p: '+4.8%' },
                        { s: 'ETH', p: '+3.1%' },
                        { s: 'SOL', p: '+8.2%' }
                      ].map((a) => (
                        <div
                          key={a.s}
                          className="rounded-xl bg-white/5 border border-white/10 py-2"
                        >
                          <p className="text-[10px] text-slate-400 font-medium">{a.s}</p>
                          <p className="text-xs font-bold text-emerald-400">{a.p}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link to="/buy" className="flex-1 text-center text-xs font-bold py-2.5 rounded-full bg-[#1199fa] text-white">
                        Buy
                      </Link>
                      <Link to="/trade" className="flex-1 text-center text-xs font-bold py-2.5 rounded-full bg-white/10 text-white border border-white/15">
                        Trade
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-12 sm:mt-16 max-w-5xl mx-auto">
            {[
              { v: '$2.4T+', l: 'Global volume tracked' },
              { v: '350+', l: 'Markets & pairs' },
              { v: '200+', l: 'Countries supported' },
              { v: '24/7', l: 'Crypto markets open' }
            ].map((s) => (
              <div
                key={s.l}
                className="text-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-4 hover:border-[#1199fa]/30 transition"
              >
                <div className="text-xl sm:text-3xl font-extrabold text-white mb-1">{s.v}</div>
                <div className="text-[11px] sm:text-sm text-slate-400">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live ticker strip */}
      {!loading && coins.length > 0 && (
        <div className="border-y border-slate-800 bg-slate-950/90 overflow-hidden">
          <div className="flex gap-8 py-3 animate-[marquee_40s_linear_infinite] whitespace-nowrap w-max">
            {[...coins, ...coins].map((coin, i) => (
              <span key={`${coin.id}-${i}`} className="inline-flex items-center gap-2 text-xs sm:text-sm px-2">
                <img src={coin.image} alt="" className="w-4 h-4 rounded-full" />
                <span className="font-bold text-white">{coin.symbol?.toUpperCase()}</span>
                <span className="text-slate-400">${formatPrice(coin.current_price)}</span>
                <span
                  className={
                    (coin.price_change_percentage_24h || 0) >= 0
                      ? 'text-emerald-400 font-semibold'
                      : 'text-rose-400 font-semibold'
                  }
                >
                  {(coin.price_change_percentage_24h || 0) >= 0 ? '+' : ''}
                  {Number(coin.price_change_percentage_24h || 0).toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Markets Section */}
      <section id="markets" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2da8ff] mb-2">Markets</p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Live market overview
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl">
                Real-time prices across top cryptocurrencies — same depth you expect from a global exchange.
              </p>
            </div>
            <Link to="/market" className="fx-btn fx-btn-secondary fx-btn-sm !bg-slate-900 !text-white !border-slate-700">
              Trade now
            </Link>
          </div>
          
          {/* TradingView Market Overview Widget */}
          <div className="mb-8 sm:mb-12">
            <div 
              ref={marketWidgetRef}
              className="tradingview-widget-container h-[280px] sm:h-[400px] w-full rounded-xl overflow-hidden shadow-lg border border-slate-800" 
            ></div>
          </div>

          {/* Coin List Table Desktop */}
          <div className="hidden md:block bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">#</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Coin</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-400">Price</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-400">24h Change</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-400 hidden md:table-cell">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <div className="flex items-center justify-center space-x-2 text-slate-400">
                        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading markets...</span>
                      </div>
                    </td>
                  </tr>
                ) : coins.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-400">
                      No data available
                    </td>
                  </tr>
                ) : (
                  coins.map((coin, index) => (
                    <tr 
                      key={coin.id} 
                      className="border-b border-slate-800 hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm text-slate-400 font-medium">{index + 1}</td>
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
                            <div className="text-sm font-semibold text-white">{coin.symbol.toUpperCase()}</div>
                            <div className="text-xs text-slate-400 hidden sm:block">{coin.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-white">${formatPrice(coin.current_price)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatChange(coin.price_change_percentage_24h)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-400 hidden md:table-cell">
                        {formatMarketCap(coin.market_cap)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Coin List Mobile */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center justify-center space-x-2 text-slate-400">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Loading markets...</span>
                </div>
              </div>
            ) : coins.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-400">
                No data available
              </div>
            ) : (
              coins.map((coin, index) => (
                <div key={coin.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="text-xs text-slate-500 w-4">{index + 1}</div>
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">{coin.symbol.toUpperCase()}</div>
                        <div className="text-xs text-slate-400 truncate">{coin.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">${formatPrice(coin.current_price)}</div>
                      <div className="text-xs">{formatChange(coin.price_change_percentage_24h)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* TradingView Chart Widget */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#080e18]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2da8ff] mb-2">Charts</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Cross-asset live charts
            </h2>
            <p className="mt-2 text-slate-400 text-sm max-w-2xl mx-auto">
              Bitcoin, equities, and FX — TradingView power under the hood for analysis that scales.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-lg hover:border-[#1199fa]/30 transition">
              <h3 className="text-lg font-semibold text-white mb-3">Bitcoin (BTC)</h3>
              <div 
                ref={cryptoChartRef}
                className="tradingview-widget-container h-[240px] sm:h-[300px] w-full rounded-lg overflow-hidden" 
              ></div>
            </div>
            
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Apple (AAPL)</h3>
              <div 
                ref={stockChartRef}
                className="tradingview-widget-container h-[240px] sm:h-[300px] w-full rounded-lg overflow-hidden" 
              ></div>
            </div>
            
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-3">EUR/USD</h3>
              <div 
                ref={forexChartRef}
                className="tradingview-widget-container h-[240px] sm:h-[300px] w-full rounded-lg overflow-hidden" 
              ></div>
            </div>
          </div>
        </div>
      </section>

      <ProfitShowcase />

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2da8ff] mb-2">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Exchange-grade experience
            </h2>
            <p className="text-center text-slate-400 mt-3 max-w-2xl mx-auto text-sm sm:text-base">
              Speed, security, and clarity from first deposit to settlement — designed like the world&apos;s top crypto apps.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                t: 'Bank-grade security',
                d: 'Encrypted sessions, withdrawal controls, 2FA, and clear audit trails to protect your assets.'
              },
              {
                t: 'Lightning-fast UI',
                d: 'Responsive order flow and real-time balances so you never miss a move in volatile markets.'
              },
              {
                t: 'Transparent pricing',
                d: 'Clear fees on trading and funding — no surprises when you deposit, trade, or withdraw.'
              },
              {
                t: 'Deep market data',
                d: 'Live tickers, CoinGecko-powered lists, and TradingView charts for crypto, stocks, and FX.'
              },
              {
                t: 'Buy crypto easily',
                d: 'Card and transfer paths to fund your account and convert into tradeable balances fast.'
              },
              {
                t: 'Mobile-first design',
                d: 'Trade, fund, and manage KYC from any device with a polished dark interface.'
              }
            ].map((f) => (
              <div
                key={f.t}
                className="bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-7 rounded-2xl border border-slate-800 hover:border-[#1199fa]/40 hover:shadow-[0_16px_40px_rgba(17,153,250,0.1)] transition"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#1199fa] to-[#0066cc] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">{f.t}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#080e18]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2da8ff] mb-2">Security</p>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Trust at exchange scale</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Protecting your funds</h3>
              <ul className="space-y-3 text-slate-300 text-sm">
                {[
                  'KYC verification with clear status for higher limits',
                  'Controlled deposits & withdrawals with full history',
                  '2FA and session security on sensitive actions',
                  '24/7 support at ' + supportEmail
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Built to scale with you</h3>
              <ul className="space-y-3 text-slate-300 text-sm">
                {[
                  'Spot trading, multi-asset markets, and portfolio tools',
                  'Real-time widgets for crypto, stocks, and forex',
                  'Mobile-optimized onboarding and trade journeys',
                  'Admin-grade ops inspired by top global exchanges'
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[#2da8ff] font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1426] via-[#0d4f9e] to-[#1199fa]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-4 sm:mb-6 text-white tracking-tight">
            Ready to trade like a pro?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Open a free account, fund your wallet, and access live crypto markets in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="fx-btn fx-btn-lg !bg-white !text-[#0b1426] !shadow-xl">
              Sign Up free
            </Link>
            <Link to="/signin" className="fx-btn fx-btn-lg !bg-white/12 !text-white !border !border-white/30">
              Sign In
            </Link>
            <a href="#download" className="fx-btn fx-btn-lg !bg-transparent !text-white !border !border-white/25">
              Download apps
            </a>
          </div>
        </div>
      </section>

      <AppDownloadSection
        siteName={siteSettings.site.name || 'Onchain'}
        onchainUrl={typeof window !== 'undefined' ? window.location.origin : 'https://onchainforexai.com'}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 sm:py-14 px-4 sm:px-6 lg:px-8 bg-[#060b14]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                {siteSettings.site.logo ? (
                  <img
                    src={getImageUrl(siteSettings.site.logo)}
                    alt={siteSettings.site.name}
                    className="w-10 h-10 rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1199fa] to-[#0066cc] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {siteSettings.site.name.charAt(0).toUpperCase() || 'X'}
                    </span>
                  </div>
                )}
                <span className="text-xl font-extrabold text-white">
                  {siteSettings.site.name || 'Onchainforexai'}
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                A professional crypto exchange for spot trading, multi-asset markets, and secure funding.
              </p>
              <a
                href={`mailto:${supportEmail}`}
                className="mt-4 inline-flex text-sm font-semibold text-[#2da8ff] hover:underline"
              >
                {supportEmail}
              </a>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white text-sm">Trade</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/market" className="hover:text-cyan-300 transition">Markets</Link></li>
                <li><Link to="/trade" className="hover:text-cyan-300 transition">Spot trading</Link></li>
                <li><Link to="/buy" className="hover:text-cyan-300 transition">Buy crypto</Link></li>
                <li><a href="#products" className="hover:text-cyan-300 transition">Products</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white text-sm">Account</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/signup" className="hover:text-cyan-300 transition">Sign Up</Link></li>
                <li><Link to="/signin" className="hover:text-cyan-300 transition">Sign In</Link></li>
                <li><Link to="/kyc/verify" className="hover:text-cyan-300 transition">KYC</Link></li>
                <li><a href="#download" className="hover:text-cyan-300 transition">Download app</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white text-sm">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/help-support" className="hover:text-cyan-300 transition">Help center</Link></li>
                <li><Link to="/customer-service" className="hover:text-cyan-300 transition">Live support</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-cyan-300 transition">Privacy</Link></li>
                <li>
                  <a href={`mailto:${supportEmail}`} className="hover:text-cyan-300 transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col sm:flex-row justify-between gap-3 text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} {siteSettings.site.name || 'Onchainforexai'}. All rights reserved.</p>
            <p className="text-xs text-slate-600">Trade responsibly. Crypto assets can be volatile.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
