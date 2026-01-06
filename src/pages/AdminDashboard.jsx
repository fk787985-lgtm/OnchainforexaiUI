import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import api from '../utils/axios'
import AdminSidebar from '../components/admin/AdminSidebar'
import DashboardContent from '../components/admin/DashboardContent'
import UsersList from '../components/admin/UsersList'
import CoinsList from '../components/admin/CoinsList'
import WithdrawalLogList from '../components/admin/WithdrawalLogList'
import DepositLogList from '../components/admin/DepositLogList'
import TransferLogList from '../components/admin/TransferLogList'
import KYCLogList from '../components/admin/KYCLogList'
import KYCSettings from '../components/admin/KYCSettings'
import ChatManagement from '../components/admin/ChatManagement'
import SiteSettings from '../components/admin/SiteSettings'
import NotifyUsers from '../components/admin/NotifyUsers'
import SubAdminManagement from '../components/admin/SubAdminManagement'
import ChangePasswordModal from '../components/admin/ChangePasswordModal'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [recentLogins, setRecentLogins] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const { theme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/admin/signin')
      return
    }
    // Only allow admins to access this dashboard
    const checkUser = async () => {
      try {
        const response = await api.get('/api/auth/me')
        if (response.data.success && response.data.user.role === 'admin') {
          fetchDashboardData()
        } else if (response.data.success && response.data.user.role === 'subadmin') {
          // Redirect sub-admins to their own dashboard
          navigate('/subadmin/dashboard')
        } else {
          navigate('/admin/signin')
        }
      } catch (error) {
        navigate('/admin/signin')
      }
    }
    checkUser()
  }, [navigate])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/admin/dashboard')
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
      'users': 'Users',
      'coins': 'Coins',
      'deposits': 'Deposit Log',
      'withdrawals': 'Withdrawal Log',
      'transfers': 'Transfer Log',
      'kyc': 'KYC Log',
      'kyc-settings': 'KYC Settings',
      'chat': 'Customer Service',
      'notify-users': 'Notify Users',
      'subadmins': 'Sub-Admins',
      'site-settings': 'Site Settings'
    }
    return titles[activeTab] || 'Admin'
  }

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
      <AdminSidebar
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
            <DashboardContent stats={stats} recentLogins={recentLogins} />
          )}
          {activeTab === 'users' && <UsersList />}
          {activeTab === 'coins' && <CoinsList />}
          {activeTab === 'deposits' && <DepositLogList />}
          {activeTab === 'withdrawals' && <WithdrawalLogList />}
          {activeTab === 'transfers' && <TransferLogList />}
          {activeTab === 'kyc' && <KYCLogList />}
          {activeTab === 'kyc-settings' && <KYCSettings />}
          {activeTab === 'chat' && <ChatManagement />}
          {activeTab === 'notify-users' && <NotifyUsers />}
          {activeTab === 'subadmins' && <SubAdminManagement />}
          {activeTab === 'site-settings' && <SiteSettings />}
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
