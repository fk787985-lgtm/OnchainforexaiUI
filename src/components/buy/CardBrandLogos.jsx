export function CardBrandLogo({ brand, className = 'h-8 w-12' }) {
  switch (brand) {
    case 'visa':
      return (
        <svg viewBox="0 0 48 32" className={className} aria-label="Visa">
          <rect width="48" height="32" rx="4" fill="#1A1F71" />
          <text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="Arial,sans-serif">
            VISA
          </text>
        </svg>
      )
    case 'mastercard':
      return (
        <svg viewBox="0 0 48 32" className={className} aria-label="Mastercard">
          <rect width="48" height="32" rx="4" fill="#252525" />
          <circle cx="19" cy="16" r="8" fill="#EB001B" />
          <circle cx="29" cy="16" r="8" fill="#F79E1B" />
          <path d="M24 10.2a8 8 0 000 11.6 8 8 0 000-11.6z" fill="#FF5F00" />
        </svg>
      )
    case 'amex':
      return (
        <svg viewBox="0 0 48 32" className={className} aria-label="Amex">
          <rect width="48" height="32" rx="4" fill="#2E77BB" />
          <text x="24" y="19" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="700" fontFamily="Arial,sans-serif">
            AMEX
          </text>
        </svg>
      )
    case 'discover':
      return (
        <svg viewBox="0 0 48 32" className={className} aria-label="Discover">
          <rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" />
          <circle cx="34" cy="16" r="7" fill="#F76F00" />
          <text x="14" y="19" textAnchor="middle" fill="#333" fontSize="6" fontWeight="700" fontFamily="Arial,sans-serif">
            DISC
          </text>
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 48 32" className={className} aria-label="Card">
          <rect width="48" height="32" rx="4" fill="#334155" />
          <rect x="6" y="10" width="16" height="4" rx="1" fill="#94a3b8" />
          <rect x="6" y="18" width="28" height="3" rx="1" fill="#64748b" />
        </svg>
      )
  }
}

export function CardBrandStrip({ active }) {
  const brands = ['visa', 'mastercard', 'amex', 'discover']
  return (
    <div className="flex items-center gap-1.5">
      {brands.map((b) => (
        <div
          key={b}
          className={`transition opacity-60 ${active === b ? 'opacity-100 scale-110' : ''}`}
        >
          <CardBrandLogo brand={b} className="h-5 w-8" />
        </div>
      ))}
    </div>
  )
}
