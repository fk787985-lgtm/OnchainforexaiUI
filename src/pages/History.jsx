import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import { getTradeNetProfit, getTradeRoiPercent } from '../utils/tradeMath'
import BottomNav from '../components/layout/BottomNav'
import NotificationBell from '../components/notifications/NotificationBell'

export default function History() {
  const [tradeHistory, setTradeHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterResult, setFilterResult] = useState('all')
  const [filterSide, setFilterSide] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [statusTab, setStatusTab] = useState('all') // all | open | closed
  const navigate = useNavigate()

  useEffect(() => {
    fetchTradeHistory()
    const interval = setInterval(fetchTradeHistory, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchTradeHistory = async () => {
    try {
      const response = await api.get('/api/trades/history')
      if (response.data.success) setTradeHistory(response.data.trades || [])
    } catch (error) {
      console.error('Error fetching trade history:', error)
    } finally {
      setLoading(false)
    }
  }

  const statistics = useMemo(() => {
    const closedTrades = tradeHistory.filter((t) => t.status === 'closed')
    const openTrades = tradeHistory.filter((t) => t.status === 'open' || t.status === 'active')
    const wins = closedTrades.filter((t) => t.result === 'win')
    const losses = closedTrades.filter((t) => t.result === 'loss')
    const totalProfit = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0)
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0

    return {
      totalTrades: tradeHistory.length,
      closed: closedTrades.length,
      open: openTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: winRate.toFixed(1),
      totalProfit: totalProfit.toFixed(2)
    }
  }, [tradeHistory])

  const filteredAndSortedTrades = useMemo(() => {
    let filtered = tradeHistory.filter((trade) => {
      if (statusTab === 'open' && !(trade.status === 'open' || trade.status === 'active')) return false
      if (statusTab === 'closed' && trade.status !== 'closed') return false

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!trade.symbol?.toLowerCase().includes(q)) return false
      }
      if (filterResult === 'win' && trade.result !== 'win') return false
      if (filterResult === 'loss' && trade.result !== 'loss') return false
      if (filterSide === 'buy' && trade.side !== 'buy') return false
      if (filterSide === 'sell' && trade.side !== 'sell') return false
      return true
    })

    filtered.sort((a, b) => {
      if (sortBy === 'profit') return (b.profit || 0) - (a.profit || 0)
      if (sortBy === 'symbol') return (a.symbol || '').localeCompare(b.symbol || '')
      return new Date(b.closedAt || b.createdAt) - new Date(a.closedAt || a.createdAt)
    })
    return filtered
  }, [tradeHistory, searchQuery, filterResult, filterSide, sortBy, statusTab])

  const formatPrice = (price) => {
    if (price == null || price === '') return '0.00'
    return parseFloat(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const formatDateTime = (date) => {
    if (!date) return '—'
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalPnl = parseFloat(statistics.totalProfit)
  const pnlUp = totalPnl >= 0

  return (
    <div className="fx-page min-h-screen pb-24">
      {/* Top — Binance Orders style */}
      <header className="sticky top-0 z-40 bg-[var(--fx-color-surface)] border-b border-[var(--fx-color-border)]">
        <div className="max-w-3xl mx-auto">
          <div className="h-12 px-4 flex items-center justify-between">
            <h1 className="text-[16px] font-semibold tracking-tight">Orders</h1>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                type="button"
                onClick={() => navigate('/trade')}
                className="text-[12px] font-semibold text-[var(--fx-color-primary)]"
              >
                Trade
              </button>
            </div>
          </div>

          {/* Summary strip */}
          <div className="px-4 pb-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-bg)] px-3 py-2.5">
              <p className="text-[10px] text-[var(--fx-color-text-muted)] font-medium">Total P&L</p>
              <p
                className={`text-[14px] font-bold tabular-nums mt-0.5 ${
                  pnlUp ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {pnlUp ? '+' : ''}
                {formatPrice(statistics.totalProfit)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-bg)] px-3 py-2.5">
              <p className="text-[10px] text-[var(--fx-color-text-muted)] font-medium">Win rate</p>
              <p className="text-[14px] font-bold tabular-nums mt-0.5">
                {statistics.winRate}%
              </p>
            </div>
            <div className="rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-bg)] px-3 py-2.5">
              <p className="text-[10px] text-[var(--fx-color-text-muted)] font-medium">Trades</p>
              <p className="text-[14px] font-bold tabular-nums mt-0.5">
                {statistics.closed}
                <span className="text-[10px] font-medium text-[var(--fx-color-text-muted)] ml-1">
                  / {statistics.totalTrades}
                </span>
              </p>
            </div>
          </div>

          {/* Status tabs */}
          <div className="px-4 flex gap-5 border-b border-[var(--fx-color-border)]">
            {[
              { id: 'all', label: 'All' },
              { id: 'open', label: `Open (${statistics.open})` },
              { id: 'closed', label: 'History' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setStatusTab(t.id)}
                className={`relative pb-2.5 text-[13px] whitespace-nowrap transition ${
                  statusTab === t.id
                    ? 'text-[var(--fx-color-text)] font-semibold'
                    : 'text-[var(--fx-color-text-muted)] font-medium'
                }`}
              >
                {t.label}
                {statusTab === t.id && (
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 rounded-full bg-[var(--fx-color-primary)]" />
                )}
              </button>
            ))}
          </div>

          {/* Search + filters */}
          <div className="px-4 py-2.5 space-y-2">
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
                placeholder="Search symbol"
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-[var(--fx-color-bg)] border border-[var(--fx-color-border)] text-[13px] placeholder:text-[var(--fx-color-text-muted)] focus:outline-none focus:border-[var(--fx-color-primary)]"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {[
                {
                  label: 'All',
                  active: filterResult === 'all' && filterSide === 'all',
                  onClick: () => {
                    setFilterResult('all')
                    setFilterSide('all')
                  }
                },
                {
                  label: 'Win',
                  active: filterResult === 'win',
                  onClick: () => setFilterResult(filterResult === 'win' ? 'all' : 'win')
                },
                {
                  label: 'Loss',
                  active: filterResult === 'loss',
                  onClick: () => setFilterResult(filterResult === 'loss' ? 'all' : 'loss')
                },
                {
                  label: 'Long',
                  active: filterSide === 'buy',
                  onClick: () => setFilterSide(filterSide === 'buy' ? 'all' : 'buy')
                },
                {
                  label: 'Short',
                  active: filterSide === 'sell',
                  onClick: () => setFilterSide(filterSide === 'sell' ? 'all' : 'sell')
                }
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.onClick}
                  className={`h-7 px-2.5 rounded-full text-[11px] font-medium whitespace-nowrap transition ${
                    chip.active
                      ? 'bg-[var(--fx-color-primary)] text-white'
                      : 'bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text-muted)]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-7 px-2 rounded-full text-[11px] font-medium bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text-muted)] border-0 focus:outline-none"
              >
                <option value="date">Newest</option>
                <option value="profit">P&L</option>
                <option value="symbol">Symbol</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-3">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-7 h-7 rounded-full border-2 border-[var(--fx-color-primary)] border-t-transparent animate-spin" />
          </div>
        ) : filteredAndSortedTrades.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)]">
            <p className="text-[13px] font-medium">No orders found</p>
            <p className="text-[12px] text-[var(--fx-color-text-muted)] mt-1 mb-4">
              {searchQuery || filterResult !== 'all' || filterSide !== 'all'
                ? 'Try clearing filters'
                : 'Closed trades appear here'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/trade')}
              className="inline-flex h-9 px-4 items-center rounded-lg text-[13px] font-semibold text-white bg-[var(--fx-color-primary)]"
            >
              Go to Trade
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedTrades.map((trade) => {
              const roiPercent = getTradeRoiPercent(trade)
              const isWin = trade.result ? trade.result === 'win' : roiPercent >= 0
              const netProfit = getTradeNetProfit(trade)
              const isOpen = trade.status === 'open' || trade.status === 'active'

              return (
                <button
                  key={trade._id}
                  type="button"
                  onClick={() => navigate(`/order/${trade._id}`, { state: { trade } })}
                  className="w-full text-left rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] p-3.5 hover:border-[var(--fx-color-primary)]/50 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-semibold">{trade.symbol}</span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            trade.side === 'buy'
                              ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {trade.side === 'buy' ? 'Long' : 'Short'}
                        </span>
                        {trade.leverage ? (
                          <span className="text-[10px] font-medium text-[var(--fx-color-text-muted)]">
                            {trade.leverage}x
                          </span>
                        ) : null}
                        {isOpen && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/12 text-amber-600">
                            Open
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--fx-color-text-muted)] mt-1 tabular-nums">
                        {formatDateTime(trade.closedAt || trade.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-[14px] font-bold tabular-nums ${
                          isWin ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {netProfit >= 0 ? '+' : ''}
                        {formatPrice(netProfit)}
                      </p>
                      <p
                        className={`text-[11px] font-semibold tabular-nums mt-0.5 ${
                          isWin ? 'text-emerald-500/80' : 'text-rose-500/80'
                        }`}
                      >
                        {roiPercent >= 0 ? '+' : ''}
                        {roiPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-[var(--fx-color-border)]">
                    <div>
                      <p className="text-[10px] text-[var(--fx-color-text-muted)]">Entry</p>
                      <p className="text-[12px] font-semibold tabular-nums mt-0.5">
                        {formatPrice(trade.entryPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--fx-color-text-muted)]">Exit</p>
                      <p className="text-[12px] font-semibold tabular-nums mt-0.5">
                        {trade.exitPrice != null ? formatPrice(trade.exitPrice) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--fx-color-text-muted)]">Amount</p>
                      <p className="text-[12px] font-semibold tabular-nums mt-0.5">
                        {formatPrice(trade.marginUsed || trade.amount)}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
