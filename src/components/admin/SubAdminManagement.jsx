import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'

export default function SubAdminManagement() {
  const [subAdmins, setSubAdmins] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null)
  const [users, setUsers] = useState([])
  const [assignedUsers, setAssignedUsers] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Create form state
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: ''
  })

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
        setUsers(response.data.users?.filter(u => u.role === 'user') || [])
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
        setCreateForm({ fullName: '', email: '', phone: '' })
        fetchSubAdmins()
      }
    } catch (error) {
      console.error('Error creating sub-admin:', error)
      toast.error(error.response?.data?.message || 'Failed to create sub-admin')
    } finally {
      setLoading(false)
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
    setAssignedUsers(subAdmin.subAdminAssignedUsers?.map(u => u._id) || [])
    setShowAssignModal(true)
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
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-xl"
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
                      <div className="text-xs text-gray-500 dark:text-gray-400">ID: {subAdmin.uniqueId}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{subAdmin.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {subAdmin.subAdminAssignedUsers?.length || 0} user(s)
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
                        onClick={() => handleOpenAssign(subAdmin)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                      >
                        Assign Users
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
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Sub-Admin</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Users Modal */}
      {showAssignModal && selectedSubAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Assign Users to {selectedSubAdmin.fullName}
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-2 max-h-96">
                {users.map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={assignedUsers.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedUsers([...assignedUsers, user._id])
                        } else {
                          setAssignedUsers(assignedUsers.filter(id => id !== user._id))
                        }
                      }}
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
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignUsers}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition disabled:opacity-50"
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

