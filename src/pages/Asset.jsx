import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import AddFundsModal from '../components/AddFundsModal'
import WithdrawalModal from '../components/WithdrawalModal'
import TransferModal from '../components/TransferModal'
import { getImageUrl } from '../utils/imageUrl.js'
import SkeletonBlock from '../components/common/SkeletonBlock'
import CoinLogo from '../components/common/CoinLogo'
import BottomNav from '../components/layout/BottomNav'
import NotificationBell from '../components/notifications/NotificationBell'
import { getBtcUsdtPrice, usdtToBtc } from '../services/cryptoApi'

function Icon({ d, paths, className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      {paths
        ? paths.map((p, i) => (
            <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={p} />
          ))
        : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
          )}
    </svg>
  )
}

const EYE_OPEN = [
  'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
]
const EYE_CLOSED = [
  'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
]

export default function Asset() {
  const navigate = useNavigate()
  const [walletTab, setWalletTab] = useState('overview')
  const [cryptoAssets, setCryptoAssets] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
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
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedCoinForDeposit, setSelectedCoinForDeposit] = useState(null)
  const [todayPNL, setTodayPNL] = useState(0)
  const [sortBy, setSortBy] = useState('rank') // rank | gainers | losers
  const [btcUsdtPrice, setBtcUsdtPrice] = useState(null)

  useEffect(() => {
    let cancelled = false
    let inFlight = false

    const fetchBtcPrice = async () => {
      try {
        const result = await getBtcUsdtPrice()
        if (!cancelled && result?.price > 0) setBtcUsdtPrice(result.price)
      } catch {
        /* ignore */
      }
    }

    const fetchUserData = async () => {
      try {
        const response = await api.get('/api/auth/me')
        if (!cancelled && response.data.success) {
          setUserBalance(response.data.user.balance || 0)
        }
      } catch (error) {
        if (!cancelled) console.error('Error fetching user data:', error)
      }
    }

    const fetchTodayPNL = async () => {
      try {
        const response = await api.get('/api/trades/history')
        if (cancelled) return
        if (response.data.success && response.data.trades) {
          const now = new Date()
          const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          const closedTrades24h = response.data.trades.filter((trade) => {
            const tradeDate = trade.closedAt ? new Date(trade.closedAt) : new Date(trade.createdAt)
            return trade.status === 'closed' && tradeDate >= last24Hours && trade.profit != null
          })
          const totalProfit = closedTrades24h.reduce((sum, trade) => sum + (parseFloat(trade.profit) || 0), 0)
          setTodayPNL(totalProfit)
        }
      } catch {
        if (!cancelled) setTodayPNL(0)
      }
    }

    const fetchCryptoAssets = async () => {
      if (inFlight) return
      inFlight = true
      try {
        const response = await api.get('/api/coins', { timeout: 15000 })
        if (cancelled) return
        if (response.data.success) {
          const coins = response.data.coins
          setCryptoAssets(
            coins.map((coin, index) => ({
              id: coin._id,
              name: coin.name,
              symbol: coin.symbol,
              price: coin.price || 0,
              change24h: coin.change24h || 0,
              high24h: coin.high24h || 0,
              low24h: coin.low24h || 0,
              volume: coin.volume || 0,
              marketCap: coin.marketCap || 0,
              image: coin.image ? getImageUrl(coin.image) : null,
              rank: coin.rank || index + 1
            }))
          )
        } else {
          setCryptoAssets([])
        }
      } catch (error) {
        if (!cancelled && error.code !== 'ECONNABORTED') {
          console.error('Error fetching crypto assets:', error)
        }
      } finally {
        inFlight = false
        if (!cancelled) setInitialLoading(false)
      }
    }

    fetchUserData()
    fetchCryptoAssets()
    fetchTodayPNL()
    fetchBtcPrice()

    const interval = setInterval(() => {
      fetchCryptoAssets()
      fetchUserData()
      fetchTodayPNL()
    }, 10_000)

    const btcInterval = setInterval(fetchBtcPrice, 60_000)

    return () => {
      cancelled = true
      clearInterval(interval)
      clearInterval(btcInterval)
    }
  }, [])

  const formatPrice = (price) => {
    if (!price || price === 0) return '0.00'
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    return Number(price).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const formatChange = (change) => {
    const value = parseFloat(change) || 0
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

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

  const mask = (value, digits = 2) => {
    if (!balanceVisible) return '••••••'
    if (typeof value === 'number') {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      })
    }
    return value
  }

  const liveBtcPrice = useMemo(() => {
    const fromList = cryptoAssets.find(
      (c) => String(c.symbol || '').toUpperCase() === 'BTC'
    )?.price
    const listPrice = Number(fromList) || 0
    const apiPrice = Number(btcUsdtPrice) || 0
    return apiPrice > 0 ? apiPrice : listPrice > 0 ? listPrice : null
  }, [btcUsdtPrice, cryptoAssets])

  const btcApprox = useMemo(
    () => usdtToBtc(userBalance, liveBtcPrice),
    [userBalance, liveBtcPrice]
  )

  const filteredAssets = useMemo(() => {
    let list = [...cryptoAssets]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (a) => a.name?.toLowerCase().includes(q) || a.symbol?.toLowerCase().includes(q)
      )
    }
    if (sortBy === 'gainers') {
      list.sort((a, b) => (b.change24h || 0) - (a.change24h || 0))
    } else if (sortBy === 'losers') {
      list.sort((a, b) => (a.change24h || 0) - (b.change24h || 0))
    } else {
      list.sort((a, b) => (a.rank || 999) - (b.rank || 999))
    }
    return list
  }, [cryptoAssets, searchQuery, sortBy])

  const handleAssetClick = (asset) => {
    navigate(`/trade/crypto/${encodeURIComponent(asset.symbol)}`, {
      state: { item: asset, type: 'crypto' }
    })
  }

  const refreshBalance = async () => {
    try {
      const response = await api.get('/api/auth/me')
      if (response.data.success) setUserBalance(response.data.user.balance || 0)
    } catch {
      /* ignore */
    }
  }

  const handleWithdraw = async () => {
    try {
      const [userResponse, kycResponse] = await Promise.all([
        api.get('/api/auth/me'),
        api.get('/api/kyc/status')
      ])
      if (!userResponse.data.success || !kycResponse.data.success) return

      const user = userResponse.data.user
      const kyc = kycResponse.data

      if (!user.allowWithdraw) {
        toast.error('Withdrawals are disabled on this account. Contact support.')
        return
      }
      if (!kyc.isVerified || kyc.kyc?.status !== 'approved') {
        toast.error('Complete KYC verification before withdrawing.')
        navigate('/kyc/verify')
        return
      }
      setShowWithdrawalModal(true)
    } catch {
      toast.error('Unable to verify withdrawal eligibility.')
    }
  }

  const actions = [
    {
      id: 'deposit',
      label: 'Deposit',
      icon: 'M12 4v16m8-8H4',
      onClick: () => {
        setSelectedCoinForDeposit(null)
        setShowAddFundsModal(true)
      },
      primary: true
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      icon: 'M20 12H4',
      onClick: handleWithdraw
    },
    {
      id: 'transfer',
      label: 'Transfer',
      icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      onClick: () => setShowTransferModal(true)
    },
    {
      id: 'buy',
      label: 'Buy',
      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
      onClick: () => navigate('/buy')
    }
  ]

  const pnlPositive = todayPNL >= 0

  return (
    <div className="fx-page min-h-screen pb-24">
      {/* Binance-style wallet top */}
      <header className="sticky top-0 z-40 bg-[var(--fx-color-surface)] border-b border-[var(--fx-color-border)]">
        <div className="max-w-lg mx-auto">
          <div className="h-12 px-4 flex items-center justify-between">
            <h1 className="text-[16px] font-semibold tracking-tight">Wallet</h1>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={toggleBalanceVisible}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium text-[var(--fx-color-text-muted)] hover:bg-[var(--fx-color-surface-muted)] hover:text-[var(--fx-color-text)] transition"
                aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
                title={balanceVisible ? 'Hide balance' : 'Show balance'}
              >
                <Icon paths={balanceVisible ? EYE_OPEN : EYE_CLOSED} className="w-[18px] h-[18px]" />
                <span className="hidden sm:inline">{balanceVisible ? 'Hide' : 'Show'}</span>
              </button>
              <NotificationBell />
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="p-2 rounded-lg text-[var(--fx-color-text-muted)] hover:bg-[var(--fx-color-surface-muted)]"
                aria-label="Orders"
              >
                <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-[18px] h-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="p-2 rounded-lg text-[var(--fx-color-text-muted)] hover:bg-[var(--fx-color-surface-muted)]"
                aria-label="Profile"
              >
                <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          {/* Wallet account tabs */}
          <div className="px-4 flex gap-5 border-b border-[var(--fx-color-border)]">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'spot', label: 'Spot' },
              { id: 'funding', label: 'Funding' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setWalletTab(t.id)}
                className={`relative pb-2.5 text-[13px] whitespace-nowrap transition ${
                  walletTab === t.id
                    ? 'text-[var(--fx-color-text)] font-semibold'
                    : 'text-[var(--fx-color-text-muted)] font-medium'
                }`}
              >
                {t.label}
                {walletTab === t.id && (
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 rounded-full bg-[var(--fx-color-primary)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Portfolio card */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1426] via-[#0f2744] to-[#1199fa] text-white p-5 shadow-lg shadow-blue-900/20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
          <div className="pointer-events-none absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-[#1199fa]/30 blur-2xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-white/55">
                {walletTab === 'funding' ? 'Funding balance' : walletTab === 'spot' ? 'Spot balance' : 'Estimated balance'}
              </p>
              <button
                type="button"
                onClick={toggleBalanceVisible}
                className="inline-flex items-center gap-1.5 h-7 px-2 rounded-lg bg-white/10 border border-white/15 text-white/90 text-[11px] font-medium hover:bg-white/15 transition"
                aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
              >
                <Icon paths={balanceVisible ? EYE_OPEN : EYE_CLOSED} className="w-3.5 h-3.5" />
                {balanceVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="mt-2 flex items-baseline gap-2 flex-wrap">
              <span className="text-[32px] sm:text-4xl font-bold tracking-tight tabular-nums leading-none">
                {mask(userBalance)}
              </span>
              <span className="text-sm font-semibold text-white/70">USDT</span>
            </div>
            {liveBtcPrice > 0 && (
              <p className="mt-1.5 text-[12px] text-white/50 tabular-nums">
                ≈ {mask(btcApprox, 8)} BTC
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/20 border border-white/10 px-3 py-1.5">
                <span className="text-[11px] text-white/60">Today P&L</span>
                <span
                  className={`text-[12px] font-semibold tabular-nums ${
                    pnlPositive ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {balanceVisible
                    ? `${pnlPositive ? '+' : ''}${todayPNL.toFixed(2)}`
                    : '••••'}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-black/20 border border-white/10 px-3 py-1.5">
                <span className="text-[11px] text-white/60">Account</span>
                <span className="text-[12px] font-semibold capitalize">{walletTab}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-4 gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="flex flex-col items-center gap-2 py-3 rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] hover:border-[color-mix(in_srgb,var(--fx-color-primary)_40%,var(--fx-color-border))] hover:shadow-sm transition group"
            >
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  action.primary
                    ? 'bg-[var(--fx-color-primary)] text-white shadow-md shadow-blue-500/25'
                    : 'bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text)] group-hover:text-[var(--fx-color-primary)]'
                }`}
              >
                <Icon d={action.icon} className="w-[18px] h-[18px]" />
              </span>
              <span className="text-[11px] font-semibold text-[var(--fx-color-text)]">
                {action.label}
              </span>
            </button>
          ))}
        </section>

        {/* Cash position */}
        <section className="rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#26a17b]/15 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-[#26a17b]">₮</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">USDT</p>
              <p className="text-[11px] text-[var(--fx-color-text-muted)]">Available balance</p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-semibold tabular-nums">{mask(userBalance)}</p>
              <p className="text-[11px] text-[var(--fx-color-text-muted)]">Spot</p>
            </div>
          </div>
        </section>

        {/* Markets */}
        <section className="rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] overflow-hidden">
          <div className="px-4 pt-3 pb-2 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-semibold">Markets</h2>
              <div className="flex gap-1">
                {[
                  { id: 'rank', label: 'All' },
                  { id: 'gainers', label: 'Gainers' },
                  { id: 'losers', label: 'Losers' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSortBy(s.id)}
                    className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition ${
                      sortBy === s.id
                        ? 'bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text)] ring-1 ring-[var(--fx-color-border)]'
                        : 'text-[var(--fx-color-text-muted)] hover:text-[var(--fx-color-text)]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Icon
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fx-color-text-muted)]"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coin"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--fx-color-border)] bg-[var(--fx-color-bg)] text-[13px] placeholder:text-[var(--fx-color-text-muted)] focus:outline-none focus:border-[var(--fx-color-primary)]"
              />
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-[10px] font-medium uppercase tracking-wide text-[var(--fx-color-text-muted)] px-0.5">
              <span>Asset</span>
              <span className="text-right w-[72px]">Price</span>
              <span className="text-right w-[68px]">24h</span>
            </div>
          </div>

          <div className="divide-y divide-[var(--fx-color-border)] max-h-[52vh] overflow-y-auto">
            {initialLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonBlock key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-[13px] font-medium">No coins found</p>
                <p className="text-[12px] text-[var(--fx-color-text-muted)] mt-1">Try another search</p>
              </div>
            ) : (
              filteredAssets.map((asset) => {
                const up = (asset.change24h || 0) >= 0
                return (
                  <button
                    key={asset.id || asset.symbol}
                    type="button"
                    onClick={() => handleAssetClick(asset)}
                    className="w-full grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3 hover:bg-[var(--fx-color-surface-muted)]/70 transition text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CoinLogo
                        symbol={asset.symbol}
                        image={asset.image}
                        name={asset.name}
                        className="!w-9 !h-9"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate">{asset.symbol}</p>
                        <p className="text-[11px] text-[var(--fx-color-text-muted)] truncate">
                          {asset.name}
                        </p>
                      </div>
                    </div>
                    <div className="w-[72px] text-right">
                      <p className="text-[13px] font-semibold tabular-nums">
                        ${formatPrice(asset.price)}
                      </p>
                    </div>
                    <div className="w-[68px] text-right">
                      <span
                        className={`inline-flex min-w-[60px] justify-center px-1.5 py-1 rounded-md text-[11px] font-semibold tabular-nums ${
                          up
                            ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatChange(asset.change24h)}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </section>
      </main>

      <BottomNav />

      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        selectedCoin={selectedCoinForDeposit}
        onSuccess={refreshBalance}
      />
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onSuccess={refreshBalance}
      />
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={refreshBalance}
      />
    </div>
  )
}
