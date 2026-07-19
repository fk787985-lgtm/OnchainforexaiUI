import { useState, useEffect, useRef } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import useChatAutoScroll from '../../hooks/useChatAutoScroll'
import { formatRelativeDate, formatMessageTime, shouldShowDateSeparator } from '../../utils/chatTime'
import SkeletonBlock from '../common/SkeletonBlock'
import MessageAttachments from '../chat/MessageAttachments'
import { TicketStatusPill, TicketPriorityPill } from '../support/TicketStatusPill'
import { isTicketLocked as ticketIsLocked } from '../support/ticketStyles'

function Icon({ d, className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
    </svg>
  )
}

export default function ChatManagement() {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [stats, setStats] = useState(null)
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [ticketSearch, setTicketSearch] = useState('')
  const [activeMobilePanel, setActiveMobilePanel] = useState('list')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [msgBusyId, setMsgBusyId] = useState(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState('')
  const fileInputRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const { handleScroll, scrollToBottom, isNearBottom } = useChatAutoScroll(messages, messagesContainerRef)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await api.get('/api/auth/me')
        if (!cancelled && response.data?.success && response.data.user) {
          const u = response.data.user
          setCurrentUserId(String(u._id || u.id || u.userId || ''))
          setCurrentUserRole(u.role || '')
        }
      } catch {
        // Fallback: decode JWT payload (userId + role)
        try {
          const token = localStorage.getItem('token')
          if (!token) return
          const payload = JSON.parse(atob(token.split('.')[1] || ''))
          if (!cancelled) {
            setCurrentUserId(String(payload.userId || payload.id || ''))
            setCurrentUserRole(payload.role || '')
          }
        } catch {
          /* ignore */
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    fetchStats()
    if (selectedTicket) {
      setSelectedTicket(null)
      setMessages([])
    }
    fetchTickets()
  }, [filters.status, filters.priority, filters.assignedTo])

  useEffect(() => {
    const ticketId = selectedTicket?._id
    if (!ticketId) return

    setActiveMobilePanel('chat')
    fetchMessages(ticketId)
    const interval = setInterval(() => {
      fetchMessages(ticketId, true)
    }, 3000)
    return () => clearInterval(interval)
  }, [selectedTicket?._id])

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/chat/admin/stats')
      if (response.data.success) {
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchTickets = async () => {
    setTicketsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo)

      const queryString = params.toString()
      const url = queryString
        ? `/api/chat/admin/tickets?${queryString}`
        : '/api/chat/admin/tickets'

      const response = await api.get(url)
      if (response.data.success) {
        setTickets(response.data.tickets)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load tickets')
    } finally {
      setTicketsLoading(false)
    }
  }

  const fetchMessages = async (ticketId, silent = false) => {
    if (!silent) setMessagesLoading(true)
    try {
      const response = await api.get(`/api/chat/admin/tickets/${ticketId}/messages`)
      if (response.data.success) {
        setMessages((prevMessages) => {
          const nextMessages = response.data.messages || []
          if (prevMessages.length === nextMessages.length) {
            const prevLastId = prevMessages[prevMessages.length - 1]?._id
            const nextLastId = nextMessages[nextMessages.length - 1]?._id
            // Also re-apply if any text/edit/delete flags changed
            const contentSame =
              prevLastId === nextLastId &&
              prevMessages.every((m, i) => {
                const n = nextMessages[i]
                return (
                  n &&
                  String(m._id) === String(n._id) &&
                  m.message === n.message &&
                  Boolean(m.isDeleted) === Boolean(n.isDeleted) &&
                  String(m.editedAt || '') === String(n.editedAt || '')
                )
              })
            if (contentSame) return prevMessages
          }
          return nextMessages
        })
        if (!silent && response.data.ticket?._id) {
          setSelectedTicket((prev) => {
            if (!prev || prev._id !== response.data.ticket._id) {
              return response.data.ticket
            }
            if (
              prev.status === response.data.ticket.status &&
              prev.priority === response.data.ticket.priority &&
              prev.unreadCount === response.data.ticket.unreadCount
            ) {
              return prev
            }
            return { ...prev, ...response.data.ticket }
          })
        }
        if (!silent) {
          fetchTickets()
          fetchStats()
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('Error fetching messages:', error)
        toast.error('Failed to load messages')
      }
    } finally {
      if (!silent) setMessagesLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) {
      toast.error('Please enter a message or attach a file')
      return
    }
    if (!selectedTicket) {
      toast.error('Please select a ticket')
      return
    }

    setSending(true)
    try {
      const formData = new FormData()
      formData.append('message', newMessage)
      attachments.forEach((file) => {
        formData.append('attachments', file)
      })

      const response = await api.post(
        `/api/chat/admin/tickets/${selectedTicket._id}/messages`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.message])
        setNewMessage('')
        setAttachments([])
        if (fileInputRef.current) fileInputRef.current.value = ''
        await fetchTickets()
        await fetchStats()
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(error.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const canManageMessage = (message) => {
    if (!message || message.senderType !== 'admin' || message.isDeleted) return false
    if (currentUserRole === 'admin') return true
    const senderId = String(message.sender?._id || message.sender || '')
    return senderId && currentUserId && senderId === currentUserId
  }

  const startEditMessage = (message) => {
    setEditingId(message._id)
    setEditText(message.message || '')
  }

  const cancelEditMessage = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEditMessage = async (messageId) => {
    const text = editText.trim()
    if (!text) {
      toast.error('Message cannot be empty')
      return
    }
    setMsgBusyId(messageId)
    try {
      const response = await api.put(`/api/chat/admin/messages/${messageId}`, { message: text })
      if (response.data.success) {
        setMessages((prev) =>
          prev.map((m) => (String(m._id) === String(messageId) ? response.data.message : m))
        )
        setEditingId(null)
        setEditText('')
        toast.success('Message updated')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to edit message')
    } finally {
      setMsgBusyId(null)
    }
  }

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message? The customer will see it as deleted.')) return
    setMsgBusyId(messageId)
    try {
      const response = await api.delete(`/api/chat/admin/messages/${messageId}`)
      if (response.data.success) {
        setMessages((prev) =>
          prev.map((m) => (String(m._id) === String(messageId) ? response.data.message : m))
        )
        if (editingId === messageId) cancelEditMessage()
        toast.success('Message deleted')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message')
    } finally {
      setMsgBusyId(null)
    }
  }

  const updateTicket = async (updates) => {
    if (!selectedTicket) return
    try {
      const response = await api.put(`/api/chat/admin/tickets/${selectedTicket._id}`, updates)
      if (response.data.success) {
        toast.success('Ticket updated')
        await fetchTickets()
        if (selectedTicket._id === response.data.ticket._id) {
          setSelectedTicket(response.data.ticket)
        }
        await fetchStats()
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
      toast.error('Failed to update ticket')
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const maxSize = 10 * 1024 * 1024
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`)
        return false
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`)
        return false
      }
      return true
    })

    if (attachments.length + validFiles.length > 5) {
      toast.error('Maximum 5 files allowed')
      return
    }
    setAttachments([...attachments, ...validFiles])
  }

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const filteredTickets = tickets.filter((ticket) => {
    if (!ticketSearch.trim()) return true
    const q = ticketSearch.toLowerCase()
    const subject = ticket.subject?.toLowerCase() || ''
    const userName = ticket.user?.fullName?.toLowerCase() || ''
    const userEmail = ticket.user?.email?.toLowerCase() || ''
    return subject.includes(q) || userName.includes(q) || userEmail.includes(q)
  })

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setSelectedTicket(null)
    setMessages([])
    setActiveMobilePanel('list')
  }

  const clearFilters = () => {
    setFilters({ status: '', priority: '', assignedTo: '' })
    setTicketSearch('')
    setSelectedTicket(null)
    setMessages([])
    setActiveMobilePanel('list')
  }

  const applyStatFilter = (statusKey) => {
    if (statusKey === 'all') {
      setFilter('status', '')
      return
    }
    setFilter('status', statusKey)
  }

  const isTicketLocked = selectedTicket && ticketIsLocked(selectedTicket.status)
  const hasActiveFilters = !!(filters.status || filters.priority || filters.assignedTo || ticketSearch)

  return (
    <div className="space-y-4 p-1 sm:p-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-[#0b1426] via-[#0f2744] to-[#1199fa] p-5 sm:p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_10%,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/80">Support desk</p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">Customer service</h1>
            <p className="text-sm text-white/70 mt-1.5 max-w-md">
              Clear queue → open ticket → reply in chat → resolve or close
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { n: '1', t: 'Filter inbox' },
              { n: '2', t: 'Open ticket' },
              { n: '3', t: 'Reply & resolve' }
            ].map((s) => (
              <span
                key={s.n}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold"
              >
                <span className="w-4 h-4 rounded-full bg-white text-[#0b1426] text-[10px] font-extrabold flex items-center justify-center">
                  {s.n}
                </span>
                {s.t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats — clickable filters */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {[
            { key: 'all', l: 'Total', v: stats.total, accent: 'text-slate-900 dark:text-white' },
            { key: 'open', l: 'Open', v: stats.open, accent: 'text-amber-600' },
            { key: 'in_progress', l: 'In progress', v: stats.inProgress, accent: 'text-[#1199fa]' },
            { key: 'resolved', l: 'Resolved', v: stats.resolved, accent: 'text-emerald-600' },
            { key: null, l: 'Unread', v: stats.unreadMessages, accent: 'text-rose-600', clickable: false }
          ].map((s) => {
            const active = s.key === 'all' ? !filters.status : filters.status === s.key
            const clickable = s.clickable !== false
            return (
              <button
                key={s.l}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && applyStatFilter(s.key)}
                className={`text-left rounded-xl border px-3 py-3 transition ${
                  clickable
                    ? active
                      ? 'border-[#1199fa] bg-[#1199fa]/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#1199fa]/50'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-default'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{s.l}</p>
                <p className={`text-2xl font-extrabold tracking-tight ${s.accent}`}>{s.v ?? 0}</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold">Filters</p>
            <p className="text-[11px] text-slate-500">Narrow the inbox before you open a chat</p>
          </div>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-[#1199fa] hover:underline">
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="fx-select !min-h-[42px] !text-sm"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilter('priority', e.target.value)}
            className="fx-select !min-h-[42px] !text-sm"
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={filters.assignedTo}
            onChange={(e) => setFilter('assignedTo', e.target.value)}
            className="fx-select !min-h-[42px] !text-sm"
          >
            <option value="">All assignees</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <div className="relative">
            <input
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              placeholder="Search customer or subject…"
              className="fx-input !min-h-[42px] !text-sm !pl-9"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </span>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-3 h-[calc(100vh-340px)] min-h-[520px]">
        {/* Inbox list */}
        <div
          className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex flex-col shadow-sm ${
            activeMobilePanel === 'chat' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-950/40">
            <div>
              <p className="font-bold text-sm">Inbox</p>
              <p className="text-[10px] text-slate-500">{filteredTickets.length} tickets</p>
            </div>
            {ticketsLoading ? (
              <span className="text-[10px] font-semibold text-[#1199fa] animate-pulse">Syncing…</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  fetchTickets()
                  fetchStats()
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-[#1199fa] uppercase tracking-wide"
              >
                Refresh
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {ticketsLoading ? (
              <>
                <SkeletonBlock className="h-20 w-full rounded-xl" />
                <SkeletonBlock className="h-20 w-full rounded-xl" />
                <SkeletonBlock className="h-20 w-full rounded-xl" />
              </>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Icon
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    className="w-6 h-6 text-slate-400"
                  />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No tickets match</p>
                <p className="text-xs text-slate-500 mt-1">Adjust filters or clear search</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket._id}
                  type="button"
                  onClick={() => {
                    setSelectedTicket(ticket)
                    setActiveMobilePanel('chat')
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedTicket?._id === ticket._id
                      ? 'border-[#1199fa] bg-[#1199fa]/10 shadow-sm'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex justify-between gap-2 items-start">
                    <p className="font-semibold text-sm truncate text-slate-900 dark:text-white">
                      {ticket.subject}
                    </p>
                    {ticket.unreadCount > 0 && (
                      <span className="shrink-0 h-5 min-w-[1.25rem] px-1.5 rounded-full bg-[#1199fa] text-white text-[10px] font-bold flex items-center justify-center">
                        {ticket.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {ticket.user?.fullName || ticket.user?.email || 'Customer'}
                    {ticket.user?.uniqueId ? ` · ${ticket.user.uniqueId}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <TicketStatusPill status={ticket.status} size="xs" />
                    <TicketPriorityPill priority={ticket.priority} size="xs" />
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {formatRelativeDate(ticket.lastMessageAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div
          className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex flex-col shadow-sm ${
            activeMobilePanel === 'list' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {selectedTicket ? (
            <>
              {/* Ticket toolbar */}
              <div className="px-3 sm:px-4 py-3 border-b border-slate-200 dark:border-slate-700 space-y-3 bg-slate-50/80 dark:bg-slate-950/40">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveMobilePanel('list')}
                    className="lg:hidden text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    Inbox
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate text-slate-900 dark:text-white">
                      {selectedTicket.subject}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {selectedTicket.user?.fullName || selectedTicket.user?.email || 'Customer'}
                      {selectedTicket.user?.email && selectedTicket.user?.fullName
                        ? ` · ${selectedTicket.user.email}`
                        : ''}
                      {selectedTicket.user?.uniqueId ? ` · ID ${selectedTicket.user.uniqueId}` : ''}
                    </p>
                  </div>
                  <TicketStatusPill status={selectedTicket.status} size="xs" />
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</span>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => updateTicket({ status: e.target.value })}
                      className="fx-select !w-auto !min-h-[34px] !py-1 !text-xs !rounded-lg"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Priority</span>
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) => updateTicket({ priority: e.target.value })}
                      className="fx-select !w-auto !min-h-[34px] !py-1 !text-xs !rounded-lg"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-auto">
                    {selectedTicket.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => updateTicket({ status: 'in_progress' })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1199fa] text-white hover:brightness-110"
                      >
                        Mark active
                      </button>
                    )}
                    {!ticketIsLocked(selectedTicket.status) && (
                      <button
                        type="button"
                        onClick={() => updateTicket({ status: 'resolved' })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:brightness-110"
                      >
                        Resolve
                      </button>
                    )}
                    {!isTicketLocked && (
                      <button
                        type="button"
                        onClick={() => updateTicket({ status: 'closed' })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 dark:bg-slate-700 text-white hover:brightness-110"
                      >
                        Close
                      </button>
                    )}
                    {isTicketLocked && (
                      <button
                        type="button"
                        onClick={() => updateTicket({ status: 'open' })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:brightness-110"
                      >
                        Reopen
                      </button>
                    )}
                    {selectedTicket.status !== 'archived' && (
                      <button
                        type="button"
                        onClick={() => updateTicket({ status: 'archived' })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-1 bg-gradient-to-b from-slate-50 to-white dark:from-[#0a1220] dark:to-[#0e1626]"
              >
                {messagesLoading ? (
                  <div className="space-y-3 p-2">
                    <SkeletonBlock className="h-12 w-2/3 rounded-xl" />
                    <SkeletonBlock className="h-12 w-1/2 rounded-xl ml-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-6">
                    <div>
                      <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">No messages yet</p>
                      <p className="text-xs text-slate-500 mt-1">Send the first reply to the customer</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const showDate = shouldShowDateSeparator(message, messages[index - 1])
                    const mine = message.senderType === 'admin'
                    const deleted = Boolean(message.isDeleted)
                    const canManage = canManageMessage(message)
                    const isEditing = editingId === message._id
                    return (
                      <div key={message._id}>
                        {showDate && (
                          <div className="flex justify-center py-2">
                            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-500">
                              {new Date(message.createdAt).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        <div className={`flex mb-2.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                              deleted
                                ? 'bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-600 text-slate-500'
                                : mine
                                  ? 'bg-[#1199fa] text-white rounded-br-md'
                                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-md'
                            }`}
                          >
                            <p
                              className={`text-[10px] font-bold mb-0.5 ${
                                deleted ? 'text-slate-400' : mine ? 'text-blue-100' : 'text-[#1199fa]'
                              }`}
                            >
                              {mine
                                ? `${message.sender?.nickname || message.sender?.fullName || 'Support'} · ${
                                    message.sender?.role === 'subadmin' ? 'Sub-admin' : 'Admin'
                                  }`
                                : message.sender?.fullName || message.sender?.email || 'Customer'}
                            </p>

                            {isEditing ? (
                              <div className="space-y-2 min-w-[200px]">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={3}
                                  className="w-full text-sm rounded-lg px-2 py-1.5 text-slate-900 border border-white/40"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={cancelEditMessage}
                                    className="text-[11px] font-semibold px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={msgBusyId === message._id}
                                    onClick={() => saveEditMessage(message._id)}
                                    className="text-[11px] font-semibold px-2 py-1 rounded bg-white text-[#1199fa] disabled:opacity-50"
                                  >
                                    {msgBusyId === message._id ? 'Saving…' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p
                                className={`text-sm whitespace-pre-wrap leading-relaxed ${
                                  deleted ? 'italic opacity-80' : ''
                                }`}
                              >
                                {deleted ? 'This message was deleted' : message.message}
                              </p>
                            )}

                            {!deleted && !isEditing && (
                              <MessageAttachments
                                attachments={message.attachments || []}
                                isOwnMessage={mine}
                              />
                            )}

                            <div
                              className={`mt-1 flex items-center gap-2 flex-wrap ${
                                mine && !deleted ? 'justify-between' : ''
                              }`}
                            >
                              <p
                                className={`text-[10px] ${
                                  deleted ? 'text-slate-400' : mine ? 'text-blue-100' : 'text-slate-400'
                                }`}
                              >
                                {formatMessageTime(message.createdAt)}
                                {message.editedAt && !deleted ? ' · edited' : ''}
                              </p>
                              {canManage && !isEditing && (
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    disabled={msgBusyId === message._id}
                                    onClick={() => startEditMessage(message)}
                                    className="text-[10px] font-bold underline underline-offset-2 opacity-90 hover:opacity-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={msgBusyId === message._id}
                                    onClick={() => deleteMessage(message._id)}
                                    className="text-[10px] font-bold underline underline-offset-2 opacity-90 hover:opacity-100 text-rose-100"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Composer */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                {isTicketLocked ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-center text-sm text-slate-500">
                    Ticket is <strong className="text-slate-700 dark:text-slate-200">{selectedTicket.status}</strong>.
                    Reopen to reply, or archive when finished.
                  </div>
                ) : (
                  <>
                    {attachments.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {attachments.map((file, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 rounded-lg bg-[#1199fa]/10 border border-[#1199fa]/20 inline-flex gap-1 items-center"
                          >
                            <span className="truncate max-w-[120px]">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-rose-500 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#1199fa] transition"
                        title="Attach"
                      >
                        <Icon d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" className="w-5 h-5" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      />
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        placeholder="Type a reply to the customer…"
                        rows={2}
                        className="fx-input flex-1 !min-h-[48px] resize-none !rounded-2xl"
                      />
                      <button
                        type="button"
                        onClick={sendMessage}
                        disabled={sending || (!newMessage.trim() && !attachments.length)}
                        className="fx-btn fx-btn-primary !min-h-[48px] !px-5 !rounded-2xl disabled:opacity-50"
                      >
                        {sending ? '…' : 'Send'}
                      </button>
                    </div>
                    {!isNearBottom() && (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => scrollToBottom('smooth')}
                          className="text-xs font-semibold text-[#1199fa]"
                        >
                          Jump to latest
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="max-w-sm">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-[#1199fa]/10 border border-[#1199fa]/20 flex items-center justify-center mb-4">
                  <Icon
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    className="w-8 h-8 text-[#1199fa]"
                  />
                </div>
                <p className="font-extrabold text-lg tracking-tight">Select a ticket</p>
                <p className="text-sm text-slate-500 mt-2">
                  Choose a conversation from the inbox. Use filters or click stats to focus the queue.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
