import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import MetaTags from './components/MetaTags'
import PageLoader from './components/common/PageLoader'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const SignUp = lazy(() => import('./pages/SignUp'))
const SignIn = lazy(() => import('./pages/SignIn'))
const AdminSignIn = lazy(() => import('./pages/AdminSignIn'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const ConfirmEmail = lazy(() => import('./pages/ConfirmEmail'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const SubAdminDashboard = lazy(() => import('./pages/SubAdminDashboard'))
const CryptoList = lazy(() => import('./pages/CryptoList'))
const StocksList = lazy(() => import('./pages/StocksList'))
const MetalsList = lazy(() => import('./pages/MetalsList'))
const ForexList = lazy(() => import('./pages/ForexList'))
const Market = lazy(() => import('./pages/Market'))
const Trade = lazy(() => import('./pages/Trade'))
const TradeDetail = lazy(() => import('./pages/TradeDetail'))
const Asset = lazy(() => import('./pages/Asset'))
const History = lazy(() => import('./pages/History'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const WithdrawalDetail = lazy(() => import('./pages/WithdrawalDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const KYCVerify = lazy(() => import('./pages/KYCVerify'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const Enable2FA = lazy(() => import('./pages/Enable2FA'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const HelpSupport = lazy(() => import('./pages/HelpSupport'))
const CustomerService = lazy(() => import('./pages/CustomerService'))

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
            background: 'var(--fx-color-surface)',
            color: 'var(--fx-color-text)',
            border: '1px solid var(--fx-color-border)',
            borderRadius: '12px',
            boxShadow: 'var(--fx-shadow-md)',
            padding: '12px 14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#16a34a',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
          },
        }}
      />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/admin/signin" element={<AdminSignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
        </Suspense>
      </Router>
      </SiteSettingsProvider>
    </ThemeProvider>
  )
}

export default App

