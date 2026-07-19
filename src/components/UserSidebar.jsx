import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/axios'
import { getImageUrl } from '../utils/imageUrl.js'

function Icon({ d, className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
    </svg>
  )
}

function NavItem({ icon, label, onClick, active = false, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-[color-mix(in_srgb,var(--fx-color-primary)_12%,transparent)] text-[var(--fx-color-primary-strong)] dark:text-[#7dd3fc] border border-[color-mix(in_srgb,var(--fx-color-primary)_28%,transparent)] shadow-sm'
          : 'text-[var(--fx-color-text)] border border-transparent hover:bg-[var(--fx-color-surface-muted)]'
      }`}
    >
      <span
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          active
            ? 'bg-[var(--fx-color-primary)] text-white shadow-md shadow-blue-500/25'
            : 'bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text-muted)] group-hover:text-[var(--fx-color-primary)]'
        }`}
      >
        {icon}
      </span>
      <span className="flex-1 text-left truncate">{label}</span>
      {badge}
    </button>
  )
}

function UserInfoCard() {
  const [user, setUser] = useState(null)
  const [kycStatus, setKycStatus] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        const [me, kyc] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/kyc/status').catch(() => null)
        ])
        if (me.data?.success) setUser(me.data.user)
        if (kyc?.data?.success) setKycStatus(kyc.data)
      } catch {
        /* ignore */
      }
    })()
  }, [])

  if (!user) {
    return (
      <div className="animate-pulse flex gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/15" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-white/20 rounded-full w-2/3" />
          <div className="h-2 bg-white/12 rounded-full w-full" />
        </div>
      </div>
    )
  }

  const initial =
    user.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-lg font-extrabold text-white ring-2 ring-white/10">
          {initial}
        </div>
        {kycStatus?.isVerified && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0f2744] flex items-center justify-center"
            title="KYC verified"
          >
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-bold text-white truncate">{user.fullName || 'Trader'}</p>
          {!kycStatus?.isVerified && (
            <button
              type="button"
              onClick={() => navigate('/kyc/verify')}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 hover:bg-amber-300 transition"
            >
              Verify KYC
            </button>
          )}
        </div>
        <p className="text-[11px] text-white/65 truncate mt-0.5">{user.email}</p>
        <p className="text-[10px] text-white/45 font-mono mt-0.5 tracking-wide">
          ID · {user.uniqueId || '—'}
        </p>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--fx-color-text-muted)]">
      {children}
    </p>
  )
}

