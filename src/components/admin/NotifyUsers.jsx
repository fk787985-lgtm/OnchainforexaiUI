import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'

export default function NotifyUsers() {
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [sendPush, setSendPush] = useState(true)
  const [playSound, setPlaySound] = useState(true)
  const [notificationType, setNotificationType] = useState('info')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users')
      if (response.data.success) {
        setUsers(response.data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    }
  }

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    const filteredUserIds = filteredUsers.map(u => u._id)
    if (selectedUsers.length === filteredUserIds.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUserIds)
    }
  }

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in title and message')
      return
    }

    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/admin/notifications/send', {
        userIds: selectedUsers,
        title: title.trim(),
        message: message.trim(),
        sendEmail,
        sendPush,
        playSound,
        notificationType
      })

      if (response.data.success) {
        toast.success(`Notification sent to ${response.data.results.length} user(s)`)
        setTitle('')
        setMessage('')
        setSelectedUsers([])
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error(error.response?.data?.message || 'Failed to send notification')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.uniqueId?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Send Notification</h2>
        
        {/* Notification Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Notification Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white"
              placeholder="Enter notification title"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white resize-none"
              placeholder="Enter notification message"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Notification Type
              </label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="space-y-3 pt-8">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="sendEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Send Email Notification
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="sendPush"
                  checked={sendPush}
                  onChange={(e) => setSendPush(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="sendPush" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Send Push Notification
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="playSound"
                  checked={playSound}
                  onChange={(e) => setPlaySound(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="playSound" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Play Sound Notification
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* User Selection */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Users ({selectedUsers.length} selected)
            </h3>
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition text-sm"
            >
              {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white"
              placeholder="Search users by name, email, or ID..."
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <label
                  key={user._id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserToggle(user._id)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {user.fullName || user.username || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email} {user.uniqueId && `• ID: ${user.uniqueId}`}
                    </div>
                  </div>
                </label>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No users found
              </div>
            )}
          </div>
        </div>

        {/* Send Button */}
        <div className="mt-6">
          <button
            onClick={handleSend}
            disabled={loading || !title.trim() || !message.trim() || selectedUsers.length === 0}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? 'Sending...' : `Send Notification to ${selectedUsers.length} User(s)`}
          </button>
        </div>
      </div>
    </div>
  )
}

