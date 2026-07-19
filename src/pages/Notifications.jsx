import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'
import BottomNav from '../components/layout/BottomNav'
import api from '../utils/axios'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'trading', label: 'Trading' },
  { id: 'deposit', label: 'Deposits' },
  { id: 'withdrawal', label: 'Withdrawals' },
  { id: 'transfer', label: 'Transfers' },
  { id: 'kyc', label: 'KYC' },
  { id: 'security', label: 'Security' },
  { id: 'support', label: 'Support' },
  { id: 'account', label: 'Account' },
  { id: 'system', label: 'System' }
]

function severityStyles(type) {
  switch (type) {
    case 'success':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    case 'warning':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20'
    case 'error':
    case 'critical':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20'
    default:
      return 'bg-[#1199fa]/12 text-[#1199fa] border-[#1199fa]/20'
  }
}

function timeLabel(date) {
  if (!date) return ''
  const d = new Date(date)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Full-page enterprise notification center (Stripe/GitHub style).
 */
export default function Notifications() {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    connected,
    markRead,
    markAllRead,
    refresh,
    category,
    setCategory
  } = useNotifications()

  const [localFilter, setLocalFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    refresh()
  }, [refresh])

  // Sync category chips with context for server-side filter where useful
  useEffect(() => {
    if (localFilter === 'all' || localFilter === 'unread') {
      if (category !== 'all') setCategory('all')
    } else if (category !== localFilter) {
      setCategory(localFilter)
    }
  }, [localFilter, category, setCategory])

  const list = useMemo(() => {
    let items = notifications || []
    if (localFilter === 'unread') {
      items = items.filter((n) => !(n.read || n.isRead))
    } else if (localFilter !== 'all') {
      items = items.filter(
        (n) =>
          n.category === localFilter ||
          (n.eventType || '').startsWith(localFilter)
      )
    }
    return items
  }, [notifications, localFilter])

  const openItem = async (n) => {
    setSelected(n)
    if (!(n.read || n.isRead)) {
      await markRead(n._id)
    }
  }

  const goAction = (n) => {
    if (n?.actionUrl) {
      navigate(n.actionUrl)
    }
  }

  const archiveOne = async (id) => {
    setArchiving(true)
    try {
      await api.put(`/api/notifications/${id}/archive`)
      await refresh()
      if (selected && String(selected._id) === String(id)) setSelected(null)
    } catch {
      /* ignore */
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="fx-page min-h-screen pb-24">
      <header className="sticky top-0 z-40 border-b border-[var(--fx-color-border)] bg-[var(--fx-color-surface)]/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg text-[var(--fx-color-text-muted)] hover:bg-[var(--fx-color-surface-muted)]"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-[16px] font-semibold tracking-tight text-[var(--fx-color-text)]">
                Notifications
              </h1>
              <p className="text-[11px] text-[var(--fx-color-text-muted)] flex items-center gap-1.5">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    connected ? 'bg-emerald-400' : 'bg-slate-400'
                  }`}
                />
                {connected ? 'Live updates' : 'Syncing…'} · {unreadCount} unread
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold text-[#1199fa] hover:bg-[#1199fa]/10 transition"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => refresh()}
              className="p-2 rounded-lg text-[var(--fx-color-text-muted)] hover:bg-[var(--fx-color-surface-muted)]"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setLocalFilter(f.id)}
              className={`shrink-0 h-8 px-3 rounded-full text-[12px] font-medium transition ${
                localFilter === f.id
                  ? 'bg-[#1199fa] text-white shadow-sm shadow-blue-500/25'
                  : 'bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text-muted)] hover:text-[var(--fx-color-text)]'
              }`}
            >
              {f.label}
              {f.id === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* List */}
          <div className="lg:col-span-3 rounded-2xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] overflow-hidden shadow-sm">
            {loading && list.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--fx-color-text-muted)]">
                Loading notifications…
              </div>
            ) : list.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--fx-color-surface-muted)] flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-[var(--fx-color-text-muted)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[var(--fx-color-text)]">You're all caught up</p>
                <p className="text-xs text-[var(--fx-color-text-muted)] mt-1 max-w-xs mx-auto">
                  Account, trading, and security alerts will appear here in real time.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--fx-color-border)]">
                {list.map((n) => {
                  const unread = !(n.read || n.isRead)
                  const active = selected && String(selected._id) === String(n._id)
                  return (
                    <li key={String(n._id)}>
                      <button
                        type="button"
                        onClick={() => openItem(n)}
                        className={`w-full text-left px-4 py-3.5 transition ${
                          active
                            ? 'bg-[#1199fa]/8'
                            : unread
                              ? 'bg-[#1199fa]/4 hover:bg-[#1199fa]/8'
                              : 'hover:bg-[var(--fx-color-surface-muted)]/80'
                        }`}
                      >
                        <div className="flex gap-3">
                          <span
                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                              unread ? 'bg-[#1199fa]' : 'bg-transparent'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-[13px] leading-snug ${
                                  unread
                                    ? 'font-semibold text-[var(--fx-color-text)]'
                                    : 'font-medium text-[var(--fx-color-text)]'
                                }`}
                              >
                                {n.title}
                              </p>
                              <time className="text-[10px] text-[var(--fx-color-text-muted)] shrink-0 tabular-nums">
                                {timeLabel(n.createdAt)}
                              </time>
                            </div>
                            <p className="text-[12px] text-[var(--fx-color-text-muted)] mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {n.category && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text-muted)] capitalize">
                                  {n.category}
                                </span>
                              )}
                              {(n.type || n.severity) && (
                                <span
                                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize ${severityStyles(
                                    n.type || n.severity
                                  )}`}
                                >
                                  {n.type || n.severity}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Detail pane */}
          <div className="lg:col-span-2 rounded-2xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] p-5 shadow-sm min-h-[280px]">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <p className="text-sm font-medium text-[var(--fx-color-text)]">Select a notification</p>
                <p className="text-xs text-[var(--fx-color-text-muted)] mt-1">
                  Details and actions appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selected.category && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text-muted)]">
                        {selected.category}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border capitalize ${severityStyles(
                        selected.type || selected.severity
                      )}`}
                    >
                      {selected.type || selected.severity || 'info'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[var(--fx-color-text)] leading-snug">
                    {selected.title}
                  </h2>
                  <p className="text-[11px] text-[var(--fx-color-text-muted)] mt-1">
                    {selected.createdAt
                      ? new Date(selected.createdAt).toLocaleString()
                      : ''}
                  </p>
                </div>
                <p className="text-sm text-[var(--fx-color-text)] leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </p>
                {selected.eventType && (
                  <p className="text-[11px] text-[var(--fx-color-text-muted)] font-mono">
                    {selected.eventType}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selected.actionUrl && (
                    <button
                      type="button"
                      onClick={() => goAction(selected)}
                      className="h-9 px-4 rounded-xl bg-[#1199fa] text-white text-[13px] font-semibold shadow-md shadow-blue-500/20 hover:bg-[#0d8ae0] transition"
                    >
                      {selected.actionLabel || 'Open'} →
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={archiving}
                    onClick={() => archiveOne(selected._id)}
                    className="h-9 px-4 rounded-xl border border-[var(--fx-color-border)] text-[13px] font-medium text-[var(--fx-color-text-muted)] hover:bg-[var(--fx-color-surface-muted)] transition disabled:opacity-50"
                  >
                    Archive
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
