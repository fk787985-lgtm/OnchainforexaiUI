import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { getImageUrl } from '../utils/imageUrl.js'

const BG =
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=2000&q=80'
const SIDE =
  'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1200&q=80'

/**
 * Advanced crypto-themed shell for Sign In / Sign Up
 */
export default function AuthFancyShell({
  children,
  siteName = 'XCrypto',
  logo,
  title = 'Trade crypto with confidence',
  subtitle = 'Real-time markets · Secure wallet · Instant deposits'
}) {
  return (
    <div className="auth-shell min-h-screen relative flex text-slate-100 overflow-x-hidden">
      {/* Layered cinematic background */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={BG} alt="" className="w-full h-full object-cover scale-110 auth-bg-ken" />
        <div className="absolute inset-0 auth-bg-veil" />
        <div className="absolute inset-0 auth-bg-mesh" />
        <div className="absolute inset-0 auth-bg-grid opacity-[0.12] dark:opacity-[0.08]" />
        <div className="auth-orb auth-orb-a" />
        <div className="auth-orb auth-orb-b" />
        <div className="auth-orb auth-orb-c" />
      </div>

      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30">
        <div className="rounded-full border border-white/10 bg-black/30 backdrop-blur-md p-1 shadow-lg">
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row min-h-screen items-stretch px-3 sm:px-6 py-8 sm:py-10 gap-6 lg:gap-10">
        {/* Left showcase panel */}
        <div className="hidden lg:flex lg:w-[46%] flex-col justify-between rounded-[1.75rem] overflow-hidden relative auth-side-panel">
          <img src={SIDE} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#0b1426]/75 to-[#1199fa]/15" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[1.75rem] pointer-events-none" />

          <div className="relative p-8 flex flex-col h-full min-h-[580px]">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              {logo ? (
                <img
                  src={getImageUrl(logo)}
                  alt=""
                  className="w-11 h-11 rounded-2xl object-contain bg-white/10 ring-1 ring-white/15"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2da8ff] via-[#1199fa] to-[#0055b8] flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
                  {siteName.charAt(0)}
                </div>
              )}
              <div>
                <span className="text-lg font-extrabold tracking-tight block group-hover:text-[#2da8ff] transition">
                  {siteName}
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold">
                  Exchange
                </span>
              </div>
            </Link>

            <div className="mt-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Markets live
              </div>
              <h2 className="text-3xl xl:text-[2.15rem] font-extrabold leading-[1.15] tracking-tight">
                {title}
              </h2>
              <p className="text-slate-300/90 text-sm leading-relaxed max-w-sm">{subtitle}</p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="auth-stat-tile">
                  <p className="text-[10px] text-slate-400 font-medium">BTC 24h</p>
                  <p className="text-lg font-extrabold text-emerald-400 tracking-tight">+4.82%</p>
                  <div className="mt-2.5 flex items-end gap-[3px] h-9">
                    {[28, 42, 36, 55, 48, 70, 62, 85, 78, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-gradient-to-t from-emerald-700 to-emerald-300 opacity-90"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="auth-stat-tile">
                  <p className="text-[10px] text-slate-400 font-medium">Portfolio</p>
                  <p className="text-lg font-extrabold text-[#2da8ff] tracking-tight">$128.4K</p>
                  <p className="text-[11px] text-emerald-300/90 mt-1.5 font-semibold">+$12,480 PnL</p>
                  <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#1199fa] to-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <LockIcon /> AES-256
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>2FA ready</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>24/7 markets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form column */}
        <div className="flex-1 flex flex-col justify-center py-2">
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2.5">
              {logo ? (
                <img src={getImageUrl(logo)} alt="" className="w-11 h-11 rounded-2xl object-contain" />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2da8ff] to-[#0066cc] flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30">
                  {siteName.charAt(0)}
                </div>
              )}
              <span className="text-xl font-extrabold bg-gradient-to-r from-cyan-200 to-[#2da8ff] bg-clip-text text-transparent">
                {siteName}
              </span>
            </Link>
          </div>

          {/* Advanced card with gradient border */}
          <div className="auth-card-outer w-full max-w-md mx-auto">
            <div className="auth-form-card auth-card-inner p-5 sm:p-8 text-slate-900 dark:text-slate-50">
              <div className="auth-card-shine pointer-events-none" aria-hidden />
              {children}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <LockIcon /> Encrypted sessions
            </span>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span>Live market data</span>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span>Crypto · Forex · more</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg className="w-3 h-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  )
}
