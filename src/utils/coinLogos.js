/**
 * Resolve a reliable logo URL for a coin symbol.
 * Local uploads often 404 in dev; CDN logos keep every coin distinct.
 */

import { getImageUrl } from './imageUrl.js'

// Primary CDN set (spothq icons via jsDelivr) — lowercase symbol filenames
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color'

// Extra / alias mappings when filename ≠ symbol
const SYMBOL_FILE = {
  BTC: 'btc',
  ETH: 'eth',
  BNB: 'bnb',
  SOL: 'sol',
  XRP: 'xrp',
  ADA: 'ada',
  DOGE: 'doge',
  DOT: 'dot',
  MATIC: 'matic',
  POL: 'matic',
  AVAX: 'avax',
  LINK: 'link',
  LTC: 'ltc',
  TRX: 'trx',
  SHIB: 'shib',
  UNI: 'uni',
  ATOM: 'atom',
  XLM: 'xlm',
  NEAR: 'near',
  APT: 'apt',
  ARB: 'arb',
  OP: 'op',
  FIL: 'fil',
  ICP: 'icp',
  HBAR: 'hbar',
  VET: 'vet',
  ALGO: 'algo',
  AAVE: 'aave',
  MKR: 'mkr',
  CRV: 'crv',
  SAND: 'sand',
  MANA: 'mana',
  AXS: 'axs',
  EGLD: 'egld',
  FTM: 'ftm',
  EOS: 'eos',
  XTZ: 'xtz',
  THETA: 'theta',
  FLOW: 'flow',
  GRT: 'grt',
  SNX: 'snx',
  COMP: 'comp',
  CHZ: 'chz',
  ENJ: 'enj',
  BAT: 'bat',
  ZEC: 'zec',
  DASH: 'dash',
  XMR: 'xmr',
  BCH: 'bch',
  ETC: 'etc',
  USDT: 'usdt',
  USDC: 'usdc',
  DAI: 'dai',
  BUSD: 'busd',
  TON: 'ton',
  PEPE: 'pepe',
  WIF: 'wif',
  BONK: 'bonk',
  SUI: 'sui',
  SEI: 'sei',
  INJ: 'inj',
  TIA: 'tia',
  RUNE: 'rune',
  IMX: 'imx',
  STX: 'stx',
  RENDER: 'rndr',
  RNDR: 'rndr',
  WLD: 'wld',
  FET: 'fet',
  CAKE: 'cake',
  APE: 'ape'
}

/** CoinCap icons cover many symbols as a second CDN */
const coincapUrl = (symbol) =>
  `https://assets.coincap.io/assets/icons/${String(symbol).toLowerCase()}@2x.png`

/** jsDelivr cryptocurrency-icons */
const jsdelivrUrl = (symbol) => {
  const file = SYMBOL_FILE[String(symbol).toUpperCase()] || String(symbol).toLowerCase()
  return `${CDN_BASE}/${file}.png`
}

/**
 * Ordered logo candidates for a coin.
 * CDN first so every symbol gets a unique logo even when local uploads 404.
 */
export function getCoinLogoCandidates(symbol, uploadedImage) {
  const candidates = []
  if (symbol) {
    candidates.push(jsdelivrUrl(symbol))
    candidates.push(coincapUrl(symbol))
  }
  if (uploadedImage) {
    const raw = String(uploadedImage)
    const local =
      raw.startsWith('http://') || raw.startsWith('https://')
        ? raw
        : getImageUrl(uploadedImage)
    if (local) candidates.push(local)
  }
  return [...new Set(candidates.filter(Boolean))]
}

/** Best single URL to use as initial src */
export function getCoinLogoUrl(symbol, uploadedImage) {
  return getCoinLogoCandidates(symbol, uploadedImage)[0] || ''
}

/**
 * img onError handler: advance through data-logo-fallbacks list, then show letter badge.
 * Usage:
 *   <img data-logo-fallbacks={JSON.stringify(candidates)} onError={handleCoinLogoError} />
 *   <div className="coin-logo-fallback" style={{display:'none'}}>B</div>
 */
export function handleCoinLogoError(e) {
  const img = e.currentTarget
  let list = []
  try {
    list = JSON.parse(img.dataset.logoFallbacks || '[]')
  } catch {
    list = []
  }
  const nextIndex = Number(img.dataset.logoIndex || 0) + 1
  if (nextIndex < list.length) {
    img.dataset.logoIndex = String(nextIndex)
    img.src = list[nextIndex]
    return
  }
  img.style.display = 'none'
  const fallback = img.nextElementSibling
  if (fallback) fallback.style.display = 'flex'
}

export default getCoinLogoUrl
