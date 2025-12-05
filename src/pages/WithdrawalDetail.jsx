import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'

export default function WithdrawalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [withdrawal, setWithdrawal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    fetchWithdrawal()
    
    // Set up interval to check status every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchWithdrawal()
    }, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [id])

  const fetchWithdrawal = async () => {
    try {
      const response = await api.get(`/api/withdrawals/${id}`)
      if (response.data.success) {
        setWithdrawal(response.data.withdrawal)
        setLoading(false)
        
        // If status is completed or rejected, stop checking
        if (response.data.withdrawal.status === 'completed' || 
            response.data.withdrawal.status === 'rejected' ||
            response.data.withdrawal.status === 'cancelled') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
      }
    } catch (error) {
      console.error('Error fetching withdrawal:', error)
      toast.error('Failed to load withdrawal details')
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this withdrawal? Your balance will be refunded.')) {
      return
    }

    setCancelling(true)
    try {
      const response = await api.post(`/api/withdrawals/${id}/cancel`)
      if (response.data.success) {
        toast.success('Withdrawal cancelled successfully. Your balance has been refunded.')
        fetchWithdrawal()
        // Stop status checking
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch (error) {
      console.error('Error cancelling withdrawal:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel withdrawal')
    } finally {
      setCancelling(false)
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'approved':
        return (
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'completed':
        return (
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'rejected':
      case 'cancelled':
        return (
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading withdrawal details...</p>
        </div>
      </div>
    )
  }

  if (!withdrawal) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Withdrawal not found</p>
          <button
            onClick={() => navigate('/asset')}
            className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
          >
            Back to Assets
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4 flex items-center space-x-4">
          <button
            onClick={() => navigate('/asset')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Withdrawal Details</h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-4 rounded-full ${getStatusColor(withdrawal.status)}`}>
              {getStatusIcon(withdrawal.status)}
            </div>
          </div>
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {withdrawal.status === 'pending' && 'Withdrawal Pending'}
              {withdrawal.status === 'approved' && 'Withdrawal Approved'}
              {withdrawal.status === 'completed' && 'Withdrawal Completed'}
              {withdrawal.status === 'rejected' && 'Withdrawal Rejected'}
              {withdrawal.status === 'cancelled' && 'Withdrawal Cancelled'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {withdrawal.status === 'pending' && 'Your withdrawal request is being reviewed by our team.'}
              {withdrawal.status === 'approved' && 'Your withdrawal has been approved and is being processed.'}
              {withdrawal.status === 'completed' && 'Your withdrawal has been completed successfully.'}
              {withdrawal.status === 'rejected' && 'Your withdrawal request was rejected. Please contact support for more information.'}
              {withdrawal.status === 'cancelled' && 'You cancelled this withdrawal request.'}
            </p>
          </div>
          <div className="text-center">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(withdrawal.status)}`}>
              {withdrawal.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Withdrawal Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Amount</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {withdrawal.amount} {withdrawal.coinSymbol}
              </span>
            </div>
            {withdrawal.metadata?.fee > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Fee</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {withdrawal.metadata.fee} USDT
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Total Deducted</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {withdrawal.metadata?.totalAmount || withdrawal.amount} USDT
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Wallet Address</span>
              <span className="font-mono text-sm text-gray-900 dark:text-white break-all text-right ml-4">
                {withdrawal.walletAddress}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Network</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {withdrawal.network || 'Onchain'}
              </span>
            </div>
            {withdrawal.transactionHash && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Transaction Hash</span>
                <span className="font-mono text-sm text-gray-900 dark:text-white break-all text-right ml-4">
                  {withdrawal.transactionHash}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Requested At</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {new Date(withdrawal.createdAt).toLocaleString()}
              </span>
            </div>
            {withdrawal.approvedAt && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Approved At</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(withdrawal.approvedAt).toLocaleString()}
                </span>
              </div>
            )}
            {withdrawal.completedAt && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Completed At</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(withdrawal.completedAt).toLocaleString()}
                </span>
              </div>
            )}
            {withdrawal.adminNotes && (
              <div className="pt-2">
                <span className="text-gray-600 dark:text-gray-400 block mb-2">Transaction Notes</span>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {withdrawal.adminNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {withdrawal.status === 'pending' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-4">
              Your withdrawal is pending approval. You can cancel it if needed, and your balance will be refunded.
            </p>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Withdrawal'}
            </button>
          </div>
        )}

        {/* Auto-refresh indicator */}
        {withdrawal.status === 'pending' || withdrawal.status === 'approved' ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
              <span>Checking status updates...</span>
            </div>
          </div>
        ) : null}

        {/* Back Button */}
        <button
          onClick={() => navigate('/asset')}
          className="w-full mt-6 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition"
        >
          Back to Assets
        </button>
      </main>
    </div>
  )
}

