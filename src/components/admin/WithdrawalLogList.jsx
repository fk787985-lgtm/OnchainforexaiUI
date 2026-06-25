import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import PageHeader from '../ui/PageHeader'
import EmptyState from '../ui/EmptyState'
import SkeletonBlock from '../common/SkeletonBlock'
import AdminStatusBadge from './AdminStatusBadge'

export default function WithdrawalLogList() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [transactionHash, setTransactionHash] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchWithdrawals()
  }, [statusFilter])

  const fetchWithdrawals = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/withdrawals'
        : `/api/admin/withdrawals?status=${statusFilter}`
      const response = await api.get(url)
      if (response.data.success) {
        setWithdrawals(response.data.withdrawals)
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (withdrawal) => {
    if (!window.confirm(`Approve withdrawal of ${withdrawal.amount} ${withdrawal.coinSymbol}?`)) return

    setProcessing(true)
    try {
      const response = await api.post(`/api/admin/withdrawals/${withdrawal._id}/approve`, {
        transactionHash: transactionHash || undefined,
        adminNotes: adminNotes || undefined
      })
      if (response.data.success) {
        toast.success('Withdrawal approved successfully')
        setSelectedWithdrawal(null)
        setTransactionHash('')
        setAdminNotes('')
        fetchWithdrawals()
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error)
      toast.error(error.response?.data?.message || 'Failed to approve withdrawal')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (withdrawal) => {
    if (!window.confirm(`Reject withdrawal of ${withdrawal.amount} ${withdrawal.coinSymbol}? User will be refunded.`)) return

    setProcessing(true)
    try {
      const response = await api.post(`/api/admin/withdrawals/${withdrawal._id}/reject`, {
        adminNotes: adminNotes || undefined
      })
      if (response.data.success) {
        toast.success('Withdrawal rejected and user refunded')
        setSelectedWithdrawal(null)
        setAdminNotes('')
        fetchWithdrawals()
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
      toast.error(error.response?.data?.message || 'Failed to reject withdrawal')
    } finally {
      setProcessing(false)
    }
  }

  const handleComplete = async (withdrawal) => {
    if (!window.confirm(`Mark withdrawal as completed?`)) return

    setProcessing(true)
    try {
      const response = await api.post(`/api/admin/withdrawals/${withdrawal._id}/complete`, {
        transactionHash: transactionHash || undefined
      })
      if (response.data.success) {
        toast.success('Withdrawal marked as completed')
        setSelectedWithdrawal(null)
        setTransactionHash('')
        fetchWithdrawals()
      }
    } catch (error) {
      console.error('Error completing withdrawal:', error)
      toast.error(error.response?.data?.message || 'Failed to complete withdrawal')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <SkeletonBlock className="h-8 w-52" />
        <SkeletonBlock className="h-10 w-full rounded-xl" />
        <SkeletonBlock className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <PageHeader title="Withdrawal Log" description="Review and process pending, approved, and completed withdrawals." />
      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'completed', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === status
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="fx-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          {withdrawals.length === 0 ? (
            <EmptyState title="No withdrawals found" description="Pending and completed withdrawal requests will appear here." icon="withdraw" />
          ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Coin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Wallet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {withdrawals.map((withdrawal) => (
                <tr 
                  key={withdrawal._id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={() => {
                    setSelectedWithdrawal(withdrawal)
                    setTransactionHash('')
                    setAdminNotes('')
                  }}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{withdrawal.userId?.fullName || withdrawal.userId?.email}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{withdrawal.userId?.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{withdrawal.amount} {withdrawal.coinSymbol}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{withdrawal.coinSymbol}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => {
                    setSelectedWithdrawal(withdrawal)
                    setTransactionHash('')
                    setAdminNotes('')
                  }}>{withdrawal.walletAddress?.substring(0, 20)}...</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <AdminStatusBadge status={withdrawal.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(withdrawal.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {withdrawal.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal)
                          setTransactionHash('')
                          setAdminNotes('')
                        }}
                        className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded text-xs"
                      >
                        Manage
                      </button>
                    )}
                    {withdrawal.status === 'approved' && (
                      <button
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal)
                          setTransactionHash('')
                        }}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {withdrawals.length === 0 ? (
            <div className="p-4">
              <EmptyState title="No withdrawals found" description="Pending and completed withdrawal requests will appear here." icon="withdraw" />
            </div>
          ) : (
            withdrawals.map((withdrawal) => (
              <div key={withdrawal._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {withdrawal.userId?.fullName || withdrawal.userId?.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{withdrawal.userId?.email}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {withdrawal.amount} {withdrawal.coinSymbol}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <AdminStatusBadge status={withdrawal.status} />
                  <span className="px-2 py-1 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {withdrawal.coinSymbol}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">{withdrawal.walletAddress}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(withdrawal.createdAt).toLocaleDateString()}</p>
                  <button
                    onClick={() => {
                      setSelectedWithdrawal(withdrawal)
                      setTransactionHash('')
                      setAdminNotes('')
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white rounded text-xs"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-cyan-500 to-indigo-600">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Withdrawal Details</h3>
                <button
                  onClick={() => setSelectedWithdrawal(null)}
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
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">User</div>
                <div className="font-semibold text-gray-900 dark:text-white">{selectedWithdrawal.userId?.fullName || selectedWithdrawal.userId?.email}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{selectedWithdrawal.userId?.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</div>
                <div className="font-semibold text-gray-900 dark:text-white">{selectedWithdrawal.amount} {selectedWithdrawal.coinSymbol}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Wallet Address</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">{selectedWithdrawal.walletAddress}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deposit Address (Fake)</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                  {selectedWithdrawal.fakeDepositAddress || `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction ID (Fake)</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                  {selectedWithdrawal.fakeTransactionId || `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
                <div>
                  <AdminStatusBadge status={selectedWithdrawal.status} />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created At</div>
                <div className="text-sm text-gray-900 dark:text-white">{new Date(selectedWithdrawal.createdAt).toLocaleString()}</div>
              </div>
              {selectedWithdrawal.transactionHash && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction Hash</div>
                  <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">{selectedWithdrawal.transactionHash}</div>
                </div>
              )}
              {selectedWithdrawal.adminNotes && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Admin Notes</div>
                  <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">{selectedWithdrawal.adminNotes}</div>
                </div>
              )}
              {selectedWithdrawal.status === 'pending' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Transaction Hash (Optional)</label>
                    <input
                      type="text"
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Enter transaction hash"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Admin Notes (Optional)</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Add notes..."
                      rows="3"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleApprove(selectedWithdrawal)}
                      disabled={processing}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedWithdrawal)}
                      disabled={processing}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
              {selectedWithdrawal.status === 'approved' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Transaction Hash</label>
                    <input
                      type="text"
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Enter transaction hash"
                    />
                  </div>
                  <button
                    onClick={() => handleComplete(selectedWithdrawal)}
                    disabled={processing}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    Mark as Completed
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



