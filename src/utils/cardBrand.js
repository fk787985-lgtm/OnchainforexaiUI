/**
 * Detect card brand from PAN (first digits) — banking-style UX.
 */
export function detectCardBrand(number = '') {
  const n = String(number).replace(/\D/g, '')
  if (!n) return { id: 'unknown', name: 'Card', maxLength: 16, cvvLength: 3, gaps: [4, 8, 12] }

  if (/^4/.test(n)) {
    return { id: 'visa', name: 'Visa', maxLength: 16, cvvLength: 3, gaps: [4, 8, 12] }
  }
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]\d|720))/.test(n)) {
    return { id: 'mastercard', name: 'Mastercard', maxLength: 16, cvvLength: 3, gaps: [4, 8, 12] }
  }
  if (/^3[47]/.test(n)) {
    return { id: 'amex', name: 'American Express', maxLength: 15, cvvLength: 4, gaps: [4, 10] }
  }
  if (/^6(?:011|5|4[4-9])/.test(n) || /^622/.test(n)) {
    return { id: 'discover', name: 'Discover', maxLength: 16, cvvLength: 3, gaps: [4, 8, 12] }
  }
  if (/^3(?:0[0-5]|[68])/.test(n)) {
    return { id: 'diners', name: 'Diners Club', maxLength: 14, cvvLength: 3, gaps: [4, 8, 12] }
  }
  if (/^(?:2131|1800|35)/.test(n)) {
    return { id: 'jcb', name: 'JCB', maxLength: 16, cvvLength: 3, gaps: [4, 8, 12] }
  }
  if (/^62/.test(n)) {
    return { id: 'unionpay', name: 'UnionPay', maxLength: 19, cvvLength: 3, gaps: [4, 8, 12, 16] }
  }

  return { id: 'unknown', name: 'Card', maxLength: 16, cvvLength: 3, gaps: [4, 8, 12] }
}

export function formatCardNumber(value, brand) {
  const max = brand?.maxLength || 16
  const digits = value.replace(/\D/g, '').slice(0, max)
  if (brand?.id === 'amex') {
    const p1 = digits.slice(0, 4)
    const p2 = digits.slice(4, 10)
    const p3 = digits.slice(10, 15)
    return [p1, p2, p3].filter(Boolean).join(' ')
  }
  if (brand?.id === 'diners') {
    const p1 = digits.slice(0, 4)
    const p2 = digits.slice(4, 10)
    const p3 = digits.slice(10, 14)
    return [p1, p2, p3].filter(Boolean).join(' ')
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function parseExpiry(formatted) {
  const digits = formatted.replace(/\D/g, '')
  return {
    expMonth: digits.slice(0, 2),
    expYear: digits.slice(2, 4)
  }
}

export function isValidLuhn(number) {
  const digits = number.replace(/\D/g, '')
  if (digits.length < 13) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = parseInt(digits[i], 10)
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}
