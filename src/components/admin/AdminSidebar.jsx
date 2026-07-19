import { useState, useEffect } from 'react'
import ThemeToggle from '../ThemeToggle'
import NotificationBell from '../notifications/NotificationBell'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import api from '../../utils/axios'
import { getImageUrl } from '../../utils/imageUrl.js'

export default function AdminSidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, onLogout, onChangePassword }) {
  const { settings: siteSettings } = useSiteSettings()
  const [currentUser, setCurrentUser] = useState(null)
  const isSubAdmin = currentUser?.role === 'subadmin'

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me')
      if (response.data.success) {
        setCurrentUser(response.data.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const menuItems = isSubAdmin
    ? [
        { id: 'users', label: 'Users' }
      ]
    : [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'users', label: 'Users' },
        { id: 'coins', label: 'Coins' },
        { id: 'deposits', label: 'Deposit Log' },
        { id: 'withdrawals', label: 'Withdrawal Log' },
        { id: 'transfers', label: 'Transfer Log' },
        { id: 'buy-transactions', label: 'Buy Transactions' },
        { id: 'balance-logs', label: 'Balance Logs' },
        { id: 'kyc', label: 'KYC Management' },
        { id: 'kyc-settings', label: 'KYC Settings' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'telegram', label: 'Telegram' },
        { id: 'chat', label: 'Customer Service' },
        { id: 'notify-users', label: 'Notify Users' },
        { id: 'subadmins', label: 'Sub-Admins' },
        { id: 'site-settings', label: 'Site Settings' }
      ]

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    setSidebarOpen(false)
  }

  const handleLoginAsUser = async () => {
    if (!currentUser) {
      alert('User information not available')
      return
    }

    const adminEmail = currentUser.email
    const adminName = currentUser.fullName || adminEmail

    if (!window.confirm(`Are you sure you want to login as a user account? We will use your admin email (${adminEmail}) to find or create a user account. You will be logged out of your current admin session.`)) {
      return
    }

    try {
      console.log('[Admin Sidebar] Login As User: Starting login process')
      console.log('[Admin Sidebar] Login As User: Admin email:', adminEmail)
      console.log('[Admin Sidebar] Login As User: Admin name:', adminName)

      // Call backend to find or create user account with admin's email
      const response = await api.post('/api/admin/login-as-user-by-email', {
        email: adminEmail
      })

      if (response.data.success && response.data.token) {
        console.log('[Admin Sidebar] Login As User: Got response from server')
        console.log('[Admin Sidebar] Login As User: Response user:', response.data.user)
        console.log('[Admin Sidebar] Login As User: Response user email:', response.data.user.email)
        console.log('[Admin Sidebar] Login As User: Response user ID:', response.data.user.id)

        // IMPORTANT: Clear ALL storage first to remove admin session
        localStorage.clear()
        sessionStorage.clear()
        
        // CRITICAL: Also clear all cookies to remove old admin token
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })

        // Store ONLY the new user token
        localStorage.setItem('token', response.data.token)

        // Verify token is stored
        const storedToken = localStorage.getItem('token')
        console.log('[Admin Sidebar] Login As User: Token stored:', storedToken ? 'YES' : 'NO')

        // Decode token to verify it's for the correct user
        try {
          const tokenParts = storedToken.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            console.log('[Admin Sidebar] Login As User: Decoded token userId:', payload.userId)
            console.log('[Admin Sidebar] Login As User: Decoded token role:', payload.role)
            console.log('[Admin Sidebar] Login As User: Expected user ID:', response.data.user.id)

            if (payload.userId !== response.data.user.id) {
              console.error('[Admin Sidebar] Login As User: CRITICAL ERROR - Token userId does not match!')
              alert('ERROR: Token mismatch. Please try again.')
              return
            }
          }
        } catch (decodeError) {
          console.error('[Admin Sidebar] Login As User: Error decoding token:', decodeError)
        }

        console.log('[Admin Sidebar] Login As User: All checks passed. Redirecting to /dashboard...')

        // Force immediate redirect
        window.location.replace('/dashboard')
      } else {
        console.error('[Admin Sidebar] Login As User: Failed - no token in response')
        alert('Failed to get user token. Please try again.')
      }
    } catch (error) {
      console.error('[Admin Sidebar] Login As User: Error:', error)
      console.error('[Admin Sidebar] Login As User: Error response:', error.response?.data)
      alert(error.response?.data?.message || 'Failed to login as user. Please try again.')
    }
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 flex items-center justify-between gap-2 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-base font-extrabold tracking-tight text-[#0b1426] dark:text-white truncate">
            {siteSettings.site.name || 'Onchainforexai'}{' '}
            <span className="text-[#1199fa]">Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-16 lg:pt-0">
          {/* Brand header */}
          <div className="hidden lg:block relative overflow-hidden bg-gradient-to-br from-[#0b1426] via-[#0f2744] to-[#1199fa] p-5 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(255,255,255,0.12),transparent_50%)]" />
            <div className="relative flex items-center gap-3">
              {siteSettings.site.logo ? (
                <img
                  src={getImageUrl(siteSettings.site.logo)}
                  alt={siteSettings.site.name}
                  className="w-10 h-10 rounded-xl object-contain bg-white/10 border border-white/15"
                />
              ) : (
                <div className="w-10 h-10 bg-white/15 border border-white/15 rounded-xl flex items-center justify-center">
                  <span className="text-white font-extrabold text-lg">
                    {(siteSettings.site.name || 'X').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-base font-extrabold tracking-tight truncate">
                  {siteSettings.site.name || 'Onchainforexai'}
                </p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/60 font-semibold">Admin panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            <p className="px-3 mb-1.5 mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Menu
            </p>
            {menuItems.map((item) => {
              const isActive = activeTab === item.id
              const isSupport = item.id === 'chat'
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#1199fa]/12 text-[#0b7dd4] dark:text-sky-300 border border-[#1199fa]/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {isSupport && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-[#1199fa]' : 'bg-emerald-400'}`} />
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}

            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleLoginAsUser}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-900/40"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Login as User
              </button>
            </div>
          </nav>

          {/* Footer actions */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
            {onChangePassword && (
              <button
                type="button"
                onClick={onChangePassword}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-[#1199fa] to-[#0b7dd4] hover:brightness-110 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-[2px] z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}

