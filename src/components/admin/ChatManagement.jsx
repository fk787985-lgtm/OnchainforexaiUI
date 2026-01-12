import { useState, useEffect, useRef } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import { API_URL } from '../../utils/apiUrl.js'

export default function ChatManagement() {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: ''
  })
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const [pollingInterval, setPollingInterval] = useState(null)

  useEffect(() => {
    fetchStats()
    // Clear selected ticket when filters change
    if (selectedTicket) {
      setSelectedTicket(null)
      setMessages([])
    }
    fetchTickets()
    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [filters.status, filters.priority, filters.assignedTo])

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket._id)
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedTicket._id, true)
      }, 3000)
      setPollingInterval(interval)
      return () => clearInterval(interval)
    }
  }, [selectedTicket])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
        // Clear selected ticket if it's not in the filtered results
        if (selectedTicket) {
          const ticketStillExists = response.data.tickets.some(
            t => t._id === selectedTicket._id
          )
          if (!ticketStillExists) {
            setSelectedTicket(null)
            setMessages([])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load tickets')
    }
  }

  const fetchMessages = async (ticketId, silent = false) => {
    try {
      const response = await api.get(`/api/chat/admin/tickets/${ticketId}/messages`)
      if (response.data.success) {
        setMessages(response.data.messages)
        setSelectedTicket(response.data.ticket)
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
        setMessages([...messages, response.data.message])
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

  const formatDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString()
  }

  const formatMessageTime = (date) => {
    const d = new Date(date)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    
    const timeStr = d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    if (messageDate.getTime() === today.getTime()) {
      return `Today at ${timeStr}`
    } else if (messageDate.getTime() === today.getTime() - 86400000) {
      return `Yesterday at ${timeStr}`
    } else {
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeStr}`
    }
  }

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true
    const currentDate = new Date(currentMsg.createdAt).toDateString()
    const prevDate = new Date(prevMsg.createdAt).toDateString()
    return currentDate !== prevDate
  }

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Customer Service Chat</h2>
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Open</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Resolved</div>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Unread</div>
              <div className="text-2xl font-bold text-red-600">{stats.unreadMessages}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</h3>
            {(filters.status || filters.priority || filters.assignedTo) && (
              <button
                onClick={() => {
                  setFilters({ status: '', priority: '', assignedTo: '' })
                  setSelectedTicket(null)
                  setMessages([])
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value })
                  setSelectedTicket(null)
                  setMessages([])
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => {
                  setFilters({ ...filters, priority: e.target.value })
                  setSelectedTicket(null)
                  setMessages([])
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Assigned To</label>
              <select
                value={filters.assignedTo}
                onChange={(e) => {
                  setFilters({ ...filters, assignedTo: e.target.value })
                  setSelectedTicket(null)
                  setMessages([])
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">All</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-300px)]">
        {/* Tickets List */}
        <div className="w-full lg:w-96 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Tickets ({tickets.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No tickets found</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 rounded-lg border transition ${
                    selectedTicket?._id === ticket._id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm truncate">{ticket.subject}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {ticket.user?.fullName || ticket.user?.email || 'Unknown User'}
                      </p>
                    </div>
                    {ticket.unreadCount > 0 && (
                      <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {ticket.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs mt-2">
                    <span className={`px-2 py-0.5 rounded ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatDate(ticket.lastMessageAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
          {selectedTicket && tickets.length > 0 ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="font-semibold">{selectedTicket.subject}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedTicket.user?.fullName || selectedTicket.user?.email || 'Unknown User'}
                      {selectedTicket.user?.uniqueId && ` (${selectedTicket.user.uniqueId})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateTicket({ status: e.target.value })}
                    className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => updateTicket({ priority: e.target.value })}
                    className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <button
                    onClick={closeTicket}
                    disabled={selectedTicket.status === 'closed' || selectedTicket.status === 'archived'}
                    className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Close ticket"
                  >
                    Close
                  </button>
                  <button
                    onClick={archiveTicket}
                    disabled={selectedTicket.status === 'archived'}
                    className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Archive ticket"
                  >
                    Archive
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                {messages.map((message, index) => {
                  const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1])
                  return (
                    <div key={message._id}>
                      {showDateSeparator && (
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {new Date(message.createdAt).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className={`flex items-end gap-2 mb-3 ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        {message.senderType === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {message.sender?.fullName?.charAt(0)?.toUpperCase() || message.sender?.email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm ${
                          message.senderType === 'admin'
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-gray-600'
                        }`}>
                          {message.senderType === 'user' && (
                            <p className="text-xs font-semibold mb-1 opacity-90">
                              {message.sender?.fullName || message.sender?.email || 'User'}
                            </p>
                          )}
                          {message.senderType === 'admin' && (
                            <p className="text-xs font-semibold mb-1 text-indigo-100">
                              {message.sender?.fullName || 'Support Team'} (Admin)
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment, idx) => (
                                <a
                                  key={idx}
                                  href={`${API_URL}${attachment.path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`block text-sm flex items-center space-x-2 p-2 rounded-lg transition ${
                                    message.senderType === 'admin'
                                      ? 'bg-indigo-700 hover:bg-indigo-800 text-white'
                                      : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-white'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                  <span className="truncate">{attachment.filename}</span>
                                </a>
                              ))}
                            </div>
                          )}
                          <p className={`text-xs mt-2 ${message.senderType === 'admin' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                        {message.senderType === 'admin' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {message.sender?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800"
                      >
                        <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end space-x-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition flex-shrink-0"
                    title="Attach file"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder="Type your message..."
                      rows={1}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 resize-none focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition text-sm"
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                    className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl flex-shrink-0"
                    title="Send message"
                  >
                    {sending ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : tickets.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold">No tickets found</p>
                <p className="text-sm mt-2">No support tickets match your current filters</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold">Select a ticket to view messages</p>
                <p className="text-sm mt-2">Choose a ticket from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

