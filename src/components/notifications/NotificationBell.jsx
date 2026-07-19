import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
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

const PANEL_WIDTH = 384 // 24rem
const PANEL_MAX_H = 520
const Z_PANEL = 99999

function severityDot(type) {
  switch (type) {
    case 'success':
      return 'bg-emerald-500'
    case 'warning':
      return 'bg-amber-500'
    case 'error':
    case 'critical':
      return 'bg-rose-500'
    default:
      return 'bg-[#1199fa]'
  }
}

function timeAgo(date) {
  if (!date) return ''
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function isItemUnread(n) {
  return !(n.read === true || n.isRead === true)
}

/**
 * Enterprise notification bell + portaled panel (never clipped by headers).
 */
export default function NotificationBell({ className = '' }) {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    connected,
    category,
    setCategory,
    markRead,
    markAllRead,
    mode,
    pushPermission,
    enablePush
  } = useNotifications()

  // Local panel state — must NOT be shared via context.
  // Admin mounts two bells (mobile top bar + desktop header); shared panelOpen
  // opened both portals at once.
  const [panelOpen, setPanelOpen] = useState(false)
  const btnRef = useRef(null)
  const panelRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, ready: false })
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640
  )

  const placePanel = () => {
    const narrow = window.innerWidth < 640
    setIsNarrow(narrow)
    if (narrow) {
      setCoords((c) => ({ ...c, ready: true }))
      return
    }
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(PANEL_WIDTH, vw - 16)
    // Prefer open below-right of the bell; clamp into viewport
    let left = r.right - width
    if (left < 8) left = 8
    if (left + width > vw - 8) left = Math.max(8, vw - width - 8)

    let top = r.bottom + 8
    const spaceBelow = vh - top - 8
    const spaceAbove = r.top - 8
    // If not enough space below, open upward
    if (spaceBelow < 240 && spaceAbove > spaceBelow) {
      const h = Math.min(PANEL_MAX_H, spaceAbove)
      top = Math.max(8, r.top - 8 - h)
    }

    setCoords({ top, left, width, ready: true })
  }

  useLayoutEffect(() => {
    if (!panelOpen) {
      setCoords((c) => ({ ...c, ready: false }))
      return undefined
    }
    placePanel()
    const onWin = () => placePanel()
    window.addEventListener('resize', onWin)
    window.addEventListener('scroll', onWin, true)
    return () => {
      window.removeEventListener('resize', onWin)
      window.removeEventListener('scroll', onWin, true)
    }
  }, [panelOpen])

  // Close on outside click / Escape
  useEffect(() => {
    if (!panelOpen) return undefined
    const onDoc = (e) => {
      const t = e.target
      if (btnRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setPanelOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setPanelOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [panelOpen, setPanelOpen])

  // Lock body scroll slightly when open on mobile (optional soft lock)
  useEffect(() => {
    if (!panelOpen) return undefined
    const prev = document.body.style.overflow
    if (window.innerWidth < 640) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = prev
    }
  }, [panelOpen])

  const filtered =
    category === 'all'
      ? notifications
      : notifications.filter(
          (n) =>
            n.category === category ||
            (n.eventType || '').startsWith(category) ||
            (mode === 'admin' && category === 'system')
        )

  const onItemClick = async (n) => {
    if (isItemUnread(n)) await markRead(n._id)
    setPanelOpen(false)
    // Admin SPA uses tabs — avoid jumping/reloading and showing content twice.
    if (mode === 'admin') {
      const url = String(n.actionUrl || '')
      // Prefer staying in-app; only hard-navigate to non-admin absolute paths
      if (url && !url.includes('/admin') && url.startsWith('/')) {
        navigate(url)
      }
      return
    }
    if (n.actionUrl) navigate(n.actionUrl)
  }

  const badge =
    unreadCount > 0 ? (
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm ring-2 ring-[var(--fx-color-surface,#fff)]">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    ) : null

  const panel =
    panelOpen &&
    typeof document !== 'undefined' &&
    createPortal(
      <>
        {/* Backdrop — always tappable to dismiss */}
        <div
          className="fixed inset-0 bg-black/50 sm:bg-black/30"
          style={{ zIndex: Z_PANEL - 1 }}
          aria-hidden
          onClick={() => setPanelOpen(false)}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
          className={`fixed flex flex-col shadow-2xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] overflow-hidden ${
            isNarrow
              ? 'inset-x-0 bottom-0 top-[10%] rounded-t-2xl'
              : 'rounded-2xl'
          }`}
          style={{
            zIndex: Z_PANEL,
            ...(isNarrow
              ? {}
              : {
                  top: coords.ready ? coords.top : -9999,
                  left: coords.ready ? coords.left : 0,
                  width: coords.width || Math.min(PANEL_WIDTH, window.innerWidth - 16),
                  maxHeight: `min(${PANEL_MAX_H}px, calc(100vh - 16px))`,
                  visibility: coords.ready ? 'visible' : 'hidden'
                })
          }}
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-2 pb-0 shrink-0">
            <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--fx-color-border)] flex items-center justify-between shrink-0 bg-[var(--fx-color-surface)] gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[var(--fx-color-text)]">Notifications</h3>
              <p className="text-[11px] text-[var(--fx-color-text-muted)]">
                {connected ? 'Live' : 'Syncing…'} ·{' '}
                <span className={unreadCount > 0 ? 'text-rose-500 font-semibold' : ''}>
                  {unreadCount} unread
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="text-[11px] font-semibold text-[#1199fa] hover:underline hidden xs:inline sm:inline"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="inline-flex items-center gap-1.5 h-9 sm:h-8 px-3 sm:px-2 rounded-xl sm:rounded-lg
                  bg-slate-100 dark:bg-slate-800 text-[var(--fx-color-text)] sm:text-[var(--fx-color-text-muted)]
                  hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs sm:text-[inherit] sm:bg-transparent sm:p-1.5"
                aria-label="Close notifications"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="sm:hidden">Close</span>
              </button>
            </div>
          </div>

          {/* Push enable banner */}
          {mode === 'user' && pushPermission !== 'granted' && pushPermission !== 'unsupported' && (
            <div className="px-3 py-2 border-b border-[var(--fx-color-border)] bg-[#1199fa]/6 flex items-center justify-between gap-2 shrink-0">
              <p className="text-[11px] text-[var(--fx-color-text)] leading-snug">
                {pushPermission === 'denied'
                  ? 'Push blocked in browser settings'
                  : 'Enable push alerts for deposits, trades & security'}
              </p>
              {pushPermission !== 'denied' && (
                <button
                  type="button"
                  onClick={() => enablePush?.()}
                  className="shrink-0 h-7 px-2.5 rounded-lg bg-[#1199fa] text-white text-[11px] font-semibold"
                >
                  Enable
                </button>
              )}
            </div>
          )}

          {/* Category chips — client-side filter */}
          {mode === 'user' && (
            <div className="px-3 py-2 border-b border-[var(--fx-color-border)] flex gap-1 overflow-x-auto scrollbar-hide shrink-0">
              {CATEGORY_FILTERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`shrink-0 h-7 px-2.5 rounded-full text-[11px] font-medium transition ${
                    category === c.id
                      ? 'bg-[#1199fa] text-white'
                      : 'bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text-muted)]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--fx-color-text-muted)]">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--fx-color-surface-muted)] flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[var(--fx-color-text-muted)]"
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
                <p className="text-sm font-medium text-[var(--fx-color-text)]">You're all caught up</p>
                <p className="text-xs text-[var(--fx-color-text-muted)] mt-1">No notifications here</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--fx-color-border)]">
                {filtered.slice(0, 40).map((n) => {
                  const unread = isItemUnread(n)
                  return (
                    <li key={String(n._id)}>
                      <button
                        type="button"
                        onClick={() => onItemClick(n)}
                        className={`w-full text-left px-4 py-3 hover:bg-[var(--fx-color-surface-muted)]/80 transition ${
                          unread ? 'bg-[#1199fa]/6' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <span
                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${severityDot(
                              n.type || n.severity
                            )} ${unread ? '' : 'opacity-30'}`}
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
                                {timeAgo(n.createdAt)}
                              </time>
                            </div>
                            <p className="text-[12px] text-[var(--fx-color-text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            {(n.actionLabel || n.category) && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {n.category && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text-muted)] capitalize">
                                    {n.category}
                                  </span>
                                )}
                                {n.actionLabel && (
                                  <span className="text-[10px] font-semibold text-[#1199fa]">
                                    {n.actionLabel} →
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {mode === 'user' && (
            <div className="px-3 py-2.5 border-t border-[var(--fx-color-border)] shrink-0 bg-[var(--fx-color-surface)]">
              <button
                type="button"
                onClick={() => {
                  setPanelOpen(false)
                  navigate('/notifications')
                }}
                className="w-full h-9 rounded-xl text-[12px] font-semibold text-[#1199fa] bg-[#1199fa]/10 hover:bg-[#1199fa]/16 transition"
              >
                Open notification center
              </button>
            </div>
          )}
        </div>
      </>,
      document.body
    )

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setPanelOpen(!panelOpen)}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
        title="Notifications"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {badge}
        <span
          className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${
            connected ? 'bg-emerald-400' : 'bg-slate-400'
          }`}
          title={connected ? 'Live' : 'Reconnecting…'}
        />
      </button>
      {panel}
    </div>
  )
}
