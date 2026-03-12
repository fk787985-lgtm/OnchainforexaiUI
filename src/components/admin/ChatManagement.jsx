import { useState, useEffect, useRef } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import { getImageUrl } from '../../utils/imageUrl.js'
import useChatAutoScroll from '../../hooks/useChatAutoScroll'
import { formatRelativeDate, formatMessageTime, shouldShowDateSeparator } from '../../utils/chatTime'
import PageHeader from '../ui/PageHeader'
import EmptyState from '../ui/EmptyState'
import SkeletonBlock from '../common/SkeletonBlock'
import AdminStatusBadge from './AdminStatusBadge'

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
  const fileInputRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const { handleScroll, scrollToBottom, isNearBottom } = useChatAutoScroll(messages, messagesContainerRef)

  useEffect(() => {
    fetchStats()
    // Clear selected ticket when filters change
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
    // Poll for new messages every 3 seconds
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
      if (filters.status && filters.status !== '') {
        params.append('status', filters.status)
      }
      if (filters.priority && filters.priority !== '') {
        params.append('priority', filters.priority)
      }
      if (filters.assignedTo && filters.assignedTo !== '') {
        params.append('assignedTo', filters.assignedTo)
      }

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
            if (prevLastId === nextLastId) return prevMessages
          }
          return nextMessages
        })
        if (!silent && response.data.ticket?._id) {
          setSelectedTicket((prev) => {
            if (!prev || prev._id !== response.data.ticket._id) {
              return response.data.ticket
            }
            // Prevent render loops/blinking caused by replacing selected ticket on each poll.
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
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.message])
        setNewMessage('')
        setAttachments([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
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
    const files = Array.from(e.target.files)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]

    const validFiles = files.filter(file => {
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

  const archiveTicket = async () => {
    if (!selectedTicket) return
    await updateTicket({ status: 'archived' })
  }

  const closeTicket = async () => {
    if (!selectedTicket) return
    await updateTicket({ status: 'closed' })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'archived': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isTicketLocked = selectedTicket && ['closed', 'archived'].includes(selectedTicket.status)

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <PageHeader
        title="Customer Service Console"
        description="Manage customer conversations, triage priority, and resolve tickets quickly."
      />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="fx-card p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Total Tickets</p><p className="text-2xl font-bold">{stats.total}</p></div>
          <div className="fx-card p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Open</p><p className="text-2xl font-bold text-yellow-600">{stats.open}</p></div>
          <div className="fx-card p-4"><p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p><p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p></div>
          <div className="fx-card p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Resolved</p><p className="text-2xl font-bold text-green-600">{stats.resolved}</p></div>
          <div className="fx-card p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Unread</p><p className="text-2xl font-bold text-red-600">{stats.unreadMessages}</p></div>
        </div>
      )}

      <div className="fx-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Filters</p>
          {(filters.status || filters.priority || filters.assignedTo) && (
            <button
              onClick={() => {
                setFilters({ status: '', priority: '', assignedTo: '' })
                setSelectedTicket(null)
                setMessages([])
                setActiveMobilePanel('list')
              }}
              className="text-sm text-indigo-600 dark:text-indigo-400 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value })
              setSelectedTicket(null)
              setMessages([])
              setActiveMobilePanel('list')
            }}
            className="fx-select"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => {
              setFilters({ ...filters, priority: e.target.value })
              setSelectedTicket(null)
              setMessages([])
              setActiveMobilePanel('list')
            }}
            className="fx-select"
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={filters.assignedTo}
            onChange={(e) => {
              setFilters({ ...filters, assignedTo: e.target.value })
              setSelectedTicket(null)
              setMessages([])
              setActiveMobilePanel('list')
            }}
            className="fx-select"
          >
            <option value="">All assignees</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <input
            value={ticketSearch}
            onChange={(e) => setTicketSearch(e.target.value)}
            placeholder="Search subject or customer..."
            className="fx-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-4 h-[calc(100vh-280px)] min-h-[620px]">
        <div className={`fx-card overflow-hidden flex flex-col ${activeMobilePanel === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="font-semibold">Tickets ({filteredTickets.length})</p>
            {ticketsLoading ? <span className="text-xs text-gray-500">Syncing...</span> : null}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {ticketsLoading ? (
              <>
                <SkeletonBlock className="h-20 w-full rounded-xl" />
                <SkeletonBlock className="h-20 w-full rounded-xl" />
                <SkeletonBlock className="h-20 w-full rounded-xl" />
              </>
            ) : filteredTickets.length === 0 ? (
              <EmptyState title="No matching tickets" description="Adjust filters or search to find conversations." icon="search" />
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket._id}
                  onClick={() => {
                    setSelectedTicket(ticket)
                    setActiveMobilePanel('chat')
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedTicket?._id === ticket._id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {ticket.user?.fullName || ticket.user?.email || 'Unknown user'}
                      </p>
                    </div>
                    {ticket.unreadCount > 0 && (
                      <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">{ticket.unreadCount}</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <AdminStatusBadge status={ticket.status} />
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                    <span className="text-xs text-gray-500">{formatRelativeDate(ticket.lastMessageAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`fx-card overflow-hidden flex flex-col ${activeMobilePanel === 'list' ? 'hidden lg:flex' : 'flex'}`}>
          {selectedTicket ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => setActiveMobilePanel('list')}
                        className="lg:hidden text-sm px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                      >
                        Back
                      </button>
                      <p className="font-semibold truncate">{selectedTicket.subject}</p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {selectedTicket.user?.fullName || selectedTicket.user?.email || 'Unknown user'}
                      {selectedTicket.user?.uniqueId ? ` (${selectedTicket.user.uniqueId})` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <AdminStatusBadge status={selectedTicket.status} />
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(selectedTicket.priority)}`}>{selectedTicket.priority}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={selectedTicket.status} onChange={(e) => updateTicket({ status: e.target.value })} className="fx-select !w-auto !py-2 !text-sm">
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <select value={selectedTicket.priority} onChange={(e) => updateTicket({ priority: e.target.value })} className="fx-select !w-auto !py-2 !text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <button onClick={closeTicket} disabled={isTicketLocked} className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-800 text-white rounded-lg disabled:opacity-50">
                    Close
                  </button>
                  <button onClick={archiveTicket} disabled={selectedTicket.status === 'archived'} className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50">
                    Archive
                  </button>
                </div>
              </div>

              <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                {messagesLoading ? (
                  <>
                    <SkeletonBlock className="h-12 w-2/3 rounded-xl" />
                    <SkeletonBlock className="h-12 w-1/2 rounded-xl ml-auto" />
                    <SkeletonBlock className="h-12 w-3/4 rounded-xl" />
                  </>
                ) : messages.length === 0 ? (
                  <EmptyState title="No messages yet" description="Start the conversation by sending the first response." icon="bell" />
                ) : (
                  messages.map((message, index) => {
                    const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1])
                    return (
                      <div key={message._id}>
                        {showDateSeparator ? (
                          <div className="flex justify-center py-2">
                            <span className="px-3 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {new Date(message.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ) : null}
                        <div className={`flex items-end gap-2 ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[84%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                            message.senderType === 'admin'
                              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm'
                              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-gray-600'
                          }`}>
                            <p className={`text-xs font-semibold mb-1 ${message.senderType === 'admin' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-300'}`}>
                              {message.senderType === 'admin'
                                ? `${message.sender?.fullName || 'Support Team'} (Admin)`
                                : (message.sender?.fullName || message.sender?.email || 'User')}
                            </p>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                            {message.attachments?.length ? (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment, idx) => (
                                  <a
                                    key={idx}
                                    href={getImageUrl(attachment.path)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`block text-sm p-2 rounded-lg truncate ${
                                      message.senderType === 'admin'
                                        ? 'bg-indigo-700 hover:bg-indigo-800 text-white'
                                        : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    {attachment.filename}
                                  </a>
                                ))}
                              </div>
                            ) : null}
                            <p className={`text-xs mt-2 ${message.senderType === 'admin' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {attachments.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <span className="text-sm truncate max-w-[170px]">{file.name}</span>
                        <button onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700">x</button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-end gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="px-3 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm">
                    Attach
                  </button>
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (!isTicketLocked) sendMessage()
                      }
                    }}
                    placeholder={isTicketLocked ? 'This ticket is closed. Reopen to reply.' : 'Type a response...'}
                    rows={2}
                    disabled={isTicketLocked}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base disabled:opacity-70"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isTicketLocked || sending || (!newMessage.trim() && attachments.length === 0)}
                    className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
                {!isNearBottom() ? (
                  <div className="mt-2 flex justify-end">
                    <button type="button" onClick={() => scrollToBottom('smooth')} className="px-3 py-1.5 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      Jump to latest
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Select a ticket to start" description="Pick a conversation from the list to view and reply." icon="dashboard" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

