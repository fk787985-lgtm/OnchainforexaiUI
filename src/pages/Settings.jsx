import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import { useSiteSettings } from '../context/SiteSettingsContext'
import ThemeToggle from '../components/ThemeToggle'
import AppDownloadSection from '../components/AppDownloadSection'
import PasswordInput from '../components/PasswordInput'

export default function Settings() {
  const navigate = useNavigate()
  const { settings: siteSettings } = useSiteSettings()
  const name = siteSettings?.site?.name || 'Onchainforexai'
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setLoading(true)
    try {
      const response = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      })
      if (response.data.success) {
        toast.success('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordForm(false)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const rows = [
    {
      title: 'Security',
      items: [
        {
          label: 'Change password',
          desc: 'Update your login password',
          action: () => setShowPasswordForm((v) => !v),
          icon: 'lock'
        },
        {
          label: 'Two-factor authentication',
          desc: 'Authenticator app protection',
          to: '/settings/2fa',
          icon: 'shield'
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Profile',
          desc: 'Name, balance, verification',
          to: '/profile',
          icon: 'user'
        },
        {
          label: 'KYC verification',
          desc: 'Identity documents',
          to: '/kyc/verify',
          icon: 'id'
        },
        {
          label: 'Deposits',
          desc: 'Funding history',
          to: '/profile/deposits',
          icon: 'in'
        },
        {
          label: 'Withdrawals',
          desc: 'Payout history',
          to: '/profile/withdrawals',
          icon: 'out'
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          label: 'Help & support',
          desc: siteSettings?.site?.contact?.email || 'Contact our team',
          href: `mailto:${siteSettings?.site?.contact?.email || 'support@onchainforexai.com'}`,
          icon: 'help'
        },
        {
          label: 'Customer service',
          desc: 'Live chat with support',
          to: '/customer-service',
          icon: 'chat'
        },
        {
          label: 'Privacy policy',
          desc: 'How we protect your data',
          to: '/privacy-policy',
          icon: 'doc'
        }
      ]
    }
  ]

  return (
    <div className="fx-page pb-24">
      <header className="sticky top-0 z-40 bg-[var(--fx-color-surface)]/90 backdrop-blur-xl border-b border-[var(--fx-color-border)]">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight">Settings</h1>
            <p className="text-xs text-[var(--fx-color-text-muted)]">Security, account & preferences</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Hero card */}
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#0b1426] via-[#0f1c33] to-[#1199fa] p-5 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Preferences</p>
          <h2 className="text-xl font-extrabold mt-1 tracking-tight">{name}</h2>
          <p className="text-sm text-white/70 mt-1">
            Manage security, verification, and support — Crypto.com-grade control for your exchange
            account.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/profile" className="fx-btn fx-btn-sm !bg-white !text-[#0b1426]">
              View profile
            </Link>
            <Link
              to="/dashboard"
              className="fx-btn fx-btn-sm !bg-white/10 !text-white !border !border-white/20"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {rows.map((section) => (
          <section key={section.title} className="fx-card overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--fx-color-border)]">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--fx-color-text-muted)]">
                {section.title}
              </h2>
            </div>
            <ul className="divide-y divide-[var(--fx-color-border)]">
              {section.items.map((item) => {
                const content = (
                  <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                    <div className="w-10 h-10 rounded-2xl bg-[color-mix(in_srgb,var(--fx-color-primary)_12%,transparent)] text-[var(--fx-color-primary)] flex items-center justify-center shrink-0">
                      <RowIcon name={item.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-[var(--fx-color-text-muted)] truncate">{item.desc}</p>
                    </div>
                    <svg
                      className="w-4 h-4 text-slate-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )
                if (item.to) {
                  return (
                    <li key={item.label}>
                      <Link to={item.to}>{content}</Link>
                    </li>
                  )
                }
                if (item.href) {
                  return (
                    <li key={item.label}>
                      <a href={item.href}>{content}</a>
                    </li>
                  )
                }
                return (
                  <li key={item.label}>
                    <button type="button" className="w-full text-left" onClick={item.action}>
                      {content}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        {showPasswordForm && (
          <section className="fx-card p-5 space-y-4 animate-[fadeIn_0.3s_ease]">
            <div className="flex items-center justify-between">
              <h2 className="fx-section-title">Change password</h2>
              <button
                type="button"
                className="text-xs font-semibold text-[var(--fx-color-primary)]"
                onClick={() => setShowPasswordForm(false)}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="fx-label">Current password</label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  name="currentPassword"
                  className="fx-input"
                />
              </div>
              <div>
                <label className="fx-label">New password</label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  name="newPassword"
                  minLength={8}
                />
                <p className="fx-field-hint">At least 8 characters</p>
              </div>
              <div>
                <label className="fx-label">Confirm new password</label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  name="confirmPassword"
                  minLength={8}
                />
              </div>
              <button type="submit" disabled={loading} className="fx-btn fx-btn-primary fx-btn-block">
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>
        )}

        <AppDownloadSection
          compact
          siteName={name}
          onchainUrl={typeof window !== 'undefined' ? window.location.origin : 'https://onchainforexai.com'}
        />

        <div className="fx-card p-5 text-center">
          <p className="text-xs text-[var(--fx-color-text-muted)]">
            {name} · Version 1.0.0 · Built for crypto traders
          </p>
        </div>
      </main>
    </div>
  )
}

function RowIcon({ name }) {
  const d = {
    lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    shield:
      'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    id: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0',
    in: 'M12 4v16m8-8H4',
    out: 'M20 12H4',
    help: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
    chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d[name] || d.user} />
    </svg>
  )
}
