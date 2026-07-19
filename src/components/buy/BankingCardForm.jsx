import { useMemo, useState } from 'react'
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  parseExpiry,
  isValidLuhn
} from '../../utils/cardBrand'
import { CardBrandLogo, CardBrandStrip } from './CardBrandLogos'

const GRADIENTS = {
  visa: 'from-[#1A1F71] to-[#0d1140]',
  mastercard: 'from-[#1a1a1a] to-[#3d1a00]',
  amex: 'from-[#2E77BB] to-[#0f3a66]',
  discover: 'from-[#4a1c00] to-[#F76F00]',
  unknown: 'from-slate-800 to-slate-950'
}

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'India',
  'Nigeria',
  'Kenya',
  'South Africa',
  'Brazil',
  'Mexico',
  'UAE',
  'Singapore',
  'Other'
]

export default function BankingCardForm({
  card,
  setCard,
  billing,
  setBilling,
  onSubmit,
  loading,
  amount,
  submitLabel
}) {
  const [focused, setFocused] = useState('')
  const [showCvvHint, setShowCvvHint] = useState(false)

  const brand = useMemo(() => detectCardBrand(card.cardNumber), [card.cardNumber])
  const digits = card.cardNumber.replace(/\D/g, '')
  const numberComplete = digits.length >= Math.min(brand.maxLength, 15)
  const numberValid = numberComplete && isValidLuhn(digits)
  const numberInvalid = numberComplete && !isValidLuhn(digits)

  const expiryValue = card.expMonth
    ? `${card.expMonth}${card.expMonth.length >= 2 || card.expYear ? '/' : ''}${card.expYear || ''}`
    : ''

  const onNumberChange = (e) => {
    const nextBrand = detectCardBrand(e.target.value)
    setCard({ ...card, cardNumber: formatCardNumber(e.target.value, nextBrand) })
  }

  const onExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value)
    let { expMonth, expYear } = parseExpiry(formatted)
    if (expMonth.length === 2) {
      const n = Number(expMonth)
      if (n > 12) expMonth = '12'
      if (n === 0) expMonth = '01'
    }
    setCard({ ...card, expMonth, expYear })
  }

  const gradient = GRADIENTS[brand.id] || GRADIENTS.unknown

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl bg-gradient-to-br ${gradient}`}>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="flex justify-between items-start mb-8 relative">
          <div className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 opacity-90" />
          <CardBrandLogo brand={brand.id} className="h-9 w-14 drop-shadow" />
        </div>
        <p className="font-mono text-lg sm:text-xl tracking-[0.18em] mb-6 relative min-h-[1.75rem]">
          {card.cardNumber || '•••• •••• •••• ••••'}
        </p>
        <div className="flex justify-between items-end relative text-xs sm:text-sm gap-3">
          <div className="min-w-0">
            <p className="text-white/50 uppercase text-[10px] tracking-wider mb-0.5">Cardholder</p>
            <p className="font-medium tracking-wide uppercase truncate">
              {card.cardholderName || 'YOUR NAME'}
            </p>
          </div>
          <div>
            <p className="text-white/50 uppercase text-[10px] tracking-wider mb-0.5">Expires</p>
            <p className="font-mono">
              {card.expMonth || 'MM'}/{card.expYear || 'YY'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/50 uppercase text-[10px] tracking-wider mb-0.5">
              {brand.id === 'amex' ? 'CID' : 'CVV'}
            </p>
            <p className="font-mono">{card.cvv ? '•'.repeat(card.cvv.length) : '•••'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">We accept</p>
        <CardBrandStrip active={digits ? brand.id : null} />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-5 space-y-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure card payment
        </p>

        <Field
          label="Name on card"
          value={card.cardholderName}
          onChange={(e) => setCard({ ...card, cardholderName: e.target.value.toUpperCase() })}
          onFocus={() => setFocused('name')}
          onBlur={() => setFocused('')}
          placeholder="JANE DOE"
          autoComplete="cc-name"
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Card number</label>
          <div
            className={`relative flex items-center rounded-xl border bg-white dark:bg-slate-800 transition ${
              numberInvalid
                ? 'border-red-400 ring-2 ring-red-100'
                : numberValid
                  ? 'border-emerald-500 ring-2 ring-emerald-50'
                  : focused === 'number'
                    ? 'border-cyan-500 ring-2 ring-cyan-100'
                    : 'border-slate-200 dark:border-slate-600'
            }`}
          >
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="Enter card number"
              value={card.cardNumber}
              onChange={onNumberChange}
              onFocus={() => setFocused('number')}
              onBlur={() => setFocused('')}
              required
              className="w-full rounded-xl px-4 py-3.5 pr-16 outline-none font-mono tracking-wider text-base bg-transparent text-slate-900 dark:text-white"
            />
            <div className="absolute right-3 pointer-events-none">
              <CardBrandLogo brand={brand.id} className="h-7 w-11" />
            </div>
          </div>
          {numberInvalid && (
            <p className="text-xs text-red-600 mt-1">Card number looks invalid — please check the digits.</p>
          )}
          {numberValid && (
            <p className="text-xs text-emerald-600 mt-1">✓ {brand.name} number format looks good</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Expiry date</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={expiryValue}
              onChange={onExpiryChange}
              onFocus={() => setFocused('expiry')}
              onBlur={() => setFocused('')}
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3.5 outline-none font-mono text-slate-900 dark:text-white focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              {brand.id === 'amex' ? 'CID (4 digits)' : 'CVV'}
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setShowCvvHint((v) => !v)}
                tabIndex={-1}
              >
                ?
              </button>
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={brand.cvvLength === 4 ? '••••' : '•••'}
              maxLength={brand.cvvLength}
              value={card.cvv}
              onChange={(e) =>
                setCard({
                  ...card,
                  cvv: e.target.value.replace(/\D/g, '').slice(0, brand.cvvLength)
                })
              }
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3.5 outline-none font-mono text-slate-900 dark:text-white focus:border-cyan-500"
            />
            {showCvvHint && (
              <p className="text-xs text-slate-500 mt-1">
                {brand.id === 'amex'
                  ? '4-digit code on the front of your American Express card.'
                  : '3-digit code on the back signature strip.'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Billing address</p>
        <p className="text-xs text-slate-500 -mt-1">Must match the address on file with your card issuer.</p>
        <Field
          label="Address line 1"
          value={billing.line1}
          onChange={(e) => setBilling({ ...billing, line1: e.target.value })}
          autoComplete="address-line1"
          required
        />
        <Field
          label="Address line 2 (optional)"
          value={billing.line2}
          onChange={(e) => setBilling({ ...billing, line2: e.target.value })}
          autoComplete="address-line2"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field
            label="City"
            value={billing.city}
            onChange={(e) => setBilling({ ...billing, city: e.target.value })}
            autoComplete="address-level2"
            required
          />
          <Field
            label="State / Province"
            value={billing.state}
            onChange={(e) => setBilling({ ...billing, state: e.target.value })}
            autoComplete="address-level1"
          />
          <Field
            label="Postal code"
            value={billing.postalCode}
            onChange={(e) => setBilling({ ...billing, postalCode: e.target.value })}
            autoComplete="postal-code"
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Country</label>
            <select
              required
              value={billing.country}
              onChange={(e) => setBilling({ ...billing, country: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 outline-none text-slate-900 dark:text-white focus:border-cyan-500"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-slate-500 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl p-3">
        <svg className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p>
          Payment is fully encrypted.
          {/* . Full card number and CVV are never stored in production — only last 4 digits, brand, expiry, and billing for receipts and admin review. */}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white py-4 text-base font-semibold hover:from-cyan-600 hover:to-indigo-700 transition shadow-lg disabled:opacity-50"
      >
        {loading
          ? 'Processing payment…'
          : submitLabel || `Pay $${Number(amount || 0).toLocaleString()} securely`}
      </button>
    </form>
  )
}

function Field({ label, className, ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      )}
      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 outline-none text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:focus:ring-cyan-900/40 transition"
      />
    </div>
  )
}
