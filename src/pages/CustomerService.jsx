import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import useChatAutoScroll from '../hooks/useChatAutoScroll'
import { formatRelativeDate, formatMessageTime, shouldShowDateSeparator } from '../utils/chatTime'
import MessageAttachments from '../components/chat/MessageAttachments'
import { TicketStatusPill } from '../components/support/TicketStatusPill'
import { SUPPORT_TOPICS, isTicketLocked } from '../components/support/ticketStyles'

function Icon({ d, className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
    </svg>
  )
}

export default function CustomerService() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [newTicketSubject, setNewTicketSubject] = useState('')
  const [newTicketBody, setNewTicketBody] = useState('')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [attachments, setAttachments] = useState([])
  const [mobileView, setMobileView] = useState('list')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const fileInputRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const { handleScroll, scrollToBottom, isNearBottom } = useChatAutoScroll(messages, messagesContainerRef)

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    if (!selectedTicket?._id) return
    setMobileView('chat')
    fetchMessages(selectedTicket._id)
    const interval = setInterval(() => fetchMessages(selectedTicket._id, true), 5000)
    return () => clearInterval(interval)
  }, [selectedTicket?._id])

  const fetchTickets = async () => {
    setListLoading(true)
    try {
      const response = await api.get('/api/chat/tickets')
      if (response.data.success) setTickets(response.data.tickets || [])
    } catch {
      toast.error('Unable to load support tickets')
    } finally {
      setListLoading(false)
    }
  }

  const fetchMessages = async (ticketId, silent = false) => {
    try {
      const response = await api.get(`/api/chat/tickets/${ticketId}/messages`)
      if (response.data.success) {
        setMessages((prev) => {
          const next = response.data.messages || []
          if (
            prev.length === next.length &&
            prev[prev.length - 1]?._id === next[next.length - 1]?._id
          ) {
            return prev
          }
          return next
        })
        if (response.data.ticket) {
          setSelectedTicket((prev) => {
            if (!prev || prev._id !== response.data.ticket._id) return response.data.ticket
            if (prev.status === response.data.ticket.status) return prev
            return { ...prev, ...response.data.ticket }
          })
        }
        if (!silent) fetchTickets()
      }
    } catch {
      if (!silent) toast.error('Unable to load conversation')
    }
  }

  const openCreateModal = (topic = null) => {
    setSelectedTopic(topic)
    setNewTicketSubject(topic?.subject || '')
    setNewTicketBody('')
    setShowNewTicket(true)
  }

  const createTicket = async () => {
    if (!newTicketSubject.trim()) {
      toast.error('Subject is required')
      return
    }
    setLoading(true)
    try {
      const response = await api.post('/api/chat/tickets', { subject: newTicketSubject.trim() })
      if (response.data.success) {
        const ticket = response.data.ticket
        if (newTicketBody.trim()) {
          try {
            await api.post(`/api/chat/tickets/${ticket._id}/messages`, {
              message: newTicketBody.trim()
            })
          } catch {
            /* ticket still created */
          }
        }
        toast.success('Ticket submitted')
        setNewTicketSubject('')
        setNewTicketBody('')
        setSelectedTopic(null)
        setShowNewTicket(false)
        await fetchTickets()
        setSelectedTicket(ticket)
        setMobileView('chat')
      }
    } catch {
      toast.error('Unable to submit ticket')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) {
      toast.error('Enter a message or attach a file')
      return
    }
    if (!selectedTicket || isTicketLocked(selectedTicket.status)) return
    setSending(true)
    try {
      const formData = new FormData()
      formData.append('message', newMessage)
      attachments.forEach((f) => formData.append('attachments', f))
      const response = await api.post(
        `/api/chat/tickets/${selectedTicket._id}/messages`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.message])
        setNewMessage('')
        setAttachments([])
        if (fileInputRef.current) fileInputRef.current.value = ''
        await fetchTickets()
        scrollToBottom()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send message')
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const maxSize = 10 * 1024 * 1024
    const valid = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds 10MB`)
        return false
      }
      return true
    })
    if (attachments.length + valid.length > 5) {
      toast.error('Maximum 5 attachments')
      return
    }
    setAttachments([...attachments, ...valid])
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter === 'open' && ['closed', 'archived', 'resolved'].includes(t.status)) return false
      if (statusFilter === 'closed' && !['closed', 'archived', 'resolved'].includes(t.status)) return false
      if (statusFilter !== 'all' && statusFilter !== 'open' && statusFilter !== 'closed') {
        if (t.status !== statusFilter) return false
      }
      if (!search.trim()) return true
      return (t.subject || '').toLowerCase().includes(search.toLowerCase())
    })
  }, [tickets, statusFilter, search])

  const openCount = tickets.filter((t) => !['closed', 'archived', 'resolved'].includes(t.status)).length
  const locked = selectedTicket && isTicketLocked(selectedTicket.status)

  return (
    <div className="fx-page min-h-screen flex flex-col">
      {/* Header — institutional, not playful */}
      <header className="sticky top-0 z-40 border-b border-[var(--fx-color-border)] bg-[var(--fx-color-surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (mobileView === 'chat' && selectedTicket) {
                  setMobileView('list')
                  return
                }
                navigate(-1)
              }}
              className="p-2 -ml-2 rounded-lg text-[var(--fx-color-text-muted)] hover:text-[var(--fx-color-text)] hover:bg-[var(--fx-color-surface-muted)] transition"
              aria-label="Back"
            >
              <Icon d="M15 19l-7-7 7-7" className="w-[18px] h-[18px]" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-[15px] sm:text-base font-semibold tracking-tight text-[var(--fx-color-text)]">
                Support
              </h1>
            </div>

            <button
              type="button"
              onClick={() => openCreateModal()}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-semibold text-white bg-[var(--fx-color-primary)] hover:bg-[var(--fx-color-primary-strong)] transition shadow-sm"
            >
              Create ticket
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header meta — calm, useful */}
      <div className="border-b border-[var(--fx-color-border)] bg-[var(--fx-color-surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[13px] text-[var(--fx-color-text-muted)] leading-relaxed max-w-xl">
            Create a ticket for deposits, withdrawals, trading, or account issues.
            Agents respond in this conversation.
          </p>
          <div className="flex items-center gap-4 text-[12px] text-[var(--fx-color-text-muted)] shrink-0">
            <span>
              <span className="text-[var(--fx-color-text)] font-medium tabular-nums">{openCount}</span>
              {' '}active
            </span>
            <span className="hidden sm:inline text-[var(--fx-color-border)]">|</span>
            <a
              href="mailto:support@onchainforexai.com"
              className="text-[var(--fx-color-primary)] hover:underline font-medium"
            >
              support@onchainforexai.com
            </a>
          </div>
        </div>
      </div>

      {/* Main workspace */}
      <div className="max-w-6xl mx-auto w-full flex-1 flex min-h-0 px-4 sm:px-6 py-4 gap-0 md:gap-0 h-[calc(100vh-7.5rem)]">
        <div className="flex-1 flex min-h-0 rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] overflow-hidden">
          {/* Ticket list */}
          <aside
            className={`w-full md:w-[320px] lg:w-[340px] shrink-0 flex flex-col border-r border-[var(--fx-color-border)] ${
              mobileView === 'chat' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="px-4 py-3 border-b border-[var(--fx-color-border)] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-[var(--fx-color-text)]">Tickets</h2>
                <span className="text-[11px] text-[var(--fx-color-text-muted)] tabular-nums">
                  {filteredTickets.length}
                </span>
              </div>

              <div className="relative">
                <Icon
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fx-color-text-muted)]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tickets"
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--fx-color-border)] bg-[var(--fx-color-bg)] text-[13px] text-[var(--fx-color-text)] placeholder:text-[var(--fx-color-text-muted)] focus:outline-none focus:border-[var(--fx-color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--fx-color-primary)_15%,transparent)]"
                />
              </div>

              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'open', label: 'Active' },
                  { id: 'closed', label: 'Closed' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`flex-1 h-8 rounded-md text-[12px] font-medium transition ${
                      statusFilter === f.id
                        ? 'bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text)] ring-1 ring-[var(--fx-color-border)]'
                        : 'text-[var(--fx-color-text-muted)] hover:text-[var(--fx-color-text)] hover:bg-[var(--fx-color-surface-muted)]/60'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {listLoading ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-[var(--fx-color-surface-muted)] animate-pulse" />
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-[13px] font-medium text-[var(--fx-color-text)]">
                    {tickets.length === 0 ? 'No tickets' : 'No matching tickets'}
                  </p>
                  <p className="text-[12px] text-[var(--fx-color-text-muted)] mt-1.5 leading-relaxed">
                    {tickets.length === 0
                      ? 'Submit a ticket to contact support.'
                      : 'Adjust filters or search terms.'}
                  </p>
                  {tickets.length === 0 && (
                    <button
                      type="button"
                      onClick={() => openCreateModal()}
                      className="mt-4 inline-flex h-9 px-4 items-center rounded-lg text-[13px] font-semibold text-white bg-[var(--fx-color-primary)] hover:bg-[var(--fx-color-primary-strong)]"
                    >
                      Submit ticket
                    </button>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-[var(--fx-color-border)]">
                  {filteredTickets.map((ticket) => {
                    const active = selectedTicket?._id === ticket._id
                    return (
                      <li key={ticket._id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setMobileView('chat')
                          }}
                          className={`w-full text-left px-4 py-3.5 transition ${
                            active
                              ? 'bg-[color-mix(in_srgb,var(--fx-color-primary)_8%,var(--fx-color-surface))] border-l-2 border-l-[var(--fx-color-primary)]'
                              : 'border-l-2 border-l-transparent hover:bg-[var(--fx-color-surface-muted)]/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-[13px] leading-snug line-clamp-2 ${
                                active
                                  ? 'font-semibold text-[var(--fx-color-text)]'
                                  : 'font-medium text-[var(--fx-color-text)]'
                              }`}
                            >
                              {ticket.subject}
                            </p>
                            {ticket.unreadCount > 0 && (
                              <span className="shrink-0 mt-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--fx-color-primary)] text-white text-[10px] font-semibold flex items-center justify-center">
                                {ticket.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <TicketStatusPill status={ticket.status} size="xs" />
                            <time className="text-[11px] text-[var(--fx-color-text-muted)] tabular-nums">
                              {formatRelativeDate(ticket.lastMessageAt)}
                            </time>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* Conversation / landing */}
          <section
            className={`flex-1 min-w-0 flex flex-col bg-[var(--fx-color-bg)] ${
              mobileView === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selectedTicket ? (
              <>
                <div className="px-4 sm:px-5 py-3 border-b border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] flex items-center gap-3">
                  <button
                    type="button"
                    className="md:hidden text-[12px] font-medium text-[var(--fx-color-primary)]"
                    onClick={() => setMobileView('list')}
                  >
                    Tickets
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[var(--fx-color-text)] truncate">
                      {selectedTicket.subject}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <TicketStatusPill status={selectedTicket.status} size="xs" />
                      <span className="text-[11px] text-[var(--fx-color-text-muted)]">
                        Ticket conversation
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-sm">
                        <p className="text-[13px] font-medium text-[var(--fx-color-text)]">
                          No messages yet
                        </p>
                        <p className="text-[12px] text-[var(--fx-color-text-muted)] mt-1.5 leading-relaxed">
                          Add context, transaction references, or screenshots so support can assist efficiently.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-3xl mx-auto space-y-1">
                      {messages.map((message, index) => {
                        const showDate = shouldShowDateSeparator(message, messages[index - 1])
                        const mine = message.senderType === 'user'
                        return (
                          <div key={message._id}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <span className="text-[11px] font-medium px-2.5 py-1 rounded text-[var(--fx-color-text-muted)] bg-[var(--fx-color-surface)] border border-[var(--fx-color-border)]">
                                  {new Date(message.createdAt).toLocaleDateString(undefined, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                            <div className={`flex mb-3 ${mine ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[88%] sm:max-w-[72%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                                  mine
                                    ? 'bg-[var(--fx-color-primary)] text-white rounded-2xl rounded-br-md'
                                    : 'bg-[var(--fx-color-surface)] text-[var(--fx-color-text)] border border-[var(--fx-color-border)] rounded-2xl rounded-bl-md'
                                }`}
                              >
                                {!mine && (
                                  <p className="text-[11px] font-semibold text-[var(--fx-color-text-muted)] mb-1">
                                    {message.sender?.nickname ||
                                      message.sender?.fullName ||
                                      'Support agent'}
                                  </p>
                                )}
                                <p
                                  className={`whitespace-pre-wrap ${
                                    message.isDeleted ? 'italic opacity-70' : ''
                                  }`}
                                >
                                  {message.isDeleted
                                    ? 'This message was deleted'
                                    : message.message}
                                </p>
                                {!message.isDeleted && (
                                  <MessageAttachments
                                    attachments={message.attachments || []}
                                    isOwnMessage={mine}
                                  />
                                )}
                                <p
                                  className={`text-[10px] mt-1.5 tabular-nums ${
                                    mine ? 'text-white/70' : 'text-[var(--fx-color-text-muted)]'
                                  }`}
                                >
                                  {formatMessageTime(message.createdAt)}
                                  {message.editedAt && !message.isDeleted ? ' · edited' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] p-3 sm:p-4">
                  {locked ? (
                    <div className="rounded-lg border border-[var(--fx-color-border)] bg-[var(--fx-color-surface-muted)] px-4 py-3 text-[13px] text-[var(--fx-color-text-muted)] text-center">
                      This ticket is {selectedTicket.status}. Submit a new ticket for further assistance.
                    </div>
                  ) : (
                    <>
                      {attachments.length > 0 && (
                        <div className="mb-2.5 flex flex-wrap gap-1.5">
                          {attachments.map((file, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-[var(--fx-color-surface-muted)] border border-[var(--fx-color-border)]"
                            >
                              <span className="truncate max-w-[140px]">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setAttachments((a) => a.filter((_, j) => j !== i))}
                                className="text-[var(--fx-color-text-muted)] hover:text-rose-500"
                                aria-label="Remove"
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
                          className="h-11 w-11 shrink-0 rounded-lg border border-[var(--fx-color-border)] text-[var(--fx-color-text-muted)] hover:text-[var(--fx-color-text)] hover:bg-[var(--fx-color-surface-muted)] flex items-center justify-center transition"
                          title="Attach"
                        >
                          <Icon d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" className="w-[18px] h-[18px]" />
                        </button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          rows={1}
                          placeholder="Write a message…"
                          className="flex-1 min-h-[44px] max-h-32 px-3.5 py-2.5 rounded-lg border border-[var(--fx-color-border)] bg-[var(--fx-color-bg)] text-[13px] text-[var(--fx-color-text)] placeholder:text-[var(--fx-color-text-muted)] resize-none focus:outline-none focus:border-[var(--fx-color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--fx-color-primary)_15%,transparent)]"
                        />
                        <button
                          type="button"
                          onClick={sendMessage}
                          disabled={sending || (!newMessage.trim() && !attachments.length)}
                          className="h-11 px-4 shrink-0 rounded-lg text-[13px] font-semibold text-white bg-[var(--fx-color-primary)] hover:bg-[var(--fx-color-primary-strong)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          {sending ? 'Sending' : 'Send'}
                        </button>
                      </div>
                      {!isNearBottom() && (
                        <div className="mt-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => scrollToBottom('smooth')}
                            className="text-[12px] font-medium text-[var(--fx-color-primary)]"
                          >
                            Latest messages
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              /* Landing — categories, professional */
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
                  <div className="mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--fx-color-text)]">
                      Contact support
                    </h2>
                    <p className="mt-2 text-[13px] sm:text-[14px] text-[var(--fx-color-text-muted)] leading-relaxed">
                      Select a category to open a ticket, or choose an existing ticket from the list.
                      Response times depend on volume; include transaction IDs and relevant details.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] overflow-hidden divide-y divide-[var(--fx-color-border)]">
                    {SUPPORT_TOPICS.map((topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => openCreateModal(topic)}
                        className="w-full text-left px-4 sm:px-5 py-4 flex items-center gap-4 hover:bg-[var(--fx-color-surface-muted)]/60 transition group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] sm:text-[14px] font-medium text-[var(--fx-color-text)] group-hover:text-[var(--fx-color-primary)] transition">
                            {topic.label}
                          </p>
                          <p className="text-[12px] text-[var(--fx-color-text-muted)] mt-0.5 leading-relaxed">
                            {topic.hint}
                          </p>
                        </div>
                        <Icon
                          d="M9 5l7 7-7 7"
                          className="w-4 h-4 text-[var(--fx-color-text-muted)] group-hover:text-[var(--fx-color-primary)] shrink-0 transition"
                        />
                      </button>
                    ))}
                  </div>

                  <p className="mt-6 text-[12px] text-[var(--fx-color-text-muted)] leading-relaxed">
                    Prefer email?{' '}
                    <a
                      href="mailto:support@onchainforexai.com"
                      className="text-[var(--fx-color-primary)] font-medium hover:underline"
                    >
                      support@onchainforexai.com
                    </a>
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* New ticket modal — single form, no step wizard */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40">
          <div
            className="absolute inset-0"
            onClick={() => setShowNewTicket(false)}
            aria-hidden
          />
          <div className="relative w-full sm:max-w-[440px] rounded-t-2xl sm:rounded-xl bg-[var(--fx-color-surface)] border border-[var(--fx-color-border)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-[var(--fx-color-border)] flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-[var(--fx-color-text)]">New support ticket</h2>
                <p className="text-[12px] text-[var(--fx-color-text-muted)] mt-0.5">
                  Provide a clear subject and any relevant details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTicket(false)}
                className="p-1.5 rounded-md text-[var(--fx-color-text-muted)] hover:bg-[var(--fx-color-surface-muted)]"
                aria-label="Close"
              >
                <Icon d="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[var(--fx-color-text-muted)] mb-1.5">
                  Category
                </label>
                <select
                  value={selectedTopic?.id || ''}
                  onChange={(e) => {
                    const t = SUPPORT_TOPICS.find((x) => x.id === e.target.value) || null
                    setSelectedTopic(t)
                    if (t) setNewTicketSubject(t.subject)
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--fx-color-border)] bg-[var(--fx-color-bg)] text-[13px] text-[var(--fx-color-text)] focus:outline-none focus:border-[var(--fx-color-primary)]"
                >
                  <option value="">Select category</option>
                  {SUPPORT_TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--fx-color-text-muted)] mb-1.5">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="Brief summary of the issue"
                  autoFocus
                  className="w-full h-10 px-3 rounded-lg border border-[var(--fx-color-border)] bg-[var(--fx-color-bg)] text-[13px] text-[var(--fx-color-text)] placeholder:text-[var(--fx-color-text-muted)] focus:outline-none focus:border-[var(--fx-color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--fx-color-primary)_15%,transparent)]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--fx-color-text-muted)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={newTicketBody}
                  onChange={(e) => setNewTicketBody(e.target.value)}
                  placeholder="Describe the issue. Include amounts, timestamps, and transaction IDs where applicable."
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--fx-color-border)] bg-[var(--fx-color-bg)] text-[13px] text-[var(--fx-color-text)] placeholder:text-[var(--fx-color-text-muted)] resize-y focus:outline-none focus:border-[var(--fx-color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--fx-color-primary)_15%,transparent)]"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[var(--fx-color-border)] flex gap-2 justify-end bg-[var(--fx-color-surface-muted)]/40">
              <button
                type="button"
                onClick={() => setShowNewTicket(false)}
                className="h-9 px-4 rounded-lg text-[13px] font-medium text-[var(--fx-color-text)] border border-[var(--fx-color-border)] bg-[var(--fx-color-surface)] hover:bg-[var(--fx-color-surface-muted)] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !newTicketSubject.trim()}
                onClick={createTicket}
                className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white bg-[var(--fx-color-primary)] hover:bg-[var(--fx-color-primary-strong)] disabled:opacity-40 transition"
              >
                {loading ? 'Submitting…' : 'Submit ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
