import { getCoinLogoCandidates, handleCoinLogoError } from '../../utils/coinLogos'

const COLOR_BY_SYMBOL = {
  USDT: 'bg-green-500',
  USDC: 'bg-blue-500',
  BNB: 'bg-yellow-500',
  BONK: 'bg-orange-500',
  TRX: 'bg-red-500',
  BTC: 'bg-orange-500',
  ETH: 'bg-indigo-500',
  SOL: 'bg-purple-500',
  XRP: 'bg-slate-600',
  DOGE: 'bg-amber-500',
  ADA: 'bg-sky-600',
  DOT: 'bg-pink-600'
}

/**
 * Consistent coin logo with multi-CDN fallback, then letter avatar.
 */
export default function CoinLogo({
  symbol = '',
  image,
  name,
  size = 'md',
  className = ''
}) {
  const sym = String(symbol || '').toUpperCase()
  const candidates = getCoinLogoCandidates(sym, image)
  const sizeClass =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'
  const textClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
  const color = COLOR_BY_SYMBOL[sym] || 'bg-gradient-to-br from-cyan-500 to-indigo-600'

  return (
    <div className={`relative ${sizeClass} flex-shrink-0 ${className}`}>
      {candidates.length > 0 ? (
        <img
          src={candidates[0]}
          alt={name || sym || 'coin'}
          className={`${sizeClass} rounded-full object-cover bg-slate-100 dark:bg-slate-800`}
          data-logo-fallbacks={JSON.stringify(candidates)}
          data-logo-index="0"
          onError={handleCoinLogoError}
          loading="lazy"
        />
      ) : null}
      <div
        className={`absolute inset-0 ${sizeClass} rounded-full ${color} text-white font-bold items-center justify-center ${textClass}`}
        style={{ display: candidates.length ? 'none' : 'flex' }}
      >
        <span>{sym?.charAt(0) || '?'}</span>
      </div>
    </div>
  )
}
