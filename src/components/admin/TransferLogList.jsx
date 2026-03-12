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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          {transfers.length === 0 ? (
            <EmptyState title="No transfer logs yet" description="Transfers will appear here after users send funds internally." icon="transfer" />
          ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">From</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transfers.map((transfer) => (
                <tr key={transfer._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium">{transfer.fromUserInfo?.fullName || transfer.fromUserId?.fullName}</div>
                    <div className="text-xs text-gray-500">{transfer.fromUserInfo?.email || transfer.fromUserId?.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium">{transfer.toUserInfo?.fullName || transfer.toUserId?.fullName}</div>
                    <div className="text-xs text-gray-500">{transfer.toUserInfo?.email || transfer.toUserId?.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">{transfer.amount} USDT</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{transfer.fee} USDT</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <AdminStatusBadge status={transfer.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transfer.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  )
}





