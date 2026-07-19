import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Badge from '../components/ui/Badge'

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
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [depositsDateFilter, setDepositsDateFilter] = useState('all')
  const [depositsStartDate, setDepositsStartDate] = useState('')
  const [depositsEndDate, setDepositsEndDate] = useState('')
  const [depositsSearchQuery, setDepositsSearchQuery] = useState('')
  
  const [withdrawalsDateFilter, setWithdrawalsDateFilter] = useState('all')
  const [withdrawalsStartDate, setWithdrawalsStartDate] = useState('')
  const [withdrawalsEndDate, setWithdrawalsEndDate] = useState('')
  const [withdrawalsSearchQuery, setWithdrawalsSearchQuery] = useState('')
  
  const [transfersDateFilter, setTransfersDateFilter] = useState('all')
  const [transfersStartDate, setTransfersStartDate] = useState('')
  const [transfersEndDate, setTransfersEndDate] = useState('')
  const [transfersSearchQuery, setTransfersSearchQuery] = useState('')

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
      <div className="fx-page flex items-center justify-center">
        <div className="h-11 w-11 rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-[#1199fa] animate-spin" />
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

  const tabs = [
    { id: 'personal', label: 'Overview', path: '/profile' },
    { id: 'deposits', label: 'Deposits', path: '/profile/deposits' },
    { id: 'withdrawals', label: 'Withdrawals', path: '/profile/withdrawals' },
    { id: 'transfers', label: 'Transfers', path: '/profile/transfers' }
  ]

  return (
    <div className="fx-page pb-24">
      <header className="sticky top-0 z-50 bg-[var(--fx-color-surface)]/90 backdrop-blur-xl border-b border-[var(--fx-color-border)]">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight truncate">{getSectionTitle()}</h1>
            <p className="text-xs text-[var(--fx-color-text-muted)]">Account · Wallet · History</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="fx-btn fx-btn-ghost fx-btn-sm !px-3"
          >
            Settings
          </button>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => navigate(t.path)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                activeSection === t.id
                  ? 'bg-[#1199fa] text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {activeSection === 'personal' && (
          <div className="space-y-4">
            {/* Crypto.com-style wallet hero */}
            <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#0b1426] via-[#0f1c33] to-[#1199fa] p-5 sm:p-6 text-white shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl font-extrabold shrink-0">
                    {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white/70 font-medium">Total balance</p>
                    <p className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
                      {Number(user?.balance || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      <span className="text-base font-semibold text-white/80">USDT</span>
                    </p>
                    <p className="text-sm text-white/80 truncate mt-0.5">{user?.fullName || 'Trader'}</p>
                  </div>
                </div>
                {kycStatus?.isVerified ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                    Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-100 border border-amber-300/30">
                    Unverified
                  </span>
                )}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/buy')}
                  className="fx-btn fx-btn-sm !bg-white !text-[#0b1426] !font-bold"
                >
                  Buy crypto
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="fx-btn fx-btn-sm !bg-white/12 !text-white !border !border-white/20"
                >
                  Trade
                </button>
              </div>
            </div>

            <div className="fx-card p-5">
              <h2 className="fx-section-title mb-4">Personal details</h2>
              <dl className="space-y-0 divide-y divide-[var(--fx-color-border)]">
                {[
                  { l: 'Full name', v: user?.fullName || '—' },
                  { l: 'Email', v: user?.email || '—' },
                  { l: 'User ID', v: user?.uniqueId || '—' },
                  { l: 'Phone', v: user?.phone || '—' },
                  {
                    l: 'Email verified',
                    v: user?.isEmailVerified ? 'Yes' : 'No',
                    ok: user?.isEmailVerified
                  }
                ].map((row) => (
                  <div key={row.l} className="flex justify-between gap-3 py-3 text-sm">
                    <dt className="text-[var(--fx-color-text-muted)]">{row.l}</dt>
                    <dd
                      className={`font-semibold text-right break-all ${
                        row.ok === true
                          ? 'text-emerald-600'
                          : row.ok === false
                            ? 'text-red-500'
                            : ''
                      }`}
                    >
                      {row.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="fx-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <h2 className="fx-section-title">Identity verification</h2>
                  <p className="text-xs text-[var(--fx-color-text-muted)] mt-1">
                    Complete KYC to unlock higher limits
                  </p>
                </div>
                {kycStatus?.isVerified ? (
                  <Badge label="Verified" status="verified" />
                ) : kycStatus?.kyc?.status === 'pending' || kycStatus?.kyc?.status === 'under_review' ? (
                  <Badge label="Under review" status="pending" />
                ) : kycStatus?.kyc?.status === 'rejected' ? (
                  <Badge label="Rejected" status="rejected" />
                ) : null}
              </div>
              {kycStatus?.kyc?.rejectionReason && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-sm text-red-600 dark:text-red-300">
                  {kycStatus.kyc.rejectionReason}
                </div>
              )}
              {!kycStatus?.isVerified && (
                <button
                  type="button"
                  onClick={() => navigate('/kyc/verify')}
                  className="fx-btn fx-btn-primary fx-btn-block mt-4"
                >
                  {kycStatus?.kyc?.status === 'rejected' ? 'Resubmit KYC' : 'Verify identity'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { l: 'Deposits', p: '/profile/deposits', c: 'from-emerald-500 to-teal-600' },
                { l: 'Withdraw', p: '/profile/withdrawals', c: 'from-rose-500 to-red-600' },
                { l: 'Transfers', p: '/profile/transfers', c: 'from-blue-500 to-indigo-600' }
              ].map((x) => (
                <button
                  key={x.l}
                  type="button"
                  onClick={() => navigate(x.p)}
                  className={`rounded-2xl bg-gradient-to-br ${x.c} text-white p-3 text-center shadow-md active:scale-[0.98] transition`}
                >
                  <p className="text-xs font-bold">{x.l}</p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="fx-btn fx-btn-secondary fx-btn-block"
            >
              Open settings
            </button>
          </div>
        )}

        {activeSection === 'deposits' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                {/* Search */}
                <div className="w-full">
                  <input
                    type="text"
                    placeholder="Search deposits..."
                    value={depositsSearchQuery}
                    onChange={(e) => setDepositsSearchQuery(e.target.value)}
                    className="fx-input"
                  />
                </div>
                
                {/* Date Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Today', value: 'today' },
                    { label: 'Week', value: 'week' },
                    { label: 'Month', value: 'month' },
                    { label: 'Custom', value: 'custom' }
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setDepositsDateFilter(filter.value)
                        if (filter.value !== 'custom') {
                          setDepositsStartDate('')
                          setDepositsEndDate('')
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                        depositsDateFilter === filter.value
                          ? 'bg-[#1199fa] text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range */}
                {depositsDateFilter === 'custom' && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={depositsStartDate}
                        onChange={(e) => setDepositsStartDate(e.target.value)}
                        className="fx-input"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={depositsEndDate}
                        onChange={(e) => setDepositsEndDate(e.target.value)}
                        className="fx-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filtered Deposits List */}
            {(() => {
              let filteredDeposits = deposits

              // Apply search filter
              if (depositsSearchQuery) {
                filteredDeposits = filteredDeposits.filter(d => 
                  d.description?.toLowerCase().includes(depositsSearchQuery.toLowerCase()) ||
                  d.amount?.toString().includes(depositsSearchQuery) ||
                  d.type?.toLowerCase().includes(depositsSearchQuery.toLowerCase())
                )
              }

              // Apply date filter
              if (depositsDateFilter === 'today') {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                filteredDeposits = filteredDeposits.filter(d => {
                  const depositDate = new Date(d.createdAt)
                  depositDate.setHours(0, 0, 0, 0)
                  return depositDate.getTime() === today.getTime()
                })
              } else if (depositsDateFilter === 'week') {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                filteredDeposits = filteredDeposits.filter(d => new Date(d.createdAt) >= weekAgo)
              } else if (depositsDateFilter === 'month') {
                const monthAgo = new Date()
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                filteredDeposits = filteredDeposits.filter(d => new Date(d.createdAt) >= monthAgo)
              } else if (depositsDateFilter === 'custom' && depositsStartDate && depositsEndDate) {
                const start = new Date(depositsStartDate)
                const end = new Date(depositsEndDate)
                end.setHours(23, 59, 59, 999)
                filteredDeposits = filteredDeposits.filter(d => {
                  const depositDate = new Date(d.createdAt)
                  return depositDate >= start && depositDate <= end
                })
              }

              return filteredDeposits.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
                    Showing {filteredDeposits.length} of {deposits.length} deposits
                  </div>
                  {filteredDeposits.map((deposit) => (
                    <div 
                      key={deposit._id} 
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5 cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all duration-200 hover:border-cyan-300 dark:hover:border-cyan-700"
                      onClick={() => setSelectedDeposit(deposit)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-1">
                              <span className="text-cyan-600 dark:text-cyan-400">+{deposit.amount}</span> USDT
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                              {deposit.description?.replace('Admin added balance', 'Deposit').replace('by admin', '') || 'Deposit'}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          {deposit.status && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              deposit.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                              deposit.status === 'approved' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                              deposit.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                              'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            }`}>
                              {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                            </span>
                          )}
                            <span className="inline-block px-3 py-1.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-md text-xs font-semibold whitespace-nowrap">
                            {deposit.type === 'admin_add' ? 'Deposit' : deposit.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(deposit.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(deposit.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-10 sm:p-12">
                  <div className="text-center">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">No deposits found</p>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {activeSection === 'withdrawals' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                {/* Search */}
                <div className="w-full">
                  <input
                    type="text"
                    placeholder="Search withdrawals..."
                    value={withdrawalsSearchQuery}
                    onChange={(e) => setWithdrawalsSearchQuery(e.target.value)}
                    className="fx-input"
                  />
                </div>
                
                {/* Date Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Today', value: 'today' },
                    { label: 'Week', value: 'week' },
                    { label: 'Month', value: 'month' },
                    { label: 'Custom', value: 'custom' }
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setWithdrawalsDateFilter(filter.value)
                        if (filter.value !== 'custom') {
                          setWithdrawalsStartDate('')
                          setWithdrawalsEndDate('')
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                        withdrawalsDateFilter === filter.value
                          ? 'bg-[#1199fa] text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range */}
                {withdrawalsDateFilter === 'custom' && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={withdrawalsStartDate}
                        onChange={(e) => setWithdrawalsStartDate(e.target.value)}
                        className="fx-input"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={withdrawalsEndDate}
                        onChange={(e) => setWithdrawalsEndDate(e.target.value)}
                        className="fx-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filtered Withdrawals List */}
            {(() => {
              let filteredWithdrawals = withdrawals

              // Apply search filter
              if (withdrawalsSearchQuery) {
                filteredWithdrawals = filteredWithdrawals.filter(w => 
                  w.walletAddress?.toLowerCase().includes(withdrawalsSearchQuery.toLowerCase()) ||
                  w.amount?.toString().includes(withdrawalsSearchQuery) ||
                  w.status?.toLowerCase().includes(withdrawalsSearchQuery.toLowerCase()) ||
                  w.coinSymbol?.toLowerCase().includes(withdrawalsSearchQuery.toLowerCase())
                )
              }

              // Apply date filter
              if (withdrawalsDateFilter === 'today') {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                filteredWithdrawals = filteredWithdrawals.filter(w => {
                  const withdrawalDate = new Date(w.createdAt)
                  withdrawalDate.setHours(0, 0, 0, 0)
                  return withdrawalDate.getTime() === today.getTime()
                })
              } else if (withdrawalsDateFilter === 'week') {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                filteredWithdrawals = filteredWithdrawals.filter(w => new Date(w.createdAt) >= weekAgo)
              } else if (withdrawalsDateFilter === 'month') {
                const monthAgo = new Date()
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                filteredWithdrawals = filteredWithdrawals.filter(w => new Date(w.createdAt) >= monthAgo)
              } else if (withdrawalsDateFilter === 'custom' && withdrawalsStartDate && withdrawalsEndDate) {
                const start = new Date(withdrawalsStartDate)
                const end = new Date(withdrawalsEndDate)
                end.setHours(23, 59, 59, 999)
                filteredWithdrawals = filteredWithdrawals.filter(w => {
                  const withdrawalDate = new Date(w.createdAt)
                  return withdrawalDate >= start && withdrawalDate <= end
                })
              }

              return filteredWithdrawals.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
                    Showing {filteredWithdrawals.length} of {withdrawals.length} withdrawals
                  </div>
                  {filteredWithdrawals.map((withdrawal) => (
                    <div 
                      key={withdrawal._id} 
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5 cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all duration-200 hover:border-cyan-300 dark:hover:border-cyan-700"
                      onClick={() => setSelectedWithdrawal(withdrawal)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-1">
                              <span className="text-cyan-600 dark:text-cyan-400">-{withdrawal.amount}</span> {withdrawal.coinSymbol}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-mono truncate">
                              {withdrawal.walletAddress?.substring(0, 20)}...
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-block px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                            withdrawal.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            withdrawal.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            withdrawal.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                          }`}>
                            {withdrawal.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(withdrawal.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(withdrawal.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-10 sm:p-12">
                  <div className="text-center">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">No withdrawals found</p>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {activeSection === 'transfers' && (
          <div className="space-y-4 min-h-[calc(100vh-8rem)]">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex flex-col gap-3">
                {/* Search */}
                <div className="w-full">
                  <input
                    type="text"
                    placeholder="Search transfers..."
                    value={transfersSearchQuery}
                    onChange={(e) => setTransfersSearchQuery(e.target.value)}
                    className="fx-input"
                  />
                </div>
                
                {/* Date Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Today', value: 'today' },
                    { label: 'Week', value: 'week' },
                    { label: 'Month', value: 'month' },
                    { label: 'Custom', value: 'custom' }
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setTransfersDateFilter(filter.value)
                        if (filter.value !== 'custom') {
                          setTransfersStartDate('')
                          setTransfersEndDate('')
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                        transfersDateFilter === filter.value
                          ? 'bg-[#1199fa] text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range */}
                {transfersDateFilter === 'custom' && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={transfersStartDate}
                        onChange={(e) => setTransfersStartDate(e.target.value)}
                        className="fx-input"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={transfersEndDate}
                        onChange={(e) => setTransfersEndDate(e.target.value)}
                        className="fx-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filtered Transfers List */}
            {(() => {
              let filteredTransfers = transfers

              // Apply search filter
              if (transfersSearchQuery) {
                filteredTransfers = filteredTransfers.filter(t => {
                  const isSent = t.fromUserId === user?._id || t.fromUserInfo?.email === user?.email
                  const otherUser = isSent 
                    ? (t.receiverId?.fullName || t.receiverId?.email || t.receiverInfo?.fullName || t.receiverInfo?.email || '')
                    : (t.senderId?.fullName || t.senderId?.email || t.senderInfo?.fullName || t.senderInfo?.email || '')
                  return (
                    otherUser.toLowerCase().includes(transfersSearchQuery.toLowerCase()) ||
                    t.amount?.toString().includes(transfersSearchQuery) ||
                    t.status?.toLowerCase().includes(transfersSearchQuery.toLowerCase())
                  )
                })
              }

              // Apply date filter
              if (transfersDateFilter === 'today') {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                filteredTransfers = filteredTransfers.filter(t => {
                  const transferDate = new Date(t.createdAt)
                  transferDate.setHours(0, 0, 0, 0)
                  return transferDate.getTime() === today.getTime()
                })
              } else if (transfersDateFilter === 'week') {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                filteredTransfers = filteredTransfers.filter(t => new Date(t.createdAt) >= weekAgo)
              } else if (transfersDateFilter === 'month') {
                const monthAgo = new Date()
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                filteredTransfers = filteredTransfers.filter(t => new Date(t.createdAt) >= monthAgo)
              } else if (transfersDateFilter === 'custom' && transfersStartDate && transfersEndDate) {
                const start = new Date(transfersStartDate)
                const end = new Date(transfersEndDate)
                end.setHours(23, 59, 59, 999)
                filteredTransfers = filteredTransfers.filter(t => {
                  const transferDate = new Date(t.createdAt)
                  return transferDate >= start && transferDate <= end
                })
              }

              return filteredTransfers.length > 0 ? (
                <div className="space-y-4 min-h-[600px]">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2 font-medium">
                    Showing {filteredTransfers.length} of {transfers.length} transfers
                  </div>
                  {filteredTransfers.map((transfer) => {
                    const isSent = transfer.fromUserId === user?._id || transfer.fromUserInfo?.email === user?.email
                    return (
                      <div 
                        key={transfer._id} 
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-cyan-300 dark:hover:border-cyan-700"
                        onClick={() => setSelectedTransfer(transfer)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isSent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
                            }`}>
                              <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${isSent ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-1">
                                <span className={isSent ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                                  {isSent ? '-' : '+'}{transfer.amount}
                                </span> USDT
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                {isSent 
                                  ? `To: ${transfer.receiverId?.fullName || transfer.receiverId?.email || transfer.receiverInfo?.fullName || transfer.receiverInfo?.email || 'N/A'}`
                                  : `From: ${transfer.senderId?.fullName || transfer.senderId?.email || transfer.senderInfo?.fullName || transfer.senderInfo?.email || 'N/A'}`
                                }
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`inline-block px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                              transfer.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                            }`}>
                              {transfer.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                          <div className="flex items-center space-x-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{new Date(transfer.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{new Date(transfer.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-16 sm:p-20 shadow-sm min-h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-400 dark:text-gray-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-300 font-semibold text-base sm:text-lg mb-2">No transfers found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or search criteria</p>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </main>

      {/* Deposit Detail Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-[#0b1426] to-[#1199fa]">
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
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedDeposit.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                    selectedDeposit.status === 'approved' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                    selectedDeposit.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                    'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  }`}>
                    {selectedDeposit.status ? (selectedDeposit.status.charAt(0).toUpperCase() + selectedDeposit.status.slice(1)) : 'Completed'}
                  </span>
                </div>
              </div>
              {selectedDeposit.adminNotes && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Admin Notes</div>
                  <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">{selectedDeposit.adminNotes}</div>
                </div>
              )}
              {selectedDeposit.screenshot && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Screenshot</div>
                  <img
                    src={selectedDeposit.screenshot.startsWith('http') ? selectedDeposit.screenshot : `${window.location.origin}${selectedDeposit.screenshot}`}
                    alt="Deposit screenshot"
                    className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created At</div>
                <div className="text-sm text-gray-900 dark:text-white">{new Date(selectedDeposit.createdAt).toLocaleString()}</div>
              </div>
              <button
                onClick={() => setSelectedDeposit(null)}
                className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Detail Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-[#0b1426] to-[#1199fa]">
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
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction Notes</div>
                  <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">{selectedWithdrawal.adminNotes}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created At</div>
                <div className="text-sm text-gray-900 dark:text-white">{new Date(selectedWithdrawal.createdAt).toLocaleString()}</div>
              </div>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Detail Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-[#0b1426] to-[#1199fa]">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Transfer Details</h3>
                <button
                  onClick={() => setSelectedTransfer(null)}
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
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</div>
                <div className={`font-semibold text-lg ${
                  (selectedTransfer.fromUserId === user?._id || selectedTransfer.fromUserInfo?.email === user?.email)
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {(selectedTransfer.fromUserId === user?._id || selectedTransfer.fromUserInfo?.email === user?.email) ? '-' : '+'}{selectedTransfer.amount} USDT
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transfer Type</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {(selectedTransfer.fromUserId === user?._id || selectedTransfer.fromUserInfo?.email === user?.email) ? 'Sent' : 'Received'}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">From</div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {(() => {
                    const fromUserInfo = selectedTransfer.fromUserInfo || {}
                    const senderName = fromUserInfo.fullName || fromUserInfo.name || 'N/A'
                    const senderEmail = fromUserInfo.email || 'N/A'
                    const senderUniqueId = fromUserInfo.uniqueId || null
                    
                    return (
                      <>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {senderName}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {senderEmail}
                        </div>
                        {senderUniqueId && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            ID: {senderUniqueId}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">To</div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {(() => {
                    const toUserInfo = selectedTransfer.toUserInfo || {}
                    const receiverName = toUserInfo.fullName || toUserInfo.name || 'N/A'
                    const receiverEmail = toUserInfo.email || 'N/A'
                    const receiverUniqueId = toUserInfo.uniqueId || null
                    
                    return (
                      <>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {receiverName}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {receiverEmail}
                        </div>
                        {receiverUniqueId && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            ID: {receiverUniqueId}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
                <div>
                  <span className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                    selectedTransfer.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    selectedTransfer.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    selectedTransfer.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                  }`}>
                    {selectedTransfer.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transfer Fee</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedTransfer.fee !== undefined && selectedTransfer.fee !== null 
                    ? `${selectedTransfer.fee} USDT`
                    : `${(selectedTransfer.amount * 0.02).toFixed(2)} USDT (2%)`
                  }
                </div>
              </div>

              {selectedTransfer.transactionHash && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction Hash</div>
                  <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                    {selectedTransfer.transactionHash}
                  </div>
                </div>
              )}

              {selectedTransfer.transactionId && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction ID</div>
                  <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                    {selectedTransfer.transactionId}
                  </div>
                </div>
              )}

              {selectedTransfer.note && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Note</div>
                  <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    {selectedTransfer.note}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date & Time</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {new Date(selectedTransfer.createdAt).toLocaleString()}
                </div>
              </div>

              {selectedTransfer.updatedAt && selectedTransfer.updatedAt !== selectedTransfer.createdAt && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Updated</div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedTransfer.updatedAt).toLocaleString()}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedTransfer(null)}
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

