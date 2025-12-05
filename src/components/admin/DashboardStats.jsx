import { useState, useEffect } from 'react'
import api from '../../utils/axios'

export default function DashboardStats() {
  const [stats, setStats] = useState(null)
  const [recentLogins, setRecentLogins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/admin/dashboard')
      if (response.data.success) {
        setStats(response.data.stats)
        setRecentLogins(response.data.recentLogins)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Users</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Verified Users</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2">{stats.verifiedUsers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Unverified Users</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2">{stats.unverifiedUsers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Logins</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2">{stats.totalLogins}</p>
          </div>
        </div>
      )}

      {/* Recent Logins */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold">Recent Logins</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Device</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">IP</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentLogins.length > 0 ? (
                recentLogins.map((login, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-xs sm:text-sm font-medium">{login.userId?.fullName || 'N/A'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{login.userId?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">{login.deviceType}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">{login.city}, {login.country}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono">{login.ip}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">{formatDate(login.loginAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No recent logins
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}





