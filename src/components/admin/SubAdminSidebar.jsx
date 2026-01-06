import { useState, useEffect } from 'react'
import ThemeToggle from '../ThemeToggle'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import api from '../../utils/axios'
import { API_URL } from '../../utils/apiUrl.js'

export default function SubAdminSidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, onLogout, onChangePassword }) {
  const { settings: siteSettings } = useSiteSettings()
  const [currentUser, setCurrentUser] = useState(null)

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

  const handleLoginAsSubAdminUser = async () => {
    if (!currentUser) {
      alert('User information not available')
      return
    }

    const subAdminEmail = currentUser.email
    const subAdminName = currentUser.fullName || subAdminEmail

    if (!window.confirm(`Are you sure you want to login as a user account? We will use your sub-admin email (${subAdminEmail}) to find or create a user account. You will be logged out of your current sub-admin session.`)) {
      return
    }

    try {
      console.log('[SubAdmin Sidebar] Login As User: Starting login process')
      console.log('[SubAdmin Sidebar] Login As User: Sub-admin email:', subAdminEmail)
      console.log('[SubAdmin Sidebar] Login As User: Sub-admin name:', subAdminName)

      // Call backend to find or create user account with sub-admin's email
      const response = await api.post('/api/admin/login-as-user-by-email', {
        email: subAdminEmail
      })

      if (response.data.success && response.data.token) {
        console.log('[SubAdmin Sidebar] Login As User: Got response from server')
        console.log('[SubAdmin Sidebar] Login As User: Response user:', response.data.user)
        console.log('[SubAdmin Sidebar] Login As User: Response user email:', response.data.user.email)
        console.log('[SubAdmin Sidebar] Login As User: Response user ID:', response.data.user.id)

        // IMPORTANT: Clear ALL storage first to remove sub-admin session
        localStorage.clear()
        sessionStorage.clear()
        
        // CRITICAL: Also clear all cookies to remove old sub-admin token
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })

        // Store ONLY the new user token
        localStorage.setItem('token', response.data.token)

        // Verify token is stored
        const storedToken = localStorage.getItem('token')
        console.log('[SubAdmin Sidebar] Login As User: Token stored:', storedToken ? 'YES' : 'NO')

        // Decode token to verify it's for the correct user
        try {
          const tokenParts = storedToken.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            console.log('[SubAdmin Sidebar] Login As User: Decoded token userId:', payload.userId)
            console.log('[SubAdmin Sidebar] Login As User: Decoded token role:', payload.role)
            console.log('[SubAdmin Sidebar] Login As User: Expected user ID:', response.data.user.id)

            if (payload.userId !== response.data.user.id) {
              console.error('[SubAdmin Sidebar] Login As User: CRITICAL ERROR - Token userId does not match!')
              alert('ERROR: Token mismatch. Please try again.')
              return
            }
          }
        } catch (decodeError) {
          console.error('[SubAdmin Sidebar] Login As User: Error decoding token:', decodeError)
        }

        console.log('[SubAdmin Sidebar] Login As User: All checks passed. Redirecting to /dashboard...')

        // Force immediate redirect
        window.location.replace('/dashboard')
      } else {
        console.error('[SubAdmin Sidebar] Login As User: Failed - no token in response')
        alert('Failed to get user token. Please try again.')
      }
    } catch (error) {
      console.error('[SubAdmin Sidebar] Login As User: Error:', error)
      console.error('[SubAdmin Sidebar] Login As User: Error response:', error.response?.data)
      alert(error.response?.data?.message || 'Failed to login as user. Please try again.')
    }
  }

  const menuItems = [
    { id: 'users', label: 'Assigned Users', icon: '👥' }
  ]

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    setSidebarOpen(false)
  }

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {siteSettings.site.logo ? (
                  <img
                    src={siteSettings.site.logo?.startsWith('http') ? siteSettings.site.logo : `${API_URL}${siteSettings.site.logo}`}
                    alt={siteSettings.site.name}
                    className="w-8 h-8 rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {siteSettings.site.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    {siteSettings.site.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sub-Admin</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* User Info */}
          {currentUser && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {currentUser.fullName?.charAt(0).toUpperCase() || 'S'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {currentUser.fullName || 'Sub-Admin'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
              
              {/* Login as User Button */}
              <li>
                <button
                  onClick={handleLoginAsSubAdminUser}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                >
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium text-green-700 dark:text-green-400">Login as User</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
            {onChangePassword && (
              <button
                onClick={onChangePassword}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>Change Password</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

    </>
  )
}

