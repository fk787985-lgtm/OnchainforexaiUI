import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import MetaTags from './components/MetaTags'
import LandingPage from './pages/LandingPage'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import AdminSignIn from './pages/AdminSignIn'
import ForgotPassword from './pages/ForgotPassword'
import ConfirmEmail from './pages/ConfirmEmail'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import SubAdminDashboard from './pages/SubAdminDashboard'
import CryptoList from './pages/CryptoList'
import StocksList from './pages/StocksList'
import MetalsList from './pages/MetalsList'
import ForexList from './pages/ForexList'
import Market from './pages/Market'
import Trade from './pages/Trade'
import TradeDetail from './pages/TradeDetail'
import Asset from './pages/Asset'
import History from './pages/History'
import OrderDetail from './pages/OrderDetail'
import WithdrawalDetail from './pages/WithdrawalDetail'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import KYCVerify from './pages/KYCVerify'
import ChangePassword from './pages/ChangePassword'
import Enable2FA from './pages/Enable2FA'
import PrivacyPolicy from './pages/PrivacyPolicy'
import HelpSupport from './pages/HelpSupport'
import CustomerService from './pages/CustomerService'

function App() {
  return (
    <ThemeProvider>
      <SiteSettingsProvider>
        <MetaTags />
        <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/confirm-email" element={<ConfirmEmail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/subadmin/dashboard" element={<SubAdminDashboard />} />
          <Route path="/crypto/:category" element={<CryptoList />} />
          <Route path="/stocks" element={<StocksList />} />
          <Route path="/metals" element={<MetalsList />} />
          <Route path="/forex" element={<ForexList />} />
          <Route path="/market" element={<Market />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/trade/:type/:symbol" element={<TradeDetail />} />
          <Route path="/asset" element={<Asset />} />
          <Route path="/history" element={<History />} />
          <Route path="/order/:tradeId" element={<OrderDetail />} />
          <Route path="/withdrawal/:id" element={<WithdrawalDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/deposits" element={<Profile />} />
          <Route path="/profile/withdrawals" element={<Profile />} />
          <Route path="/profile/transfers" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/change-password" element={<ChangePassword />} />
          <Route path="/settings/2fa" element={<Enable2FA />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/help-support" element={<HelpSupport />} />
          <Route path="/customer-service" element={<CustomerService />} />
          <Route path="/kyc/verify" element={<KYCVerify />} />
        </Routes>
      </Router>
      </SiteSettingsProvider>
    </ThemeProvider>
  )
}

export default App

