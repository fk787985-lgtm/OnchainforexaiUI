/**
 * Crypto.com-style app download + partner apps
 * Crypto.com official + Onchain exchange access
 */
const CRYPTO_COM_IOS =
  'https://apps.apple.com/app/crypto-com-buy-bitcoin-ether/id1262148500'
const CRYPTO_COM_ANDROID =
  'https://play.google.com/store/apps/details?id=co.mona.android'
const CRYPTO_COM_WEB = 'https://crypto.com/app'

export default function AppDownloadSection({
  siteName = 'Onchain',
  onchainUrl = 'https://onchainforexai.com',
  compact = false
}) {
  const onchainIos = onchainUrl
  const onchainAndroid = onchainUrl

  return (
    <section
      className={
        compact
          ? 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-[#0b1426] to-slate-950 p-5 text-white'
          : 'py-16 sm:py-20 px-4 bg-gradient-to-b from-slate-950 via-[#0b1426] to-slate-950 text-white'
      }
      id="download"
    >
      <div className={compact ? '' : 'max-w-6xl mx-auto'}>
        <div className={`grid ${compact ? 'gap-5' : 'lg:grid-cols-2 gap-10 items-center'}`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2da8ff] mb-3">
              Trade on the go
            </p>
            <h2
              className={`font-extrabold tracking-tight ${
                compact ? 'text-xl' : 'text-3xl sm:text-4xl'
              }`}
            >
              Download the apps
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg">
              Get the official <span className="text-white font-semibold">Crypto.com</span> app for
              markets & payments, and open{' '}
              <span className="text-white font-semibold">{siteName}</span> for your exchange
              workspace — designed for a premium crypto trading experience.
            </p>

            {/* Crypto.com */}
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="https://cryptologos.cc/logos/crypto-com-coin-cro-logo.png?v=040"
                  alt="Crypto.com"
                  className="w-9 h-9 rounded-xl bg-white/10 p-1 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div>
                  <p className="font-bold text-sm">Crypto.com</p>
                  <p className="text-xs text-slate-400">Official app · App Store & Google Play</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a href={CRYPTO_COM_IOS} target="_blank" rel="noopener noreferrer" className="app-badge">
                  <AppleIcon />
                  <span>
                    <small>Download on the</small>
                    <strong>App Store</strong>
                  </span>
                </a>
                <a
                  href={CRYPTO_COM_ANDROID}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="app-badge"
                >
                  <PlayIcon />
                  <span>
                    <small>Get it on</small>
                    <strong>Google Play</strong>
                  </span>
                </a>
                <a
                  href={CRYPTO_COM_WEB}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fx-btn fx-btn-secondary !bg-white/10 !text-white !border-white/15 !min-h-[52px]"
                >
                  crypto.com/app
                </a>
              </div>
            </div>

            {/* Onchain */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1199fa] to-[#0066cc] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">
                  {siteName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm">{siteName} Exchange</p>
                  <p className="text-xs text-slate-400">onchain · web & mobile access</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a href={onchainIos} target="_blank" rel="noopener noreferrer" className="app-badge">
                  <AppleIcon />
                  <span>
                    <small>Open</small>
                    <strong>{siteName} iOS</strong>
                  </span>
                </a>
                <a
                  href={onchainAndroid}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="app-badge"
                >
                  <PlayIcon />
                  <span>
                    <small>Open</small>
                    <strong>{siteName} Android</strong>
                  </span>
                </a>
                <a
                  href={onchainUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fx-btn fx-btn-primary !min-h-[52px]"
                >
                  Open exchange
                </a>
              </div>
            </div>
          </div>

          {!compact && (
            <div className="relative">
              <div className="absolute -inset-6 bg-[#1199fa]/15 blur-3xl rounded-full" />
              <div className="relative grid grid-cols-2 gap-4">
                <PhoneMock
                  title="Crypto.com"
                  subtitle="Buy · Sell · Earn"
                  gradient="from-[#002d74] via-[#0b1426] to-[#1199fa]"
                  image="https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&q=80"
                />
                <PhoneMock
                  title={siteName}
                  subtitle="Trade · Portfolio"
                  gradient="from-[#0b1426] via-[#111c2e] to-[#1199fa]"
                  image="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80"
                  className="mt-8"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function PhoneMock({ title, subtitle, gradient, image, className = '' }) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-gradient-to-b ${gradient} p-3 shadow-2xl ${className}`}
    >
      <div className="rounded-[1.5rem] overflow-hidden bg-black/40 aspect-[9/16] relative">
        <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-4">
          <p className="text-xs text-white/70">{subtitle}</p>
          <p className="text-lg font-bold text-white">{title}</p>
        </div>
      </div>
    </div>
  )
}

function AppleIcon() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.6 2.7c-.3.2-.5.5-.5.9v16.8c0 .4.2.7.5.9l.1.1L13 12.6v-.2L3.7 2.6l-.1.1zm11.2 6.4l-2.1 2.1 2.1 2.1 4.9-2.8c.5-.3.5-1.1 0-1.4l-4.9-2.8-.0 2.8zM4.3 21.3l8.4-8.4-2.1-2.1L3.7 20.1c.1.5.4.9.6 1.2zm10.5-6.3l-2.1-2.1-2.1 2.1 5.8 3.3c.5.3 1.1-.1 1.1-.7v-.2l-2.7-2.4z" />
    </svg>
  )
}
