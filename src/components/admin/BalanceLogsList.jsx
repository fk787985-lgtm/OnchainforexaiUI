import { useEffect, useMemo, useState } from 'react'
import api from '../../utils/axios'

function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(amount || 0))
}

export default function BalanceLogsList() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all') // all | admin | subadmin
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return (logs || []).filter((log) => {
      const adminRole = String(log.adminId?.role || log.metadata?.performedByRole || '').toLowerCase()
      if (roleFilter === 'admin' && adminRole === 'subadmin') return false
      if (roleFilter === 'subadmin' && adminRole !== 'subadmin') return false

      if (dateFrom) {
        const from = new Date(dateFrom)
        from.setHours(0, 0, 0, 0)
        if (new Date(log.createdAt) < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        if (new Date(log.createdAt) > to) return false
      }

      if (!q) return true
      const hay = [
        log.adminId?.fullName,
        log.adminId?.email,
        log.userId?.fullName,
        log.userId?.email,
        log.userId?.uniqueId,
        log.description,
        log.amount
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [logs, searchQuery, roleFilter, dateFrom, dateTo])

  if (loading) {
    return (
      <div className="fx-card p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-3" />
        <p className="text-slate-600 dark:text-slate-300">Loading balance logs...</p>
      </div>
    )
  }

  return (
    <div className="fx-card overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Balance Logs</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredLogs.length} of {logs.length} entries
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, admin, email, ID…"
              className="fx-input w-full pl-10 pr-3 py-2.5"
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
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="fx-input w-full py-2.5"
          >
            <option value="all">All performers</option>
            <option value="admin">Admin only</option>
            <option value="subadmin">Sub-admin only</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="fx-input w-full py-2.5"
            title="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="fx-input w-full py-2.5"
            title="To date"
          />
        </div>

        {(searchQuery || roleFilter !== 'all' || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setRoleFilter('all')
              setDateFrom('')
              setDateTo('')
            }}
            className="text-xs font-semibold text-cyan-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                Subadmin/Admin
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {log.adminId?.fullName || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {log.adminId?.email || 'N/A'}
                      {log.adminId?.role ? ` · ${log.adminId.role}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {log.userId?.fullName || 'Unknown user'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {log.userId?.email || 'N/A'}
                      {log.userId?.uniqueId ? ` · ${log.userId.uniqueId}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                    +{formatMoney(log.amount).replace('$', '')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  No balance logs match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div key={log._id} className="p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Subadmin/Admin</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {log.adminId?.fullName || 'Unknown'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {log.adminId?.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">User</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {log.userId?.fullName || 'Unknown user'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {log.userId?.email || 'N/A'}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  +{Number(log.amount || 0).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No balance logs match your filters.
          </div>
        )}
      </div>
    </div>
  )
}
