import { useState, useEffect } from 'react'
import api from '../../utils/axios'

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
        alert('Withdrawal approved successfully')
        setSelectedWithdrawal(null)
        setTransactionHash('')
        setAdminNotes('')
        fetchWithdrawals()
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error)
      alert(error.response?.data?.message || 'Failed to approve withdrawal')
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
        alert('Withdrawal rejected and user refunded')
        setSelectedWithdrawal(null)
        setAdminNotes('')
        fetchWithdrawals()
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
      alert(error.response?.data?.message || 'Failed to reject withdrawal')
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
        alert('Withdrawal marked as completed')
        setSelectedWithdrawal(null)
        setTransactionHash('')
        fetchWithdrawals()
      }
    } catch (error) {
      console.error('Error completing withdrawal:', error)
      alert(error.response?.data?.message || 'Failed to complete withdrawal')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
      case 'approved': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
      case 'completed': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
      case 'rejected': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
      case 'cancelled': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'completed', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Coin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Wallet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {withdrawals.map((withdrawal) => (
                <tr 
                  key={withdrawal._id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status}
                    </span>
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
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs"
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
        </div>
      </div>

      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Withdrawal Details</h3>
                <button
                  onClick={() => setSelectedWithdrawal(null)}
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedWithdrawal.status)}`}>
                    {selectedWithdrawal.status}
                  </span>
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
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold"
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



