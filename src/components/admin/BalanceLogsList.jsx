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
      <div className="fx-card p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-3"></div>
        <p className="text-slate-600 dark:text-slate-300">Loading balance logs...</p>
      </div>
    )
  }

  return (
    <div className="fx-card overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg sm:text-xl font-bold">Balance Logs</h2>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Subadmin/Admin</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
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
                <td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No balance logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div key={log._id} className="p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Subadmin/Admin</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{log.adminId?.fullName || 'Unknown'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{log.adminId?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">User</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{log.userId?.fullName || 'Unknown user'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{log.userId?.email || 'N/A'}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">+{Number(log.amount || 0).toFixed(2)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No balance logs found.
          </div>
        )}
      </div>
    </div>
  )
}
