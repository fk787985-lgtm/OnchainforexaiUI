import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'

const PERMISSION_FIELDS = [
  { key: 'can_view_users', label: 'View users' },
  { key: 'can_edit_users', label: 'Edit users' },
  { key: 'can_create_users', label: 'Add / create customers' },
  { key: 'can_add_balance', label: 'Add balance to users' },
  { key: 'can_activate_user', label: 'Activate users' },
  { key: 'can_deactivate_user', label: 'Deactivate users' },
  { key: 'can_notify_users', label: 'Notify users' },
  { key: 'can_customer_service', label: 'Customer service' },
  { key: 'can_manage_trade_access', label: 'Allow/Block user trading' },
  { key: 'can_manage_coin_address', label: 'Manage user coin addresses' }
]

const DEFAULT_PERMISSIONS = {
  can_view_users: true,
  can_edit_users: false,
  can_create_users: false,
  can_add_balance: false,
  can_activate_user: false,
  can_deactivate_user: false,
  can_notify_users: false,
  can_customer_service: false,
  can_manage_trade_access: false,
  can_manage_coin_address: false
}

function SubAdminManagement() {
  const [subAdmins, setSubAdmins] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null)
  const [users, setUsers] = useState([])
  const [assignedUsers, setAssignedUsers] = useState([])
  const [assignSearch, setAssignSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [permissionTarget, setPermissionTarget] = useState(null)
  const [permissionsForm, setPermissionsForm] = useState(DEFAULT_PERMISSIONS)
  const [showTelegramModal, setShowTelegramModal] = useState(false)
  const [telegramTarget, setTelegramTarget] = useState(null)
  const [telegramForm, setTelegramForm] = useState({
    botToken: '',
    chatId: '',
    enabled: true,
    botTokenMasked: '',
    hasToken: false,
    discoveredChats: []
  })
  const [telegramSaving, setTelegramSaving] = useState(false)
  
  // Create form state
  const [createForm, setCreateForm] = useState({
    fullName: '',
    nickname: '',
    email: '',
    phone: '',
    permissions: DEFAULT_PERMISSIONS
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ fullName: '', nickname: '' })
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    fetchSubAdmins()
    fetchUsers()
  }, [])

  const fetchSubAdmins = async () => {
    try {
      const response = await api.get('/api/admin/subadmins')
      if (response.data.success) {
        setSubAdmins(response.data.subAdmins || [])
      }
    } catch (error) {
      console.error('Error fetching sub-admins:', error)
      toast.error('Failed to fetch sub-admins')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users')
      if (response.data.success) {
        // Admin users API already excludes admin/subadmin; keep all returned customers
        const list = response.data.users || []
        setUsers(list.filter((u) => !u.role || u.role === 'user'))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreate = async () => {
    if (!createForm.fullName || !createForm.email || !createForm.phone) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/admin/subadmins', createForm)
      if (response.data.success) {
        toast.success(`Sub-admin created! Password: ${response.data.password}`)
        setShowCreateModal(false)
        setCreateForm({
          fullName: '',
          nickname: '',
          email: '',
          phone: '',
          permissions: DEFAULT_PERMISSIONS
        })
        fetchSubAdmins()
      }
    } catch (error) {
      console.error('Error creating sub-admin:', error)
      toast.error(error.response?.data?.message || 'Failed to create sub-admin')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (subAdmin) => {
    setEditTarget(subAdmin)
    setEditForm({
      fullName: subAdmin.fullName || '',
      nickname: subAdmin.nickname || ''
    })
    setShowEditModal(true)
  }

  const handleSaveProfile = async () => {
    if (!editTarget) return
    if (!editForm.fullName.trim()) {
      toast.error('Full name is required')
      return
    }
    setEditSaving(true)
    try {
      const response = await api.put(`/api/admin/subadmins/${editTarget._id}/profile`, {
        fullName: editForm.fullName.trim(),
        nickname: editForm.nickname.trim()
      })
      if (response.data.success) {
        toast.success('Sub-admin profile updated')
        setShowEditModal(false)
        setEditTarget(null)
        fetchSubAdmins()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setEditSaving(false)
    }
  }

  const handleToggleStatus = async (subAdmin) => {
    try {
      const response = await api.put(`/api/admin/subadmins/${subAdmin._id}/status`, {
        isSubAdminActive: !subAdmin.isSubAdminActive
      })
      if (response.data.success) {
        toast.success(response.data.message)
        fetchSubAdmins()
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (subAdminId) => {
    if (!window.confirm('Are you sure you want to delete this sub-admin?')) {
      return
    }

    try {
      const response = await api.delete(`/api/admin/subadmins/${subAdminId}`)
      if (response.data.success) {
        toast.success('Sub-admin deleted successfully')
        fetchSubAdmins()
      }
    } catch (error) {
      console.error('Error deleting sub-admin:', error)
      toast.error('Failed to delete sub-admin')
    }
  }

  const handleOpenAssign = async (subAdmin) => {
    setSelectedSubAdmin(subAdmin)
    setAssignedUsers(
      (subAdmin.subAdminAssignedUsers || []).map((u) => String(u?._id || u))
    )
    setAssignSearch('')
    setShowAssignModal(true)
  }

  const filteredAssignUsers = users.filter((user) => {
    const q = assignSearch.trim().toLowerCase()
    if (!q) return true
    const fields = [
      user.fullName,
      user.email,
      user.username,
      user.uniqueId,
      user.payid,
      user._id
    ]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase())
    return fields.some((f) => f.includes(q))
  })

  const handleLoginAsSubAdmin = async (subAdmin) => {
    if (!window.confirm(`Login as ${subAdmin.fullName || subAdmin.email}? You will be switched from admin session to sub-admin session.`)) {
      return
    }

    try {
      const response = await api.post(`/api/admin/subadmins/${subAdmin._id}/login-as`)
      if (!response.data.success || !response.data.token) {
        toast.error(response.data?.message || 'Failed to login as sub-admin')
        return
      }

      localStorage.clear()
      sessionStorage.clear()
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
      })

      localStorage.setItem('token', response.data.token)
      window.location.replace('/subadmin/dashboard')
    } catch (error) {
      console.error('Error logging in as sub-admin:', error)
      toast.error(error.response?.data?.message || 'Failed to login as sub-admin')
    }
  }

  const openPermissionsModal = (subAdmin) => {
    setPermissionTarget(subAdmin)
    setPermissionsForm({
      ...DEFAULT_PERMISSIONS,
      ...(subAdmin.subAdminPermissions || {})
    })
    setShowPermissionsModal(true)
  }

  const openTelegramModal = async (subAdmin) => {
    setTelegramTarget(subAdmin)
    setTelegramForm({
      botToken: '',
      chatId: '',
      enabled: true,
      botTokenMasked: '',
      hasToken: false,
      discoveredChats: []
    })
    setShowTelegramModal(true)
    try {
      const { data } = await api.get(`/api/admin/subadmins/${subAdmin._id}/telegram`)
      if (data.success) {
        setTelegramForm({
          botToken: '',
          chatId: data.telegram?.chatId || '',
          enabled: data.telegram?.enabled !== false,
          botTokenMasked: data.telegram?.botTokenMasked || '',
          hasToken: Boolean(data.telegram?.hasToken),
          discoveredChats: []
        })
      }
    } catch {
      toast.error('Failed to load sub-admin Telegram settings')
    }
  }

  const saveTelegram = async () => {
    if (!telegramTarget) return
    setTelegramSaving(true)
    try {
      const payload = {
        chatId: telegramForm.chatId,
        enabled: telegramForm.enabled
      }
      if (telegramForm.botToken && !telegramForm.botToken.includes('***')) {
        payload.botToken = telegramForm.botToken.trim()
      }
      const { data } = await api.put(
        `/api/admin/subadmins/${telegramTarget._id}/telegram`,
        payload
      )
      if (data.success) {
        toast.success('Sub-admin Telegram saved')
        setShowTelegramModal(false)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed')
    } finally {
      setTelegramSaving(false)
    }
  }

  const buildTelegramBody = () => {
    const body = {
      chatId: String(telegramForm.chatId || '').trim()
    }
    const typedToken = String(telegramForm.botToken || '').trim()
    if (
      typedToken &&
      !typedToken.includes('***') &&
      !typedToken.includes('•')
    ) {
      body.botToken = typedToken
    }
    return body
  }

  const testTelegram = async () => {
    if (!telegramTarget) return
    try {
      const body = buildTelegramBody()
      if (!body.botToken && !telegramForm.hasToken) {
        toast.error('Paste the bot token from @BotFather first, then Test or Save.')
        return
      }
      if (!body.chatId) {
        toast.error('Enter the Chat ID, or click Detect chats after messaging the bot.')
        return
      }
      const { data } = await api.post(
        `/api/admin/subadmins/${telegramTarget._id}/telegram/test`,
        body
      )
      if (data.success) {
        toast.success(data.message || 'Test OK')
        if (data.chatId) {
          setTelegramForm((f) => ({ ...f, chatId: String(data.chatId) }))
        }
      } else toast.error(data.message || 'Failed')
    } catch (error) {
      const payload = error.response?.data
      const recent = payload?.recentChats || []
      const msg = payload?.message || 'Test failed'
      toast.error(msg.length > 180 ? `${msg.slice(0, 180)}…` : msg, { duration: 8000 })
      if (recent.length) {
        setTelegramForm((f) => ({
          ...f,
          discoveredChats: recent
        }))
      }
    }
  }

  const discoverTelegramChats = async () => {
    if (!telegramTarget) return
    try {
      const body = buildTelegramBody()
      if (!body.botToken && !telegramForm.hasToken) {
        toast.error('Paste the bot token first.')
        return
      }
      const { data } = await api.post(
        `/api/admin/subadmins/${telegramTarget._id}/telegram/discover-chats`,
        body
      )
      if (data.success) {
        const chats = data.chats || []
        setTelegramForm((f) => ({ ...f, discoveredChats: chats }))
        if (chats.length === 1) {
          setTelegramForm((f) => ({
            ...f,
            chatId: String(chats[0].chatId),
            discoveredChats: chats
          }))
          toast.success(`Found chat ${chats[0].chatId} — click Test or Save`)
        } else if (chats.length > 1) {
          toast.success(data.message || `Found ${chats.length} chats — pick one below`)
        } else {
          toast.error(
            data.message ||
              `No messages yet. Open @${data.bot?.username || 'your-bot'} in Telegram, tap Start, send hi, then Detect again.`,
            { duration: 7000 }
          )
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Detect failed')
    }
  }

  const handleUpdatePermissions = async () => {
    if (!permissionTarget) return
    setLoading(true)
    try {
      const response = await api.put(`/api/admin/subadmins/${permissionTarget._id}/permissions`, {
        permissions: permissionsForm
      })
      if (response.data.success) {
        toast.success('Permissions updated successfully')
        setShowPermissionsModal(false)
        setPermissionTarget(null)
        fetchSubAdmins()
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast.error(error.response?.data?.message || 'Failed to update permissions')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignUsers = async () => {
    if (!selectedSubAdmin) return

    setLoading(true)
    try {
      const response = await api.post(`/api/admin/subadmins/${selectedSubAdmin._id}/assign-users`, {
        userIds: assignedUsers
      })
      if (response.data.success) {
        toast.success(response.data.message)
        setShowAssignModal(false)
        fetchSubAdmins()
      }
    } catch (error) {
      console.error('Error assigning users:', error)
      toast.error('Failed to assign users')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sub-Admin Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-xl"
        >
          + Create Sub-Admin
        </button>
      </div>

      {/* Sub-Admins List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Assigned Users</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Permissions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {subAdmins.length > 0 ? (
                subAdmins.map((subAdmin) => (
                  <tr key={subAdmin._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{subAdmin.fullName}</div>
                      {subAdmin.nickname ? (
                        <div className="text-xs text-indigo-600 dark:text-indigo-400">
                          Nick: {subAdmin.nickname}
                        </div>
                      ) : null}
                      <div className="text-xs text-gray-500 dark:text-gray-400">ID: {subAdmin.uniqueId}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{subAdmin.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {subAdmin.subAdminAssignedUsers?.length || 0} user(s)
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {PERMISSION_FIELDS.filter(
                          (permission) => ({ ...DEFAULT_PERMISSIONS, ...(subAdmin.subAdminPermissions || {}) })[permission.key]
                        ).length > 0 ? (
                          PERMISSION_FIELDS.filter(
                            (permission) => ({ ...DEFAULT_PERMISSIONS, ...(subAdmin.subAdminPermissions || {}) })[permission.key]
                          ).map((permission) => (
                            <span
                              key={`${subAdmin._id}-${permission.key}`}
                              className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                            >
                              {permission.label}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            No permissions
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        subAdmin.isSubAdminActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}>
                        {subAdmin.isSubAdminActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(subAdmin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => openEditModal(subAdmin)}
                        className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleOpenAssign(subAdmin)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                      >
                        Assign Users
                      </button>
                      <button
                        onClick={() => handleLoginAsSubAdmin(subAdmin)}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium"
                      >
                        Login As
                      </button>
                      <button
                        onClick={() => openPermissionsModal(subAdmin)}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                      >
                        Permissions
                      </button>
                      <button
                        onClick={() => openTelegramModal(subAdmin)}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium"
                      >
                        Telegram
                      </button>
                      <button
                        onClick={() => handleToggleStatus(subAdmin)}
                        className={`font-medium ${
                          subAdmin.isSubAdminActive
                            ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-800'
                            : 'text-green-600 dark:text-green-400 hover:text-green-800'
                        }`}
                      >
                        {subAdmin.isSubAdminActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Reset password for this sub-admin? A new password will be generated and sent via email.')) {
                            return
                          }
                          try {
                            const response = await api.post(`/api/admin/subadmins/${subAdmin._id}/reset-password`)
                            if (response.data.success) {
                              toast.success(`Password reset! New password: ${response.data.password}`)
                            }
                          } catch (error) {
                            console.error('Error resetting password:', error)
                            toast.error('Failed to reset password')
                          }
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDelete(subAdmin._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No sub-admins found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-cyan-500 to-indigo-600">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Create Sub-Admin</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/90 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nickname (customer service display)
                </label>
                <input
                  type="text"
                  value={createForm.nickname}
                  onChange={(e) => setCreateForm({ ...createForm, nickname: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  placeholder="Shown to customers in chat"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone *</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Permissions</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PERMISSION_FIELDS.map((permission) => (
                    <label key={permission.key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={!!createForm.permissions?.[permission.key]}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            permissions: {
                              ...(prev.permissions || DEFAULT_PERMISSIONS),
                              [permission.key]: e.target.checked
                            }
                          }))
                        }
                      />
                      {permission.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit name + nickname (customer service display) */}
      {showEditModal && editTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-cyan-500 to-indigo-600">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Edit Sub-Admin</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditTarget(null)
                  }}
                  className="text-white/90 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">{editTarget.email}</p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nickname (shown in customer service)
                </label>
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  placeholder="e.g. Support Alex"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Customers see this name on support chat messages.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditTarget(null)
                  }}
                  className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={editSaving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {editSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && permissionTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-cyan-500 to-indigo-600">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  Permissions for {permissionTarget.fullName}
                </h3>
                <button
                  onClick={() => {
                    setShowPermissionsModal(false)
                    setPermissionTarget(null)
                  }}
                  className="text-white/90 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {PERMISSION_FIELDS.map((permission) => (
                <label key={permission.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-800 dark:text-gray-200">{permission.label}</span>
                  <input
                    type="checkbox"
                    checked={!!permissionsForm[permission.key]}
                    onChange={(e) => setPermissionsForm((prev) => ({ ...prev, [permission.key]: e.target.checked }))}
                  />
                </label>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPermissionsModal(false)
                    setPermissionTarget(null)
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePermissions}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-admin Telegram Bot Modal */}
      {showTelegramModal && telegramTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Telegram Bot - {telegramTarget.fullName}
            </h3>
            <p className="text-xs text-slate-500">
              This bot only receives alerts for customers assigned to this sub-admin. Token is encrypted.
            </p>
            <div>
              <label className="fx-label">TELEGRAM_BOT_TOKEN</label>
              <input
                className="fx-input font-mono text-sm"
                type="password"
                value={telegramForm.botToken}
                onChange={(e) => setTelegramForm({ ...telegramForm, botToken: e.target.value })}
                placeholder={
                  telegramForm.hasToken
                    ? telegramForm.botTokenMasked || 'Token saved - enter new to replace'
                    : 'Bot token from @BotFather'
                }
              />
            </div>
            <div>
              <label className="fx-label">Chat ID</label>
              <input
                className="fx-input font-mono text-sm"
                value={telegramForm.chatId}
                onChange={(e) => setTelegramForm({ ...telegramForm, chatId: e.target.value })}
                placeholder="e.g. 123456789 or -1001234567890"
              />
              <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                <b>Important:</b> /start must be on <b>this</b> bot (the token above), not a different
                bot. Userinfobot alone is not enough. Use <b>Detect chats</b> after you message this bot.
              </p>
              {Array.isArray(telegramForm.discoveredChats) &&
                telegramForm.discoveredChats.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Chats that messaged this bot — click to use:
                    </p>
                    {telegramForm.discoveredChats.map((c) => (
                      <button
                        key={c.chatId}
                        type="button"
                        onClick={() =>
                          setTelegramForm((f) => ({ ...f, chatId: String(c.chatId) }))
                        }
                        className="w-full text-left text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-500 bg-slate-50 dark:bg-slate-800"
                      >
                        <span className="font-mono font-semibold">{c.chatId}</span>
                        <span className="text-slate-500 ml-2">
                          {[c.type, c.firstName || c.title, c.username && `@${c.username}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        {c.lastText ? (
                          <span className="block text-slate-400 truncate mt-0.5">“{c.lastText}”</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={telegramForm.enabled}
                onChange={(e) => setTelegramForm({ ...telegramForm, enabled: e.target.checked })}
              />
              Notifications enabled
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowTelegramModal(false)}
                className="flex-1 min-w-[4.5rem] px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={discoverTelegramChats}
                className="flex-1 min-w-[5.5rem] px-3 py-2 rounded-xl border border-cyan-500/50 text-cyan-700 dark:text-cyan-300 text-sm font-semibold"
              >
                Detect chats
              </button>
              <button
                type="button"
                onClick={testTelegram}
                className="flex-1 min-w-[4.5rem] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm"
              >
                Test
              </button>
              <button
                type="button"
                disabled={telegramSaving}
                onClick={saveTelegram}
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white disabled:opacity-50"
              >
                {telegramSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Users Modal */}
      {showAssignModal && selectedSubAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-cyan-500 to-indigo-600">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  Assign Users to {selectedSubAdmin.fullName}
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-white/90 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
              <div className="sticky top-0 z-[1] bg-white dark:bg-slate-900 pb-2">
                <div className="relative">
                  <input
                    type="search"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    placeholder="Search customer by name, email, ID…"
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <svg
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Showing {filteredAssignUsers.length} of {users.length} · Selected{' '}
                  {assignedUsers.length}
                </p>
              </div>
              <div className="space-y-2 max-h-96">
                {filteredAssignUsers.length > 0 ? (
                  filteredAssignUsers.map((user) => {
                    const id = String(user._id)
                    const checked = assignedUsers.map(String).includes(id)
                    return (
                      <label
                        key={id}
                        className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer border transition ${
                          checked
                            ? 'border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30 dark:border-indigo-700'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedUsers([...assignedUsers.map(String), id])
                            } else {
                              setAssignedUsers(assignedUsers.map(String).filter((x) => x !== id))
                            }
                          }}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {user.fullName || user.username || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {user.email}
                            {user.uniqueId ? ` · ${user.uniqueId}` : ''}
                          </div>
                        </div>
                      </label>
                    )
                  })
                ) : (
                  <p className="text-center text-sm text-slate-500 py-8">
                    {assignSearch ? 'No customers match your search' : 'No customers available'}
                  </p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignUsers}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : `Assign ${assignedUsers.length} User(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubAdminManagement

