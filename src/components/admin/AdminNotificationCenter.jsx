import { useCallback, useEffect, useState } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import PageHeader from '../ui/PageHeader'
import SkeletonBlock from '../common/SkeletonBlock'
import EmptyState from '../ui/EmptyState'

const EVENT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'user.registered', label: 'Registrations' },
  { id: 'user.login', label: 'Logins' },
  { id: 'user.login_failed', label: 'Failed logins' },
  { id: 'kyc.started', label: 'KYC started' },
  { id: 'kyc.submitted', label: 'KYC submitted' },
  { id: 'kyc.approved', label: 'KYC approved' },
  { id: 'kyc.rejected', label: 'KYC rejected' },
  { id: 'deposit.created', label: 'Deposits' },
  { id: 'deposit.confirmed', label: 'Deposit confirmed' },
  { id: 'buy.crypto', label: 'Buy crypto' },
  { id: 'withdrawal.requested', label: 'Withdrawals' },
  { id: 'support.message', label: 'Support' },
  { id: 'admin.balance_changed', label: 'Balance' }
]

export default function AdminNotificationCenter() {
  const [tab, setTab] = useState('notifications') // notifications | audit
  const [items, setItems] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [eventType, setEventType] = useState('all')
  const [isRead, setIsRead] = useState('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ pages: 1, total: 0 })

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page, limit: 40 })
      if (eventType !== 'all') params.set('eventType', eventType)
      if (isRead === 'true' || isRead === 'false') params.set('isRead', isRead)
      if (q.trim()) params.set('q', q.trim())
      const { data } = await api.get(`/api/admin/notifications?${params}`)
      if (data.success) {
        setItems(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
        setPagination(data.pagination || { pages: 1, total: 0 })
      }
    } catch (err) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [page, eventType, isRead, q])

  const loadAudit = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page, limit: 50 })
      if (eventType !== 'all') params.set('eventType', eventType)
      if (q.trim()) params.set('q', q.trim())
      const { data } = await api.get(`/api/admin/notifications/audit?${params}`)
      if (data.success) {
        setAuditLogs(data.logs || [])
        setPagination(data.pagination || { pages: 1, total: 0 })
      }
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, eventType, q])

  useEffect(() => {
    if (tab === 'notifications') loadNotifications()
    else loadAudit()
  }, [tab, loadNotifications, loadAudit])

  // Poll unread count
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const { data } = await api.get('/api/admin/notifications/unread-count')
        if (data.success) setUnreadCount(data.unreadCount || 0)
      } catch {
        /* ignore */
      }
    }, 15000)
    return () => clearInterval(t)
  }, [])

  const markRead = async (id) => {
    try {
      await api.put(`/api/admin/notifications/${id}/read`)
      loadNotifications()
    } catch {
      toast.error('Failed to mark read')
    }
  }

  const markUnread = async (id) => {
    try {
      await api.put(`/api/admin/notifications/${id}/unread`)
      loadNotifications()
    } catch {
      toast.error('Failed')
    }
  }

  const archive = async (id) => {
    try {
      await api.put(`/api/admin/notifications/${id}/archive`)
      toast.success('Archived')
      loadNotifications()
      setSelected(null)
    } catch {
      toast.error('Failed to archive')
    }
  }

  const markAllRead = async () => {
    try {
      await api.put('/api/admin/notifications/read-all')
      toast.success('All marked read')
      loadNotifications()
    } catch {
      toast.error('Failed')
    }
  }

  const exportCsv = async () => {
    try {
      const path =
        tab === 'audit'
          ? '/api/admin/notifications/audit?export=true'
          : '/api/admin/notifications/export'
      const res = await api.get(path, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = tab === 'audit' ? 'audit-logs.csv' : 'admin-notifications.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed')
    }
  }

  if (loading && !items.length && !auditLogs.length) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Notification Center"
          description="Real-time admin alerts, history, and immutable audit logs."
        />
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
              {unreadCount} unread
            </span>
          )}
          <button
            type="button"
            onClick={exportCsv}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600"
          >
            Export CSV
          </button>
          {tab === 'notifications' && (
            <button
              type="button"
              onClick={markAllRead}
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-white"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setTab('notifications')
            setPage(1)
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'notifications'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white'
              : 'bg-slate-200 dark:bg-slate-800'
          }`}
        >
          Notifications
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('audit')
            setPage(1)
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'audit'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white'
              : 'bg-slate-200 dark:bg-slate-800'
          }`}
        >
          Audit logs
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <select
          className="fx-input sm:w-48"
          value={eventType}
          onChange={(e) => {
            setEventType(e.target.value)
            setPage(1)
          }}
        >
          {EVENT_FILTERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        {tab === 'notifications' && (
          <select
            className="fx-input sm:w-36"
            value={isRead}
            onChange={(e) => {
              setIsRead(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All read states</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        )}
        <input
          className="fx-input flex-1"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (tab === 'notifications' ? loadNotifications() : loadAudit())}
        />
        <button
          type="button"
          onClick={() => (tab === 'notifications' ? loadNotifications() : loadAudit())}
          className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm"
        >
          Search
        </button>
      </div>

      {tab === 'notifications' ? (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 fx-card p-0 max-h-[70vh] overflow-y-auto">
            {items.length === 0 ? (
              <EmptyState title="No notifications" description="Alerts will appear as users take action." />
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {items.map((n) => (
                  <li key={n._id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(n)
                        if (!n.isRead) markRead(n._id)
                      }}
                      className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        !n.isRead ? 'bg-cyan-50/60 dark:bg-cyan-950/20' : ''
                      } ${selected?._id === n._id ? 'ring-1 ring-cyan-400' : ''}`}
                    >
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {n.title}
                        </p>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.eventType}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {n.userId?.fullName || n.meta?.user?.fullName || '—'} ·{' '}
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Desktop detail pane only — mobile uses full-screen sheet below */}
          <div className="hidden lg:block lg:col-span-3 fx-card space-y-3">
            {!selected ? (
              <p className="text-sm text-slate-500">Select a notification to view details.</p>
            ) : (
              <NotificationDetail
                selected={selected}
                onClose={() => setSelected(null)}
                onMarkUnread={markUnread}
                onArchive={archive}
                showClose={false}
              />
            )}
          </div>

          {/* Mobile: single detail overlay (avoids list + detail stacking) */}
          {selected && (
            <div className="lg:hidden fixed inset-0 z-[80] flex flex-col bg-black/50">
              <button
                type="button"
                className="flex-1 min-h-[10%]"
                aria-label="Close notification"
                onClick={() => setSelected(null)}
              />
              <div className="bg-white dark:bg-slate-900 rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-t border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <NotificationDetail
                  selected={selected}
                  onClose={() => setSelected(null)}
                  onMarkUnread={markUnread}
                  onArchive={archive}
                  showClose
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="fx-card overflow-x-auto">
          {auditLogs.length === 0 ? (
            <EmptyState title="No audit logs" description="Audit events will appear as actions occur." />
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Event ID</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">IP / Location</th>
                  <th className="px-3 py-2">Device</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {auditLogs.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2 font-mono text-xs">{a.eventId}</td>
                    <td className="px-3 py-2">{a.eventType}</td>
                    <td className="px-3 py-2">{a.action}</td>
                    <td className="px-3 py-2">
                      {a.userId?.fullName || a.userId?.email || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {a.ip}
                      <br />
                      {[a.city, a.country].filter(Boolean).join(', ')}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {a.deviceType} / {a.browser}
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {page} / {pagination.pages} ({pagination.total} total)
          </span>
          <button
            type="button"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function NotificationDetail({ selected, onClose, onMarkUnread, onArchive, showClose }) {
  if (!selected) return null
  return (
    <>
      <div className="flex flex-wrap justify-between gap-2 items-start">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selected.title}</h3>
          <p className="text-xs text-slate-500">{selected.eventType}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold h-fit ${
              selected.severity === 'critical'
                ? 'bg-red-100 text-red-700'
                : selected.severity === 'warning'
                  ? 'bg-amber-100 text-amber-800'
                  : selected.severity === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
            }`}
          >
            {selected.severity}
          </span>
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Close
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{selected.message}</p>
      <DetailBlock title="User" data={selected.meta?.user} />
      <DetailBlock title="Location" data={selected.meta?.location} />
      <DetailBlock title="Device" data={selected.meta?.device} />
      <DetailBlock title="Details" data={selected.meta?.details} />
      <p className="text-xs text-slate-400">
        {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}
        {selected.telegramSent ? ' · Telegram sent' : ''}
      </p>
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => onMarkUnread(selected._id)}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600"
        >
          Mark unread
        </button>
        <button
          type="button"
          onClick={() => onArchive(selected._id)}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600"
        >
          Archive
        </button>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-4 py-1.5 text-sm rounded-lg bg-slate-800 text-white font-semibold"
          >
            Done
          </button>
        )}
      </div>
    </>
  )
}

function DetailBlock({ title, data }) {
  if (!data || typeof data !== 'object') return null
  const entries = Object.entries(data).filter(([, v]) => v !== '' && v != null)
  if (!entries.length) return null
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500 mb-2">{title}</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {entries.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 sm:block">
            <dt className="text-slate-500 text-xs">{k}</dt>
            <dd className="font-medium text-slate-900 dark:text-white break-all">
              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
