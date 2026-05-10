import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import api from '../utils/axios'
import SubAdminSidebar from '../components/admin/SubAdminSidebar'
import SubAdminDashboardContent from '../components/admin/SubAdminDashboardContent'
import UsersList from '../components/admin/UsersList'
import SubAdminNotifyUsers from '../components/admin/SubAdminNotifyUsers'
import ChatManagement from '../components/admin/ChatManagement'
import ChangePasswordModal from '../components/admin/ChangePasswordModal'

export default function SubAdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [recentLogins, setRecentLogins] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const { theme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/admin/signin')
      return
    }
    
    const checkUser = async () => {
      try {
        const response = await api.get('/api/auth/me')
        if (response.data.success && response.data.user.role === 'subadmin') {
          setCurrentUser(response.data.user)
          // Check if sub-admin is active
          if (!response.data.user.isSubAdminActive) {
            localStorage.removeItem('token')
            navigate('/admin/signin')
            return
          }
          fetchDashboardData()
        } else {
          // Not a sub-admin, redirect to appropriate dashboard
          if (response.data.success && response.data.user.role === 'admin') {
            navigate('/admin/dashboard')
          } else {
            navigate('/admin/signin')
          }
        }
      } catch (error) {
        console.error('Error checking user:', error)
        navigate('/admin/signin')
      }
    }
    checkUser()
  }, [navigate])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/admin/subadmin/dashboard')
      if (response.data.success) {
        setStats(response.data.stats)
        setRecentLogins(response.data.recentLogins)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/admin/signin')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      navigate('/admin/signin')
    }
  }

  const getTabTitle = () => {
    const titles = {
      'dashboard': 'Dashboard',
      'users': 'Assigned Users',
      'notify': 'Notify Users',
      'chat': 'Customer Service'
    }
    return titles[activeTab] || 'Sub-Admin'
  }

  const subAdminPermissions = {
    can_view_users: true,
    can_edit_users: false,
    can_add_balance: false,
    can_activate_user: false,
    can_deactivate_user: false,
    can_notify_users: false,
    can_customer_service: false,
    ...(currentUser?.subAdminPermissions || {})
  }

  useEffect(() => {
    if (activeTab === 'notify' && !subAdminPermissions.can_notify_users) {
      setActiveTab('dashboard')
    }
    if (activeTab === 'users' && !subAdminPermissions.can_view_users) {
      setActiveTab('dashboard')
    }
    if (activeTab === 'chat' && !subAdminPermissions.can_customer_service) {
      setActiveTab('dashboard')
    }
  }, [activeTab, subAdminPermissions.can_notify_users, subAdminPermissions.can_view_users, subAdminPermissions.can_customer_service])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      <SubAdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
        onChangePassword={() => setShowChangePassword(true)}
      />

      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold">
              {getTabTitle()}
            </h1>
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6">
          {activeTab === 'dashboard' && (
            <SubAdminDashboardContent stats={stats} recentLogins={recentLogins} />
          )}
          {activeTab === 'users' && subAdminPermissions.can_view_users && <UsersList />}
          {activeTab === 'notify' && subAdminPermissions.can_notify_users && <SubAdminNotifyUsers />}
          {activeTab === 'chat' && subAdminPermissions.can_customer_service && <ChatManagement />}
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  )
}



