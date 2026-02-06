import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import { getImageUrl } from '../../utils/imageUrl.js'

export default function DepositLogList() {
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDeposit, setSelectedDeposit] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchDeposits()
  }, [statusFilter])

  const fetchDeposits = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/deposits'
        : `/api/admin/deposits?status=${statusFilter}`
      const response = await api.get(url)
      if (response.data.success) {
        setDeposits(response.data.deposits)
      }
    } catch (error) {
      console.error('Error fetching deposits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (deposit) => {
    if (!window.confirm(`Approve deposit of ${deposit.amount} USDT?`)) return

    setProcessing(true)
    try {
      const response = await api.post(`/api/admin/deposits/${deposit._id}/approve`, {
        adminNotes: adminNotes || undefined
      })
      if (response.data.success) {
        alert('Deposit approved successfully')
        fetchDeposits()
        setSelectedDeposit(null)
        setAdminNotes('')
      }
    } catch (error) {
      console.error('Error approving deposit:', error)
      alert(error.response?.data?.message || 'Failed to approve deposit')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (deposit) => {
    const reason = adminNotes || window.prompt('Enter rejection reason (optional):')
    if (reason === null) return // User cancelled

    if (!window.confirm(`Reject deposit of ${deposit.amount} USDT?`)) return

    setProcessing(true)
    try {
      const response = await api.post(`/api/admin/deposits/${deposit._id}/reject`, {
        adminNotes: reason || undefined
      })
      if (response.data.success) {
        alert('Deposit rejected successfully')
        fetchDeposits()
        setSelectedDeposit(null)
        setAdminNotes('')
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error)
      alert(error.response?.data?.message || 'Failed to reject deposit')
    } finally {
      setProcessing(false)
    }
  }

  const generateFakeAddress = () => {
    return `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
  }

  const generateFakeTxId = () => {
    return `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
      approved: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
      rejected: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
      completed: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
    }
    return badges[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {deposits.map((deposit) => (
                <tr 
                  key={deposit._id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setSelectedDeposit(deposit)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{deposit.userId?.fullName || deposit.userId?.email}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{deposit.userId?.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">+{deposit.amount} USDT</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(deposit.status || 'completed')}`}>
                      {deposit.status || 'completed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">
                      {deposit.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{deposit.description || 'Deposit'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(deposit.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDeposit(deposit)
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Deposit Details</h3>
                <button
                  onClick={() => setSelectedDeposit(null)}
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
                <div className="font-semibold text-gray-900 dark:text-white">{selectedDeposit.userId?.fullName || selectedDeposit.userId?.email}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{selectedDeposit.userId?.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</div>
                <div className="font-semibold text-green-600 dark:text-green-400 text-lg">+{selectedDeposit.amount} USDT</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Type</div>
                <div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">
                    {selectedDeposit.type}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</div>
                <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.description || 'Deposit'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deposit Address (Fake)</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                  {selectedDeposit.fakeDepositAddress || generateFakeAddress()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction ID (Fake)</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                  {selectedDeposit.fakeTransactionId || generateFakeTxId()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance Before</div>
                <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.balanceBefore?.toFixed(2) || '0.00'} USDT</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(selectedDeposit.status || 'completed')}`}>
                    {selectedDeposit.status || 'completed'}
                  </span>
                </div>
              </div>
              {selectedDeposit.screenshot && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Screenshot</div>
                  <img
                    src={getImageUrl(selectedDeposit.screenshot)}
                    alt="Deposit screenshot"
                    className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
              {selectedDeposit.transactionHash && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction Hash</div>
                  <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                    {selectedDeposit.transactionHash}
                  </div>
                </div>
              )}
              {selectedDeposit.walletAddress && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Wallet Address</div>
                  <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                    {selectedDeposit.walletAddress}
                  </div>
                </div>
              )}
              {selectedDeposit.coinAmount && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Coin Amount</div>
                  <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.coinAmount} {selectedDeposit.coinSymbol}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance Before</div>
                <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.balanceBefore?.toFixed(2) || '0.00'} USDT</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance After</div>
                <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.balanceAfter?.toFixed(2) || '0.00'} USDT</div>
              </div>
              {selectedDeposit.adminNotes && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Admin Notes</div>
                  <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">{selectedDeposit.adminNotes}</div>
                </div>
              )}
              {selectedDeposit.approvedBy && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Approved By</div>
                  <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.approvedBy?.fullName || selectedDeposit.approvedBy?.email}</div>
                </div>
              )}
              {selectedDeposit.approvedAt && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Approved At</div>
                  <div className="text-sm text-gray-900 dark:text-white">{new Date(selectedDeposit.approvedAt).toLocaleString()}</div>
                </div>
              )}
              {selectedDeposit.rejectedAt && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rejected At</div>
                  <div className="text-sm text-gray-900 dark:text-white">{new Date(selectedDeposit.rejectedAt).toLocaleString()}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created At</div>
                <div className="text-sm text-gray-900 dark:text-white">{new Date(selectedDeposit.createdAt).toLocaleString()}</div>
              </div>
              {selectedDeposit.status === 'pending' && (
                <>
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
                  onClick={() => handleApprove(selectedDeposit)}
                  disabled={processing || selectedDeposit.status !== 'pending'}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedDeposit)}
                  disabled={processing || selectedDeposit.status !== 'pending'}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  Reject
                </button>
                  </div>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedDeposit(null)
                  setAdminNotes('')
                }}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
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



