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
import BalanceLogsList from '../components/admin/BalanceLogsList'
import KYCLogList from '../components/admin/KYCLogList'
import KYCSettings from '../components/admin/KYCSettings'
import BuyTransactionsList from '../components/admin/BuyTransactionsList'
import TelegramSettings from '../components/admin/TelegramSettings'
import AdminNotificationCenter from '../components/admin/AdminNotificationCenter'
import ChatManagement from '../components/admin/ChatManagement'
import SiteSettings from '../components/admin/SiteSettings'
import NotifyUsers from '../components/admin/NotifyUsers'
import SubAdminManagement from '../components/admin/SubAdminManagement'
import ChangePasswordModal from '../components/admin/ChangePasswordModal'
import PageHeader from '../components/ui/PageHeader'
import { NotificationProvider } from '../context/NotificationContext'
import NotificationBell from '../components/notifications/NotificationBell'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Badge from '../components/ui/Badge'

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
      'buy-transactions': 'Buy Transactions',
      'balance-logs': 'Balance Logs',
      'kyc': 'KYC Management',
      'kyc-settings': 'KYC Settings',
      'notifications': 'Notification Center',
      'telegram': 'Telegram',
      'chat': 'Customer Service',
      'notify-users': 'Notify Users',
      'subadmins': 'Sub-Admins',
      'site-settings': 'Site Settings'
    }
    return titles[activeTab] || 'Admin'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <NotificationProvider mode="admin">
    <div className="fx-page transition-colors">
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
        <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur">
          <div className="px-4 sm:px-6 py-4 space-y-2">
            <Breadcrumbs items={[{ label: 'Admin' }, { label: getTabTitle() }]} />
            <div className="flex justify-between items-start gap-4">
              <PageHeader title={getTabTitle()} description="Manage users, risk controls, operations, and platform settings." />
              <div className="flex items-center gap-2">
                {/* Desktop: full controls. Mobile uses top bar bell in AdminSidebar. */}
                <div className="hidden lg:flex items-center gap-2">
                  <NotificationBell />
                  <Badge label="Secure Admin Mode" status="verified" />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
          {activeTab === 'dashboard' && (
            <DashboardContent stats={stats} recentLogins={recentLogins} />
          )}
          {activeTab === 'users' && <UsersList />}
          {activeTab === 'coins' && <CoinsList />}
          {activeTab === 'deposits' && <DepositLogList />}
          {activeTab === 'withdrawals' && <WithdrawalLogList />}
          {activeTab === 'transfers' && <TransferLogList />}
          {activeTab === 'buy-transactions' && <BuyTransactionsList />}
          {activeTab === 'balance-logs' && <BalanceLogsList />}
          {activeTab === 'kyc' && <KYCLogList />}
          {activeTab === 'kyc-settings' && <KYCSettings />}
          {activeTab === 'notifications' && <AdminNotificationCenter />}
          {activeTab === 'telegram' && <TelegramSettings />}
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
    </NotificationProvider>
  )
}
