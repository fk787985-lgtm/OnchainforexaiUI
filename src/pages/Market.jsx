import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCryptoPrices } from '../services/cryptoApi'
import { getPopularStocks } from '../services/stocksApi'
import { getForexRates } from '../services/forexApi'
import { getAllMetals } from '../services/metalsApi'
import { formatMarketPrice, getChangeMeta } from '../utils/formatters/marketFormatters'
import BottomNav from '../components/layout/BottomNav'
import CoinLogo from '../components/common/CoinLogo'
import NotificationBell from '../components/notifications/NotificationBell'

const TABS = [
  { id: 'crypto', label: 'Crypto' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'forex', label: 'Forex' },
  { id: 'metals', label: 'Metals' }
]

const CRYPTO_CATS = [
  { id: 'hot', label: 'Hot' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'losers', label: 'Losers' },
  { id: 'new', label: 'New' },
  { id: 'favourites', label: 'Favorites' }
]

export default function Market() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('crypto')
  const [cryptoData, setCryptoData] = useState([])
  const [stocks, setStocks] = useState([])
  const [forex, setForex] = useState([])
  const [metals, setMetals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('change')
  const [cryptoCategory, setCryptoCategory] = useState('hot')

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(() => fetchAllData(false), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchCryptoData()
  }, [cryptoCategory])

  const fetchAllData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      await Promise.all([fetchCryptoData(false), fetchStocks(), fetchForex(), fetchMetals()])
    } catch (error) {
      console.error('Error fetching market data:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const fetchCryptoData = async () => {
    try {
      setCryptoData(await getCryptoPrices(cryptoCategory))
    } catch (error) {
      console.error('Error fetching crypto:', error)
    }
  }

  const fetchStocks = async () => {
    try {
      setStocks(await getPopularStocks())
    } catch (error) {
      console.error('Error fetching stocks:', error)
    }
  }

  const fetchForex = async () => {
    try {
      setForex(await getForexRates())
    } catch (error) {
      console.error('Error fetching forex:', error)
    }
  }

  const fetchMetals = async () => {
    try {
      setMetals(await getAllMetals())
    } catch (error) {
      console.error('Error fetching metals:', error)
    }
  }

  const rawData = useMemo(() => {
    switch (activeTab) {
      case 'crypto':
        return cryptoData
      case 'stocks':
        return stocks
      case 'forex':
        return forex
      case 'metals':
        return metals
      default:
        return []
    }
  }, [activeTab, cryptoData, stocks, forex, metals])

  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let data = rawData.filter((item) => {
      if (!q) return true
      if (activeTab === 'forex') return item.pair?.toLowerCase().includes(q)
      return (
        item.name?.toLowerCase().includes(q) || item.symbol?.toLowerCase().includes(q)
      )
    })

    data = [...data].sort((a, b) => {
      if (sortBy === 'price') return (b.price || 0) - (a.price || 0)
      if (sortBy === 'name') {
        const an = activeTab === 'forex' ? a.pair : a.symbol || a.name
        const bn = activeTab === 'forex' ? b.pair : b.symbol || b.name
        return String(an || '').localeCompare(String(bn || ''))
      }
      return (b.change24h || 0) - (a.change24h || 0)
    })
    return data
  }, [rawData, searchTerm, sortBy, activeTab])

  // Top movers strip (view only / quick jump)
  const topMovers = useMemo(() => {
    return [...rawData]
      .filter((i) => i.change24h != null)
      .sort((a, b) => Math.abs(b.change24h || 0) - Math.abs(a.change24h || 0))
      .slice(0, 8)
  }, [rawData])

  const openTrade = (item) => {
    const symbol = activeTab === 'forex' ? item.pair : item.symbol || item.name
    navigate(`/trade/${activeTab}/${encodeURIComponent(symbol)}`, {
      state: { item, type: activeTab }
    })
  }

  const changePill = (change) => {
    const meta = getChangeMeta(change)
    if (!meta) return <span className="text-[var(--fx-color-text-muted)] text-[11px]">—</span>
    return (
      <span
        className={`inline-flex min-w-[62px] justify-center px-1.5 py-1 rounded text-[11px] font-semibold tabular-nums ${
          meta.isPositive
            ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
        }`}
      >
        {meta.label}
      </span>
    )
  }

  return (
    <div className="fx-page min-h-screen pb-24">
      {/* Binance-style sticky top */}
      <header className="sticky top-0 z-40 bg-[var(--fx-color-surface)] border-b border-[var(--fx-color-border)]">
        <div className="max-w-3xl mx-auto">
          {/* Title row */}
          <div className="h-12 px-4 flex items-center justify-between">
            <h1 className="text-[16px] font-semibold tracking-tight">Markets</h1>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => fetchAllData(false)}
                className="p-2 rounded-lg text-[var(--fx-color-text-muted)] hover:bg-[var(--fx-color-surface-muted)]"
                aria-label="Refresh"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <NotificationBell />
            </div>
          </div>

          {/* Search — always prominent */}
          <div className="px-4 pb-2.5">
            <div className="relative">
              <svg
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fx-color-text-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search coin / pair"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--fx-color-bg)] border border-[var(--fx-color-border)] text-[13px] placeholder:text-[var(--fx-color-text-muted)] focus:outline-none focus:border-[var(--fx-color-primary)]"
              />
            </div>
          </div>

          {/* Market type tabs */}
          <div className="px-4 flex gap-5 border-b border-[var(--fx-color-border)] overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setSearchTerm('')
                }}
                className={`relative pb-2.5 text-[13px] whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'text-[var(--fx-color-text)] font-semibold'
                    : 'text-[var(--fx-color-text-muted)] font-medium'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 rounded-full bg-[var(--fx-color-primary)]" />
                )}
              </button>
            ))}
          </div>

          {/* Crypto sub-categories */}
          {activeTab === 'crypto' && (
            <div className="px-4 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
              {CRYPTO_CATS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCryptoCategory(c.id)}
                  className={`h-7 px-3 rounded-full text-[11px] font-medium whitespace-nowrap transition ${
                    cryptoCategory === c.id
                      ? 'bg-[var(--fx-color-primary)] text-white'
                      : 'bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text-muted)]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        {/* Top movers strip */}
        {!searchTerm && topMovers.length > 0 && (
          <div className="px-4 py-3 border-b border-[var(--fx-color-border)]">
            <p className="text-[11px] font-medium text-[var(--fx-color-text-muted)] mb-2 uppercase tracking-wide">
              Top movers
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {topMovers.map((item, i) => {
                const label = activeTab === 'forex' ? item.pair : item.symbol || item.name
                const up = (item.change24h || 0) >= 0
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => openTrade(item)}
                    className="shrink-0 min-w-[108px] rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] px-3 py-2.5 text-left hover:border-[var(--fx-color-primary)] transition"
                  >
                    <p className="text-[12px] font-semibold truncate">{label}</p>
                    <p className="text-[12px] font-medium tabular-nums mt-0.5">
                      {activeTab === 'forex' ? item.price : `$${formatMarketPrice(item.price)}`}
                    </p>
                    <p
                      className={`text-[11px] font-semibold tabular-nums mt-0.5 ${
                        up ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {up ? '+' : ''}
                      {(item.change24h || 0).toFixed(2)}%
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Column headers + sort */}
        <div className="px-4 py-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-[var(--fx-color-text-muted)]">
          <button
            type="button"
            onClick={() => setSortBy('name')}
            className={sortBy === 'name' ? 'text-[var(--fx-color-primary)]' : ''}
          >
            Name
          </button>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setSortBy('price')}
              className={sortBy === 'price' ? 'text-[var(--fx-color-primary)]' : ''}
            >
              Last price
            </button>
            <button
              type="button"
              onClick={() => setSortBy('change')}
              className={`w-[68px] text-right ${sortBy === 'change' ? 'text-[var(--fx-color-primary)]' : ''}`}
            >
              24h %
            </button>
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-[var(--fx-color-border)] pb-4">
          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="w-7 h-7 rounded-full border-2 border-[var(--fx-color-primary)] border-t-transparent animate-spin" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[13px] font-medium">No results</p>
              <p className="text-[12px] text-[var(--fx-color-text-muted)] mt-1">Try another search</p>
            </div>
          ) : (
            filteredData.map((item, index) => {
              const name = activeTab === 'forex' ? item.pair : item.symbol || item.name
              const sub = activeTab === 'forex' ? 'FX' : item.name
              const price =
                activeTab === 'forex' ? item.price : `$${formatMarketPrice(item.price)}`

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => openTrade(item)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--fx-color-surface-muted)]/60 transition text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {activeTab === 'crypto' ? (
                      <CoinLogo symbol={item.symbol} image={item.image} name={item.name} size="sm" />
                    ) : item.image ? (
                      <img src={item.image} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--fx-color-surface-muted)] flex items-center justify-center text-[10px] font-bold shrink-0">
                        {String(name || '?').slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate">{name}</p>
                      {sub && sub !== name && (
                        <p className="text-[11px] text-[var(--fx-color-text-muted)] truncate">{sub}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold tabular-nums">{price}</p>
                  </div>
                  <div className="w-[68px] flex justify-end shrink-0">{changePill(item.change24h)}</div>
                </button>
              )
            })
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
