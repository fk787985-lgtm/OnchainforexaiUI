import { useEffect, useState } from 'react'
import api from '../../utils/axios'

export default function BalanceLogsList() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/api/admin/balance-logs')
        if (response.data.success) {
          setLogs(response.data.logs || [])
        }
      } catch (error) {
        console.error('Failed to fetch balance logs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-300">Loading balance logs...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg sm:text-xl font-bold">Balance Logs</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subadmin/Admin</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">{log.adminId?.fullName || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{log.adminId?.email || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">{log.userId?.fullName || 'Unknown user'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{log.userId?.email || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                    +{Number(log.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No balance logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
