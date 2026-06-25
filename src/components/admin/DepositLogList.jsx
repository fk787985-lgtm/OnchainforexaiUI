import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import { getImageUrl } from '../../utils/imageUrl.js'
import PageHeader from '../ui/PageHeader'
import EmptyState from '../ui/EmptyState'
import SkeletonBlock from '../common/SkeletonBlock'
import AdminStatusBadge from './AdminStatusBadge'

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
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <SkeletonBlock className="h-8 w-44" />
        <SkeletonBlock className="h-10 w-full rounded-xl" />
        <SkeletonBlock className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <PageHeader title="Deposit Log" description="Track user deposit requests, proof, and review actions." />
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>
      <div className="fx-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          {deposits.length === 0 ? (
            <EmptyState title="No deposits found" description="Deposits will appear here once users submit funding requests." icon="transfer" />
          ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {deposits.map((deposit) => (
                <tr 
                  key={deposit._id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={() => setSelectedDeposit(deposit)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{deposit.userId?.fullName || deposit.userId?.email}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{deposit.userId?.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">+{deposit.amount} USDT</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <AdminStatusBadge status={deposit.status || 'completed'} />
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
                      className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded text-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {deposits.length === 0 ? (
            <div className="p-4">
              <EmptyState title="No deposits found" description="Deposits will appear here once users submit funding requests." icon="transfer" />
            </div>
          ) : (
            deposits.map((deposit) => (
              <div key={deposit._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {deposit.userId?.fullName || deposit.userId?.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{deposit.userId?.email}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">+{deposit.amount} USDT</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <AdminStatusBadge status={deposit.status || 'completed'} />
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">
                    {deposit.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{deposit.description || 'Deposit'}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(deposit.createdAt).toLocaleDateString()}</p>
                  <button
                    onClick={() => setSelectedDeposit(deposit)}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white rounded text-xs"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedDeposit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-cyan-500 to-indigo-600">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Deposit Details</h3>
                <button
                  onClick={() => setSelectedDeposit(null)}
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
                  <AdminStatusBadge status={selectedDeposit.status || 'completed'} />
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
                className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
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



