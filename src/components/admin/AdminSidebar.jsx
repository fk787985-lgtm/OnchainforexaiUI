import { useState, useEffect } from 'react'
import ThemeToggle from '../ThemeToggle'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import api from '../../utils/axios'
import { API_URL } from '../../utils/apiUrl.js'

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
        { id: 'kyc', label: 'KYC Log' },
        { id: 'kyc-settings', label: 'KYC Settings' },
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
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {siteSettings.site.name || 'XCrypto'} Admin
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full pt-16 lg:pt-0">
          {/* Logo - Desktop */}
          <div className="hidden lg:block p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {siteSettings.site.logo ? (
                <img
                  src={siteSettings.site.logo?.startsWith('http') ? siteSettings.site.logo : `${API_URL}${siteSettings.site.logo}`}
                  alt={siteSettings.site.name}
                  className="w-10 h-10 rounded-xl object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {siteSettings.site.name.charAt(0).toUpperCase() || 'X'}
                  </span>
                </div>
              )}
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {siteSettings.site.name || 'XCrypto'} Admin
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activeTab === item.id
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {/* Login as User Button */}
            <button
              onClick={handleLoginAsUser}
              className="w-full text-left px-4 py-3 rounded-lg transition text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 flex items-center space-x-2"
            >
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium text-green-700 dark:text-green-400">Login as User</span>
            </button>
          </nav>

          {/* Change Password & Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {onChangePassword && (
              <button
                onClick={onChangePassword}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>Change Password</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay - Mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  )
}