export default function UserSidebar({
  open,
  onClose,
  siteName = 'XCrypto',
  logo,
  onLogout,
  onOpenTransfer,
  onOpenLanguage
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const path = location.pathname
  const isActive = (prefix) => path === prefix || path.startsWith(`${prefix}/`)

  const go = (to) => {
    navigate(to)
    onClose?.()
  }

  useEffect(() => {
    if (isActive('/settings') || path === '/privacy-policy') {
      setSettingsOpen(true)
    }
  }, [path])

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[300px] max-w-[90vw] bg-[var(--fx-color-surface)] border-r border-[var(--fx-color-border)] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Account menu"
      >
        {/* Brand header */}
        <div className="relative overflow-hidden shrink-0 bg-gradient-to-br from-[#0b1426] via-[#0f2744] to-[#1199fa] p-4 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-[#1199fa]/25 blur-2xl" />
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              {logo ? (
                <img
                  src={getImageUrl(logo)}
                  alt=""
                  className="w-9 h-9 rounded-xl object-contain bg-white/10 border border-white/15"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/15 flex items-center justify-center font-extrabold text-sm">
                  {siteName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-extrabold text-sm tracking-tight truncate">{siteName}</p>
                <p className="text-[10px] text-white/55 uppercase tracking-[0.14em] font-semibold">
                  Exchange
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/12 transition border border-transparent hover:border-white/10"
              aria-label="Close menu"
            >
              <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
            </button>
          </div>
          <UserInfoCard />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          <div>
            <SectionLabel>Account</SectionLabel>
            <div className="space-y-0.5">
              <NavItem
                label="Profile & wallet"
                active={isActive('/profile') && !isActive('/profile/deposits') && !isActive('/profile/withdrawals') && !isActive('/profile/transfers')}
                onClick={() => go('/profile')}
                icon={<Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
              />
              <NavItem
                label="Deposits"
                active={isActive('/profile/deposits')}
                onClick={() => go('/profile/deposits')}
                icon={<Icon d="M12 4v16m8-8H4" />}
              />
              <NavItem
                label="Withdrawals"
                active={isActive('/profile/withdrawals')}
                onClick={() => go('/profile/withdrawals')}
                icon={<Icon d="M20 12H4" />}
              />
              <NavItem
                label="Transfers"
                active={isActive('/profile/transfers')}
                onClick={() => go('/profile/transfers')}
                icon={<Icon d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />}
              />
            </div>
          </div>

          <div>
            <SectionLabel>Trade</SectionLabel>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onOpenTransfer?.()
                  onClose?.()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-[color-mix(in_srgb,var(--fx-color-primary)_10%,transparent)] text-[var(--fx-color-primary-strong)] dark:text-[#7dd3fc] border border-[color-mix(in_srgb,var(--fx-color-primary)_28%,transparent)] hover:bg-[color-mix(in_srgb,var(--fx-color-primary)_16%,transparent)] transition"
              >
                <span className="w-9 h-9 rounded-xl bg-[var(--fx-color-primary)] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                  <Icon d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </span>
                Internal transfer
              </button>
              <NavItem
                label="Markets & futures"
                active={isActive('/trade')}
                onClick={() => go('/trade')}
                icon={
                  <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                }
              />
              <NavItem
                label="Buy crypto"
                active={isActive('/buy')}
                onClick={() => go('/buy')}
                icon={
                  <Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                }
              />
            </div>
          </div>

          <div>
            <SectionLabel>Support & security</SectionLabel>
            <div className="space-y-0.5">
              <NavItem
                label="Support"
                active={isActive('/customer-service')}
                onClick={() => go('/customer-service')}
                icon={
                  <Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                }
              />
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition border ${
                  isActive('/settings') || path === '/privacy-policy'
                    ? 'bg-[color-mix(in_srgb,var(--fx-color-primary)_12%,transparent)] text-[var(--fx-color-primary-strong)] border-[color-mix(in_srgb,var(--fx-color-primary)_28%,transparent)]'
                    : 'text-[var(--fx-color-text)] border-transparent hover:bg-[var(--fx-color-surface-muted)]'
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isActive('/settings')
                      ? 'bg-[var(--fx-color-primary)] text-white'
                      : 'bg-[var(--fx-color-surface-muted)] text-[var(--fx-color-text-muted)]'
                  }`}
                >
                  <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </span>
                <span className="flex-1 text-left">Settings</span>
                <svg
                  className={`w-4 h-4 text-[var(--fx-color-text-muted)] transition-transform ${settingsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {settingsOpen && (
                <div className="ml-3 pl-3 border-l-2 border-[color-mix(in_srgb,var(--fx-color-primary)_35%,transparent)] space-y-0.5 py-0.5">
                  {[
                    { l: 'All settings', p: '/settings' },
                    { l: 'Change password', p: '/settings/change-password' },
                    { l: 'Two-factor auth', p: '/settings/2fa' },
                    { l: 'Privacy policy', p: '/privacy-policy' }
                  ].map((item) => (
                    <button
                      key={item.p}
                      type="button"
                      onClick={() => go(item.p)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                        path === item.p
                          ? 'text-[var(--fx-color-primary)] bg-[color-mix(in_srgb,var(--fx-color-primary)_8%,transparent)]'
                          : 'text-[var(--fx-color-text-muted)] hover:bg-[var(--fx-color-surface-muted)] hover:text-[var(--fx-color-primary)]'
                      }`}
                    >
                      {item.l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--fx-color-border)] space-y-1 shrink-0 bg-[var(--fx-color-surface-muted)]/60">
          <button
            type="button"
            onClick={() => {
              onOpenLanguage?.()
              onClose?.()
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--fx-color-text)] hover:bg-[var(--fx-color-surface)] transition"
          >
            <span className="w-9 h-9 rounded-xl bg-[var(--fx-color-surface)] border border-[var(--fx-color-border)] flex items-center justify-center text-[var(--fx-color-text-muted)]">
              <Icon d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </span>
            Language
          </button>
          <button
            type="button"
            onClick={async () => {
              onClose?.()
              await onLogout?.()
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/35 border border-rose-200/70 dark:border-rose-900/45 transition"
          >
            <span className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
              <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </span>
            Log out
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
          onClick={onClose}
          aria-hidden
        />
      )}
    </>
  )
}
