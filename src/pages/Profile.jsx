import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'

export default function Profile() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [kycStatus, setKycStatus] = useState(null)
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDeposit, setSelectedDeposit] = useState(null)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)

  // Determine active section from URL
  const getActiveSection = () => {
    if (location.pathname.includes('/deposits')) return 'deposits'
    if (location.pathname.includes('/withdrawals')) return 'withdrawals'
    if (location.pathname.includes('/transfers')) return 'transfers'
    return 'personal'
  }

  const activeSection = getActiveSection()

  useEffect(() => {
    fetchUserData()
    fetchKYCStatus()
  }, [])

  useEffect(() => {
    if (activeSection === 'deposits') {
      fetchDeposits()
    } else if (activeSection === 'withdrawals') {
      fetchWithdrawals()
    } else if (activeSection === 'transfers') {
      fetchTransfers()
    }
  }, [activeSection])

  const fetchUserData = async () => {
    try {
      const response = await api.get('/api/auth/me')
      if (response.data.success) {
        setUser(response.data.user)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setLoading(false)
    }
  }

  const fetchKYCStatus = async () => {
    try {
      const response = await api.get('/api/kyc/status')
      if (response.data.success) {
        setKycStatus(response.data)
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error)
    }
  }

  const fetchDeposits = async () => {
    try {
      const response = await api.get('/api/deposits/history')
      if (response.data.success) {
        setDeposits(response.data.deposits || [])
      }
    } catch (error) {
      console.error('Error fetching deposits:', error)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      const response = await api.get('/api/withdrawals/history')
      if (response.data.success) {
        setWithdrawals(response.data.withdrawals || [])
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    }
  }

  const fetchTransfers = async () => {
    try {
      const response = await api.get('/api/transfers/history')
      if (response.data.success) {
        setTransfers(response.data.transfers || [])
      }
    } catch (error) {
      console.error('Error fetching transfers:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'deposits': return 'Deposit History'
      case 'withdrawals': return 'Withdrawal History'
      case 'transfers': return 'Transfer History'
      default: return 'Profile'
    }
  }

  const getSectionIcon = () => {
    switch (activeSection) {
      case 'deposits':
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        )
      case 'withdrawals':
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        )
      case 'transfers':
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 py-4 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            {getSectionIcon()}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{getSectionTitle()}</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        {activeSection === 'personal' && (
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user?.fullName || 'N/A'}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">ID: {user?.uniqueId || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Phone</span>
                  <span className="font-semibold">{user?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Balance</span>
                  <span className="font-semibold">{user?.balance?.toFixed(2) || '0.00'} USDT</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Email Verified</span>
                  <span className={`font-semibold ${user?.isEmailVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {user?.isEmailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* KYC Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">KYC Verification</h3>
                {kycStatus?.isVerified ? (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Verified</span>
                  </span>
                ) : kycStatus?.kyc?.status === 'pending' ? (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">
                    Under Review
                  </span>
                ) : kycStatus?.kyc?.status === 'rejected' ? (
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                    Rejected
                  </span>
                ) : (
                  <button
                    onClick={() => navigate('/kyc/verify')}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold"
                  >
                    Verify Now
                  </button>
                )}
              </div>
              {kycStatus?.kyc?.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    <strong>Rejection Reason:</strong> {kycStatus.kyc.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'deposits' && (
          <div className="space-y-4 mt-6">
            {deposits.length > 0 ? (
              deposits.map((deposit) => (
                <div 
                  key={deposit._id} 
                  className="bg-gradient-to-br from-white via-white to-green-50 dark:from-gray-800 dark:via-gray-800 dark:to-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800/30 p-6 cursor-pointer hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:border-green-300 dark:hover:border-green-700/50"
                  onClick={() => setSelectedDeposit(deposit)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-green-600 dark:text-green-400">+{deposit.amount} USDT</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{deposit.description?.replace('Admin added balance', 'Deposit').replace('by admin', '') || 'Deposit'}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{new Date(deposit.createdAt).toLocaleString()}</div>
                    </div>
                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                      {deposit.type === 'admin_add' ? 'Deposit' : deposit.type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">No deposits found</div>
            )}
          </div>
        )}

        {activeSection === 'withdrawals' && (
          <div className="space-y-4 mt-6">
            {withdrawals.length > 0 ? (
              withdrawals.map((withdrawal) => (
                <div 
                  key={withdrawal._id} 
                  className="bg-gradient-to-br from-white via-white to-red-50 dark:from-gray-800 dark:via-gray-800 dark:to-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800/30 p-6 cursor-pointer hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:border-red-300 dark:hover:border-red-700/50"
                  onClick={() => setSelectedWithdrawal(withdrawal)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-red-600 dark:text-red-400">-{withdrawal.amount} {withdrawal.coinSymbol}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">{withdrawal.walletAddress?.substring(0, 20)}...</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{new Date(withdrawal.createdAt).toLocaleString()}</div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      withdrawal.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                      withdrawal.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                      withdrawal.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                    }`}>
                      {withdrawal.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">No withdrawals found</div>
            )}
          </div>
        )}

        {activeSection === 'transfers' && (
          <div className="space-y-3">
            {transfers.length > 0 ? (
              transfers.map((transfer) => {
                const isSent = transfer.fromUserId === user?._id || transfer.fromUserInfo?.email === user?.email
                return (
                  <div key={transfer._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`font-semibold ${isSent ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {isSent ? '-' : '+'}{transfer.amount} USDT
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {isSent 
                            ? `To: ${transfer.receiverId?.fullName || transfer.receiverId?.email || transfer.receiverInfo?.fullName || transfer.receiverInfo?.email || 'N/A'}`
                            : `From: ${transfer.senderId?.fullName || transfer.senderId?.email || transfer.senderInfo?.fullName || transfer.senderInfo?.email || 'N/A'}`
                          }
                        </div>
                        <div className="text-xs text-gray-500">{new Date(transfer.createdAt).toLocaleString()}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        transfer.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}>
                        {transfer.status}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-10 text-gray-500">No transfers found</div>
            )}
          </div>
        )}
      </main>

      {/* Deposit Detail Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</div>
                <div className="font-semibold text-green-600 dark:text-green-400 text-lg">+{selectedDeposit.amount} USDT</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Type</div>
                <div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">
                    {selectedDeposit.type === 'admin_add' ? 'Deposit' : selectedDeposit.type}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</div>
                <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.description?.replace('Admin added balance', 'Deposit').replace('by admin', '') || 'Deposit'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deposit Address</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                  {selectedDeposit.fakeDepositAddress || `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction ID</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                  {selectedDeposit.fakeTransactionId || `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`}
                </div>
              </div>
              {selectedDeposit.balanceBefore !== undefined && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance Before</div>
                  <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.balanceBefore?.toFixed(2) || '0.00'} USDT</div>
                </div>
              )}
              {selectedDeposit.balanceAfter !== undefined && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance After</div>
                  <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.balanceAfter?.toFixed(2) || '0.00'} USDT</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created At</div>
                <div className="text-sm text-gray-900 dark:text-white">{new Date(selectedDeposit.createdAt).toLocaleString()}</div>
              </div>
              <button
                onClick={() => setSelectedDeposit(null)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Detail Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</div>
                <div className="font-semibold text-red-600 dark:text-red-400 text-lg">-{selectedWithdrawal.amount} {selectedWithdrawal.coinSymbol}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedWithdrawal.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                    selectedWithdrawal.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                    selectedWithdrawal.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                  }`}>
                    {selectedWithdrawal.status}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Wallet Address</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">{selectedWithdrawal.walletAddress}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deposit Address</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                  {selectedWithdrawal.fakeDepositAddress || `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction ID</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                  {selectedWithdrawal.fakeTransactionId || selectedWithdrawal.transactionHash || `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`}
                </div>
              </div>
              {selectedWithdrawal.adminNotes && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Admin Notes</div>
                  <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">{selectedWithdrawal.adminNotes}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created At</div>
                <div className="text-sm text-gray-900 dark:text-white">{new Date(selectedWithdrawal.createdAt).toLocaleString()}</div>
              </div>
              <button
                onClick={() => setSelectedWithdrawal(null)}
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

