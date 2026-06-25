import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import PageHeader from '../ui/PageHeader'
import EmptyState from '../ui/EmptyState'
import SkeletonBlock from '../common/SkeletonBlock'
import AdminStatusBadge from './AdminStatusBadge'

export default function TransferLogList() {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransfers()
  }, [])

  const fetchTransfers = async () => {
    try {
      const response = await api.get('/api/admin/transfers')
      if (response.data.success) {
        setTransfers(response.data.transfers)
      }
    } catch (error) {
      console.error('Error fetching transfers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <PageHeader title="Transfer History" description="Review internal transfer activity and settlement status." />
      <div className="fx-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          {transfers.length === 0 ? (
            <EmptyState title="No transfer logs yet" description="Transfers will appear here after users send funds internally." icon="transfer" />
          ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">From</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {transfers.map((transfer) => (
                <tr key={transfer._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium">{transfer.fromUserInfo?.fullName || transfer.fromUserId?.fullName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{transfer.fromUserInfo?.email || transfer.fromUserId?.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium">{transfer.toUserInfo?.fullName || transfer.toUserId?.fullName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{transfer.toUserInfo?.email || transfer.toUserId?.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">{transfer.amount} USDT</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{transfer.fee} USDT</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <AdminStatusBadge status={transfer.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {new Date(transfer.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {transfers.length === 0 ? (
            <div className="p-4">
              <EmptyState title="No transfer logs yet" description="Transfers will appear here after users send funds internally." icon="transfer" />
            </div>
          ) : (
            transfers.map((transfer) => (
              <div key={transfer._id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{transfer.amount} USDT</p>
                  <AdminStatusBadge status={transfer.status} />
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">From</p>
                    <p className="text-slate-900 dark:text-slate-100">{transfer.fromUserInfo?.fullName || transfer.fromUserId?.fullName}</p>
                    <p className="text-slate-500 dark:text-slate-400 truncate">{transfer.fromUserInfo?.email || transfer.fromUserId?.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">To</p>
                    <p className="text-slate-900 dark:text-slate-100">{transfer.toUserInfo?.fullName || transfer.toUserId?.fullName}</p>
                    <p className="text-slate-500 dark:text-slate-400 truncate">{transfer.toUserInfo?.email || transfer.toUserId?.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Fee: {transfer.fee} USDT</span>
                  <span>{new Date(transfer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}





