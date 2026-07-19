import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { io } from 'socket.io-client'
import api from '../utils/axios'
import { getSocketUrl } from '../utils/apiUrl.js'
import toast from 'react-hot-toast'
import {
  ensureNotificationPermissionOnce,
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserPush,
  shouldShowPushForNewItem
} from '../utils/browserPush'

const NotificationContext = createContext(null)

function playSoftChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    o.frequency.value = 880
    g.gain.value = 0.03
    o.start()
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    o.stop(ctx.currentTime + 0.25)
  } catch {
    /* ignore */
  }
}

function isUnread(n) {
  if (!n) return false
  return !(n.read === true || n.isRead === true)
}

function countUnread(list) {
  return (list || []).filter(isUnread).length
}

function normalizeItem(n) {
  if (!n) return n
  const read = Boolean(n.read ?? n.isRead)
  return {
    ...n,
    _id: n._id || n.id,
    read,
    isRead: read,
    type: n.type || (n.severity === 'critical' ? 'error' : n.severity) || 'info',
    category: n.category || n.eventType?.split?.('.')?.[0] || 'system'
  }
}

export function NotificationProvider({ children, mode = 'user' }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [category, setCategory] = useState('all')
  const [pushPermission, setPushPermission] = useState(() => getNotificationPermission())
  const socketRef = useRef(null)
  const knownIds = useRef(new Set())
  const unreadRef = useRef(0)
  const notificationsRef = useRef([])

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // Keep refs in sync for socket handlers
  useEffect(() => {
    unreadRef.current = unreadCount
  }, [unreadCount])
  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  const applyUnread = useCallback((next) => {
    const n = Math.max(0, Number(next) || 0)
    unreadRef.current = n
    setUnreadCount(n)
  }, [])

  /** Always fetch full list (no category filter) so unread stays correct. */
  const fetchList = useCallback(async () => {
    if (!token) {
      setNotifications([])
      applyUnread(0)
      setLoading(false)
      return
    }
    try {
      if (mode === 'admin') {
        const { data } = await api.get('/api/admin/notifications?limit=50')
        if (data.success) {
          const items = (data.notifications || []).map((n) =>
            normalizeItem({
              ...n,
              read: n.isRead,
              type: n.severity === 'critical' ? 'error' : n.severity || 'info',
              category: n.eventType?.split('.')[0] || 'system'
            })
          )
          setNotifications(items)
          const serverUnread =
            typeof data.unreadCount === 'number' ? data.unreadCount : countUnread(items)
          applyUnread(serverUnread)
          knownIds.current = new Set(items.map((n) => String(n._id)))
        }
      } else {
        try {
          const { data } = await api.get('/api/notifications?limit=50')
          if (data.success) {
            const items = (data.notifications || []).map(normalizeItem)
            setNotifications(items)
            // Prefer authoritative server count
            if (typeof data.unreadCount === 'number') {
              applyUnread(data.unreadCount)
            } else {
              applyUnread(countUnread(items))
            }
            knownIds.current = new Set(items.map((n) => String(n._id)))
          }
        } catch {
          const { data } = await api.get('/api/auth/notifications')
          if (data.success) {
            const items = (data.notifications || []).map(normalizeItem)
            setNotifications(items)
            applyUnread(countUnread(items))
            knownIds.current = new Set(items.map((n) => String(n._id)))
          }
        }
      }
    } catch (err) {
      console.error('[Notifications] fetch failed', err)
    } finally {
      setLoading(false)
    }
  }, [token, mode, applyUnread])

  const fetchUnreadOnly = useCallback(async () => {
    if (!token || mode === 'admin') return
    try {
      const { data } = await api.get('/api/notifications/unread-count')
      if (data.success && typeof data.unreadCount === 'number') {
        applyUnread(data.unreadCount)
      }
    } catch {
      /* ignore */
    }
  }, [token, mode, applyUnread])

  // Ask for browser push permission once when authenticated
  useEffect(() => {
    if (!token || mode === 'admin') return undefined
    let cancelled = false
    ;(async () => {
      // Delay slightly so it doesn't fight with login redirect
      await new Promise((r) => setTimeout(r, 1800))
      if (cancelled) return
      const perm = await ensureNotificationPermissionOnce()
      if (!cancelled) setPushPermission(perm)
    })()
    return () => {
      cancelled = true
    }
  }, [token, mode])

  const enablePush = useCallback(async () => {
    const perm = await requestNotificationPermission()
    setPushPermission(perm)
    return perm
  }, [])

  const announceNew = useCallback((n) => {
    if (n.playSound !== false) playSoftChime()

    // In-app toast (single place; easy dismiss on mobile)
    toast(
      (t) => (
        <div className="flex items-start gap-2 max-w-xs">
          <button
            type="button"
            className="text-left flex-1 min-w-0"
            onClick={() => {
              toast.dismiss(t.id)
              if (n.actionUrl && typeof window !== 'undefined') {
                window.location.assign(n.actionUrl)
              }
            }}
          >
            <p className="font-semibold text-sm">{n.title || 'New notification'}</p>
            {n.message ? (
              <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{n.message}</p>
            ) : null}
            {n.actionLabel ? (
              <p className="text-[11px] font-semibold text-[#1199fa] mt-1">{n.actionLabel} →</p>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="shrink-0 w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-bold"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ),
      { duration: 5000, id: `n-${String(n._id)}` }
    )

    // Native OS/browser push banner
    if (shouldShowPushForNewItem()) {
      showBrowserPush({
        title: n.title || 'New notification',
        body: n.message || '',
        tag: `notif-${String(n._id)}`,
        url: n.actionUrl || '/notifications',
        requireInteraction: n.severity === 'critical' || n.severity === 'error'
      })
    }
  }, [])

  // Socket.IO connection
  useEffect(() => {
    if (!token) return undefined

    const url = getSocketUrl()
    // Prefer polling first through unreliable proxies, then upgrade to websocket
    const socket = io(url, {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 40,
      reconnectionDelay: 1000,
      timeout: 12000
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('notifications:subscribe')
      // Re-sync counts after reconnect
      fetchUnreadOnly()
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', (err) => {
      setConnected(false)
      if (import.meta.env.DEV) {
        console.warn('[Socket] connect_error', url, err?.message || err)
      }
    })

    const onUserNew = (payload) => {
      if (mode === 'admin') return
      const raw = payload?.notification
      if (!raw?._id && !raw?.id) return
      const n = normalizeItem({ ...raw, read: false, isRead: false })
      const id = String(n._id)
      if (knownIds.current.has(id)) return
      knownIds.current.add(id)

      setNotifications((prev) => {
        const next = [n, ...prev.filter((x) => String(x._id) !== id)].slice(0, 100)
        return next
      })

      // Prefer server delta if provided, else +1
      if (typeof payload?.unreadCount === 'number') {
        applyUnread(payload.unreadCount)
      } else {
        applyUnread(unreadRef.current + 1)
      }

      announceNew(n)
    }

    const onAdminNew = (payload) => {
      if (mode !== 'admin') return
      const raw = payload?.notification
      if (!raw?._id && !raw?.id) return
      const n = normalizeItem({
        ...raw,
        read: false,
        isRead: false,
        type: raw.severity === 'critical' ? 'error' : raw.severity || 'info'
      })
      const id = String(n._id)
      if (knownIds.current.has(id)) return
      knownIds.current.add(id)
      setNotifications((prev) => [n, ...prev].slice(0, 100))
      applyUnread(unreadRef.current + 1)
      // Single in-app toast only (no duplicate OS push while admin panel is open)
      playSoftChime()
      toast(
        (t) => (
          <div className="flex items-start gap-2 max-w-xs">
            <button
              type="button"
              className="text-left flex-1 min-w-0"
              onClick={() => toast.dismiss(t.id)}
            >
              <p className="font-semibold text-sm">{n.title || 'Admin alert'}</p>
              {n.message ? (
                <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{n.message}</p>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="shrink-0 w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-bold"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ),
        { duration: 4500, id: `admin-n-${id}` }
      )
    }

    const onRead = (payload) => {
      if (mode === 'admin') return
      const id = payload?.id
      if (!id) return
      setNotifications((prev) =>
        prev.map((n) =>
          String(n._id) === String(id) ? { ...n, read: true, isRead: true } : n
        )
      )
      if (typeof payload.unreadCount === 'number') {
        applyUnread(payload.unreadCount)
      } else {
        // Recompute from local list after mark
        setNotifications((prev) => {
          applyUnread(countUnread(prev))
          return prev
        })
      }
    }

    const onReadAll = (payload) => {
      if (mode === 'admin') return
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })))
      applyUnread(typeof payload?.unreadCount === 'number' ? payload.unreadCount : 0)
    }

    const onUnread = (payload) => {
      if (mode === 'admin') return
      if (typeof payload?.unreadCount === 'number') {
        applyUnread(payload.unreadCount)
      } else if (typeof payload?.delta === 'number') {
        applyUnread(unreadRef.current + payload.delta)
      }
    }

    socket.on('notification:new', onUserNew)
    socket.on('admin:notification:new', onAdminNew)
    socket.on('notification:read', onRead)
    socket.on('notification:read_all', onReadAll)
    socket.on('notification:unread', onUnread)

    return () => {
      socket.off('notification:new', onUserNew)
      socket.off('admin:notification:new', onAdminNew)
      socket.off('notification:read', onRead)
      socket.off('notification:read_all', onReadAll)
      socket.off('notification:unread', onUnread)
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, mode, applyUnread, announceNew, fetchUnreadOnly])

  // Initial + polling fallback
  useEffect(() => {
    fetchList()
    const listTimer = setInterval(fetchList, 45_000)
    const unreadTimer = setInterval(fetchUnreadOnly, 20_000)
    return () => {
      clearInterval(listTimer)
      clearInterval(unreadTimer)
    }
  }, [fetchList, fetchUnreadOnly])

  const markRead = useCallback(
    async (id) => {
      const idStr = String(id)
      const current = notificationsRef.current.find((n) => String(n._id) === idStr)
      const wasUnread = current ? isUnread(current) : true

      // Optimistic
      setNotifications((prev) =>
        prev.map((n) =>
          String(n._id) === idStr ? { ...n, read: true, isRead: true } : n
        )
      )
      if (wasUnread) {
        applyUnread(Math.max(0, unreadRef.current - 1))
      }

      try {
        if (mode === 'admin') {
          const { data } = await api.put(`/api/admin/notifications/${idStr}/read`)
          if (typeof data?.unreadCount === 'number') applyUnread(data.unreadCount)
        } else {
          try {
            const { data } = await api.put(`/api/notifications/${idStr}/read`)
            if (typeof data?.unreadCount === 'number') {
              applyUnread(data.unreadCount)
            } else {
              await fetchUnreadOnly()
            }
          } catch {
            const { data } = await api.put(`/api/auth/notifications/${idStr}/read`)
            if (typeof data?.unreadCount === 'number') applyUnread(data.unreadCount)
            else await fetchUnreadOnly()
          }
        }
      } catch {
        fetchList()
      }
    },
    [mode, fetchList, fetchUnreadOnly, applyUnread]
  )

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })))
    applyUnread(0)
    try {
      if (mode === 'admin') {
        await api.put('/api/admin/notifications/read-all')
      } else {
        try {
          const { data } = await api.put('/api/notifications/read-all')
          if (typeof data?.unreadCount === 'number') applyUnread(data.unreadCount)
        } catch {
          await api.put('/api/auth/notifications/read-all')
        }
      }
    } catch {
      fetchList()
    }
  }, [mode, fetchList, applyUnread])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      connected,
      category,
      setCategory,
      refresh: fetchList,
      markRead,
      markAllRead,
      mode,
      pushPermission,
      enablePush
    }),
    [
      notifications,
      unreadCount,
      loading,
      connected,
      category,
      fetchList,
      markRead,
      markAllRead,
      mode,
      pushPermission,
      enablePush
    ]
  )

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return ctx
}
