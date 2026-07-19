import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCryptoPrices } from '../services/cryptoApi'
import { getPopularStocks } from '../services/stocksApi'
import { getForexRates } from '../services/forexApi'
import { getAllMetals } from '../services/metalsApi'
import api from '../utils/axios'
import BottomNav from '../components/layout/BottomNav'
import CoinLogo from '../components/common/CoinLogo'
import NotificationBell from '../components/notifications/NotificationBell'

const TYPES = [
  { id: 'crypto', label: 'Crypto' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'forex', label: 'Forex' },
  { id: 'metals', label: 'Metals' }
]

/** Top option chips — view / quick filter only */
const TRADE_OPTIONS = [
  { id: 'spot', label: 'Spot', hint: 'Cash markets' },
  { id: 'futures', label: 'Futures', hint: 'Leveraged' },
  { id: 'options', label: 'Options', hint: 'Coming soon' },
  { id: 'convert', label: 'Convert', hint: 'Quick swap' }
]

export default function Trade() {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState('crypto')
  const [tradeMode, setTradeMode] = useState('spot')
  const [cryptoAssets, setCryptoAssets] = useState([])
  const [stocksAssets, setStocksAssets] = useState([])
  const [forexAssets, setForexAssets] = useState([])
  const [metalsAssets, setMetalsAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userBalance, setUserBalance] = useState(0)
  const [balanceVisible, setBalanceVisible] = useState(() => {
    try {
      const v = localStorage.getItem('fx_balance_visible')
      return v === null ? true : v === 'true'
    } catch {
      return true
    }
  })

  const toggleBalanceVisible = () => {
    setBalanceVisible((prev) => {
      const next = !prev
      try {
        localStorage.setItem('fx_balance_visible', String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        const response = await api.get('/api/auth/me')
        if (response.data.success) setUserBalance(response.data.user.balance || 0)
      } catch (error) {
        console.error('Error fetching user balance:', error)
      }
    }

    fetchUserBalance()
    fetchAllAssets()
    const interval = setInterval(() => {
      fetchAllAssets()
      fetchUserBalance()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchAllAssets = async () => {
    try {
      const [crypto, stocks, forex, metals] = await Promise.all([
        getCryptoPrices('hot').catch(() => []),
        getPopularStocks().catch(() => []),
        getForexRates().catch(() => []),
        getAllMetals().catch(() => [])
      ])
      setCryptoAssets(crypto)
      setStocksAssets(stocks)
      setForexAssets(forex)
      setMetalsAssets(metals)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  const currentAssets = useMemo(() => {
    switch (selectedType) {
      case 'crypto':
        return cryptoAssets
      case 'stocks':
        return stocksAssets
      case 'forex':
        return forexAssets
      case 'metals':
        return metalsAssets
      default:
        return []
    }
  }, [selectedType, cryptoAssets, stocksAssets, forexAssets, metalsAssets])

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return currentAssets
    const q = searchQuery.toLowerCase()
    return currentAssets.filter((asset) => {
      if (selectedType === 'forex') return asset.pair?.toLowerCase().includes(q)
      return asset.name?.toLowerCase().includes(q) || asset.symbol?.toLowerCase().includes(q)
    })
  }, [currentAssets, searchQuery, selectedType])

  // Featured pairs for top strip (view + navigate)
  const featured = useMemo(() => {
    return [...currentAssets]
      .sort((a, b) => Math.abs(b.change24h || 0) - Math.abs(a.change24h || 0))
      .slice(0, 6)
  }, [currentAssets])

  const formatPrice = (price) => {
    const numPrice = Number(price)
    if (!price && price !== 0) return '0.00'
    if (isNaN(numPrice)) return '0.00'
    if (numPrice < 0.01) return numPrice.toFixed(6)
    if (numPrice < 1) return numPrice.toFixed(4)
    return numPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatChange = (change) => {
    const value = parseFloat(change) || 0
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const handleAssetClick = (asset) => {
    const symbol = selectedType === 'forex' ? asset.pair : asset.symbol || asset.name
    navigate(`/trade/${selectedType}/${encodeURIComponent(symbol)}`, {
      state: { item: asset, type: selectedType }
    })
  }

  return (
    <div className="fx-page min-h-screen pb-24">
      {/* Sticky top — Binance trade hub */}
      <header className="sticky top-0 z-40 bg-[var(--fx-color-surface)] border-b border-[var(--fx-color-border)]">
        <div className="max-w-3xl mx-auto">
          {/* Balance bar */}
          <div className="h-11 px-4 flex items-center justify-between border-b border-[var(--fx-color-border)] bg-[var(--fx-color-bg)]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] text-[var(--fx-color-text-muted)] shrink-0">Balance</span>
              <span className="text-[14px] font-semibold tabular-nums truncate">
                {balanceVisible ? userBalance.toFixed(2) : '••••••'}{' '}
                <span className="text-[11px] font-medium text-[var(--fx-color-text-muted)]">USDT</span>
              </span>
              <button
                type="button"
                onClick={toggleBalanceVisible}
                className="p-1 text-[var(--fx-color-text-muted)]"
                aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {balanceVisible ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  )}
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/asset')}
              className="text-[12px] font-semibold text-[var(--fx-color-primary)]"
            >
              Deposit
            </button>
          </div>

          {/* Title + search */}
          <div className="px-4 pt-3 pb-2 space-y-2.5">
            <div className="flex items-center justify-between">
              <h1 className="text-[16px] font-semibold tracking-tight">Trade</h1>
              <div className="flex items-center gap-1">
                <NotificationBell />
                <button
                  type="button"
                  onClick={() => navigate('/history')}
                  className="text-[12px] font-medium text-[var(--fx-color-text-muted)] hover:text-[var(--fx-color-primary)]"
                >
                  Orders
                </button>
              </div>
            </div>

            {/* Product options — view only selection */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {TRADE_OPTIONS.map((opt) => {
                const active = tradeMode === opt.id
                const disabled = opt.id === 'options' || opt.id === 'convert'
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setTradeMode(opt.id)}
                    className={`shrink-0 rounded-xl border px-3.5 py-2 text-left transition min-w-[92px] ${
                      active
                        ? 'border-[var(--fx-color-primary)] bg-[color-mix(in_srgb,var(--fx-color-primary)_10%,transparent)]'
                        : 'border-[var(--fx-color-border)] bg-[var(--fx-color-surface)]'
                    } ${disabled ? 'opacity-50' : ''}`}
                  >
                    <p className={`text-[12px] font-semibold ${active ? 'text-[var(--fx-color-primary)]' : ''}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-[var(--fx-color-text-muted)] mt-0.5">{opt.hint}</p>
                  </button>
                )
              })}
            </div>

            {/* Search */}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trading pair"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--fx-color-bg)] border border-[var(--fx-color-border)] text-[13px] placeholder:text-[var(--fx-color-text-muted)] focus:outline-none focus:border-[var(--fx-color-primary)]"
              />
            </div>
          </div>

          {/* Asset type tabs */}
          <div className="px-4 flex gap-5 border-b border-[var(--fx-color-border)] overflow-x-auto scrollbar-hide">
            {TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setSelectedType(type.id)
                  setSearchQuery('')
                }}
                className={`relative pb-2.5 text-[13px] whitespace-nowrap transition ${
                  selectedType === type.id
                    ? 'text-[var(--fx-color-text)] font-semibold'
                    : 'text-[var(--fx-color-text-muted)] font-medium'
                }`}
              >
                {type.label}
                {selectedType === type.id && (
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 rounded-full bg-[var(--fx-color-primary)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        {/* Featured / top pairs */}
        {!searchQuery && featured.length > 0 && (
          <div className="px-4 py-3 border-b border-[var(--fx-color-border)]">
            <p className="text-[11px] font-medium text-[var(--fx-color-text-muted)] mb-2 uppercase tracking-wide">
              {tradeMode === 'futures' ? 'Popular futures' : 'Popular pairs'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {featured.slice(0, 6).map((asset, i) => {
                const label = selectedType === 'forex' ? asset.pair : asset.symbol || asset.name
                const change = parseFloat(asset.change24h || asset.change || 0) || 0
                const up = change >= 0
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAssetClick(asset)}
                    className="rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] p-2.5 text-left hover:border-[var(--fx-color-primary)] transition"
                  >
                    <p className="text-[12px] font-semibold truncate">{label}</p>
                    <p className="text-[12px] font-medium tabular-nums mt-0.5">
                      {formatPrice(asset.price || asset.lastPrice)}
                    </p>
                    <p className={`text-[11px] font-semibold tabular-nums ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatChange(change)}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Column headers */}
        <div className="px-4 py-2 flex text-[10px] font-medium uppercase tracking-wide text-[var(--fx-color-text-muted)]">
          <span className="flex-1">Pair</span>
          <span className="w-[88px] text-right">Last price</span>
          <span className="w-[72px] text-right">24h %</span>
        </div>

        <div className="divide-y divide-[var(--fx-color-border)] pb-4">
          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="w-7 h-7 rounded-full border-2 border-[var(--fx-color-primary)] border-t-transparent animate-spin" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[13px] font-medium">No pairs found</p>
              <p className="text-[12px] text-[var(--fx-color-text-muted)] mt-1">Adjust search or category</p>
            </div>
          ) : (
            filteredAssets.map((asset, index) => {
              const price = parseFloat(asset.price || asset.lastPrice || 0) || 0
              const change = parseFloat(asset.change24h || asset.change || 0) || 0
              const name = selectedType === 'forex' ? asset.pair : asset.name
              const symbol = selectedType === 'forex' ? asset.pair : asset.symbol
              const up = change >= 0

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAssetClick(asset)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--fx-color-surface-muted)]/60 transition text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {selectedType === 'crypto' ? (
                      <CoinLogo symbol={symbol} image={asset.image} name={name} size="sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--fx-color-surface-muted)] flex items-center justify-center text-[10px] font-bold shrink-0">
                        {String(symbol || '?').slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate">
                        {symbol}
                        {selectedType !== 'forex' && (
                          <span className="text-[var(--fx-color-text-muted)] font-medium">/USDT</span>
                        )}
                      </p>
                      <p className="text-[11px] text-[var(--fx-color-text-muted)] truncate">{name}</p>
                    </div>
                  </div>
                  <div className="w-[88px] text-right shrink-0">
                    <p className="text-[13px] font-semibold tabular-nums">{formatPrice(price)}</p>
                  </div>
                  <div className="w-[72px] flex justify-end shrink-0">
                    <span
                      className={`inline-flex min-w-[62px] justify-center px-1.5 py-1 rounded text-[11px] font-semibold tabular-nums ${
                        up
                          ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatChange(change)}
                    </span>
                  </div>
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
