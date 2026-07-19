import { isValidPhoneNumber } from 'react-phone-number-input'
import { getIdentityProfile } from '../config/steps'

const NAME_RE = /^[a-zA-Z\s'.-]{1,80}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateAge(dob, minAge = 18) {
  if (!dob) return 'Date of birth is required'
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return 'Enter a valid date'
  if (d > new Date()) return 'Date cannot be in the future'
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1
  if (age < minAge) return `You must be at least ${minAge} years old`
  if (age > 120) return 'Enter a valid date of birth'
  return ''
}

export function validatePostalCode(code, country) {
  const v = String(code || '').trim()
  if (!v) return 'Postal code is required'
  const c = String(country || '').toUpperCase()
  if (c === 'US' || c === 'USA') {
    if (!/^\d{5}(-\d{4})?$/.test(v)) return 'Use a valid US ZIP (e.g. 10001 or 10001-1234)'
  } else if (c === 'CA' || c === 'CAN') {
    if (!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v)) {
      return 'Use a valid Canadian postal code (e.g. K1A 0B1)'
    }
  } else if (c === 'GB' || c === 'UK') {
    if (v.length < 5 || v.length > 10) return 'Enter a valid UK postcode'
  } else if (v.length < 3 || v.length > 12) {
    return 'Enter a valid postal code'
  }
  return ''
}

export function validateSsn(ssn) {
  const d = String(ssn || '').replace(/\D/g, '')
  if (!d) return 'SSN is required'
  if (d.length !== 9) return 'SSN must be exactly 9 digits'
  if (/^(\d)\1{8}$/.test(d)) return 'Enter a valid SSN'
  // Area number rules
  if (d.startsWith('000') || d.startsWith('666') || /^9/.test(d)) return 'Enter a valid SSN'
  // Group number cannot be 00
  if (d.slice(3, 5) === '00') return 'Enter a valid SSN'
  // Serial cannot be 0000
  if (d.slice(5) === '0000') return 'Enter a valid SSN'
  return ''
}

export function validateSin(sin) {
  const d = String(sin || '').replace(/\D/g, '')
  if (!d) return 'SIN is required'
  if (d.length !== 9) return 'SIN must be exactly 9 digits'
  if (/^(\d)\1{8}$/.test(d)) return 'Enter a valid SIN'
  if (d.startsWith('0') || d.startsWith('8')) return 'Enter a valid SIN'
  // Canadian SIN Luhn check
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let n = parseInt(d[i], 10)
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  if (sum % 10 !== 0) return 'Enter a valid SIN (check digit failed)'
  return ''
}

/** UK National Insurance number */
export function validateNino(value) {
  const v = String(value || '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
  if (!v) return 'National Insurance number is required'
  // Prefix rules: not D,F,I,Q,U,V first; second not D,F,I,O,Q,U,V; not BG/GB/KN/NK/NT/TN/ZZ
  if (!/^[A-CEGHJ-PR-TW-Z]{1}[A-CEGHJ-NPR-TW-Z]{1}\d{6}[A-D]{1}$/.test(v)) {
    return 'Enter a valid UK NI number (e.g. QQ123456C)'
  }
  const prefix = v.slice(0, 2)
  if (['BG', 'GB', 'KN', 'NK', 'NT', 'TN', 'ZZ'].includes(prefix)) {
    return 'Enter a valid UK NI number'
  }
  return ''
}

export function validatePps(value) {
  const v = String(value || '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
  if (!v) return 'PPS number is required'
  if (!/^\d{7}[A-W][A-I]?$/.test(v)) return 'Enter a valid PPS number (7 digits + letter)'
  return ''
}

export function validateSteuerId(value) {
  const d = String(value || '').replace(/\D/g, '')
  if (!d) return 'Tax ID is required'
  if (d.length !== 11) return 'German tax ID must be 11 digits'
  if (/^(\d)\1{10}$/.test(d)) return 'Enter a valid tax ID'
  return ''
}

export function validateNir(value) {
  const d = String(value || '').replace(/\D/g, '')
  if (!d) return 'Social security number is required'
  if (d.length !== 13 && d.length !== 15) {
    return 'French NIR must be 13 or 15 digits'
  }
  if (!/^[1278]/.test(d)) return 'Enter a valid NIR (must start with 1, 2, 7, or 8)'
  return ''
}

export function validateBsn(value) {
  const d = String(value || '').replace(/\D/g, '')
  if (!d) return 'BSN is required'
  if (d.length !== 9) return 'BSN must be 9 digits'
  // 11-proef
  let sum = 0
  for (let i = 0; i < 8; i++) sum += parseInt(d[i], 10) * (9 - i)
  sum -= parseInt(d[8], 10)
  if (sum % 11 !== 0) return 'Enter a valid BSN'
  return ''
}

export function validateNieNif(value) {
  const v = String(value || '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
  if (!v) return 'NIE/NIF is required'
  // NIF: 8 digits + letter, NIE: X/Y/Z + 7 digits + letter
  if (!/^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z])$/.test(v)) {
    return 'Enter a valid Spanish NIF or NIE'
  }
  return ''
}

export function validateCodiceFiscale(value) {
  const v = String(value || '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
  if (!v) return 'Codice fiscale is required'
  if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(v)) {
    return 'Enter a valid codice fiscale (16 characters)'
  }
  return ''
}

export function validateTfn(value) {
  const d = String(value || '').replace(/\D/g, '')
  if (!d) return 'TFN is required'
  if (d.length !== 8 && d.length !== 9) return 'TFN must be 8 or 9 digits'
  return ''
}

export function validatePan(value) {
  const v = String(value || '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
  if (!v) return 'PAN is required'
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(v)) return 'Enter a valid PAN (e.g. ABCDE1234F)'
  return ''
}

export function validateNationalId(value, { required = true, label = 'National ID' } = {}) {
  const v = String(value || '').trim()
  if (!v) return required ? `${label} is required` : ''
  if (v.length < 5) return `${label} looks too short`
  if (v.length > 24) return `${label} looks too long`
  return ''
}

export function normalizeTaxInput(value, profile) {
  const raw = String(value || '')
  if (profile?.digitsOnly) {
    return raw.replace(/\D/g, '').slice(0, profile.maxLength || 20)
  }
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, profile?.maxLength || 20)
}

export function taxDigitsComparable(value, profile) {
  if (profile?.digitsOnly) return String(value || '').replace(/\D/g, '')
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

export function validatePersonal(form) {
  const e = {}
  if (!form.firstName?.trim()) e.firstName = 'First name is required'
  else if (!NAME_RE.test(form.firstName.trim())) e.firstName = 'Use letters only'
  if (form.middleName?.trim() && !NAME_RE.test(form.middleName.trim())) {
    e.middleName = 'Use letters only'
  }
  if (!form.lastName?.trim()) e.lastName = 'Last name is required'
  else if (!NAME_RE.test(form.lastName.trim())) e.lastName = 'Use letters only'
  const dobErr = validateAge(form.dateOfBirth)
  if (dobErr) e.dateOfBirth = dobErr
  if (!form.gender) e.gender = 'Select gender'
  if (!form.nationality?.trim()) e.nationality = 'Nationality is required'
  if (!form.countryOfResidence?.trim()) e.countryOfResidence = 'Country of residence is required'
  return e
}

export function validateAddress(form) {
  const e = {}
  if (!form.street?.trim() || form.street.trim().length < 3) e.street = 'Street address is required'
  if (!form.city?.trim()) e.city = 'City is required'
  if (!form.state?.trim()) e.state = 'State / province is required'
  const pc = validatePostalCode(form.postalCode, form.countryOfResidence)
  if (pc) e.postalCode = pc
  return e
}

export function validateContact(form) {
  const e = {}
  if (!form.email?.trim()) e.email = 'Email is required'
  else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email'
  if (!form.phone?.trim()) e.phone = 'Phone number is required'
  else if (!form.phone.startsWith('+')) e.phone = 'Include country code'
  else {
    try {
      if (!isValidPhoneNumber(form.phone)) e.phone = 'Enter a valid phone number'
    } catch {
      const digits = form.phone.replace(/\D/g, '')
      if (digits.length < 8 || digits.length > 15) e.phone = 'Enter a valid phone number'
    }
  }
  return e
}

/** Identity number step (SIN / SSN / country national ID) */
export function validateSinStep(form) {
  const e = {}
  const profile = getIdentityProfile(form.countryOfResidence || form.nationality)
  const label = profile.shortLabel || profile.taxLabel
  const a = taxDigitsComparable(form.taxId, profile)
  const b = taxDigitsComparable(form.taxIdConfirm, profile)

  let err = ''
  switch (profile.taxKey) {
    case 'ssn':
      err = validateSsn(form.taxId)
      break
    case 'sin':
      err = validateSin(form.taxId)
      break
    case 'nino':
      err = validateNino(form.taxId)
      break
    case 'pps':
      err = validatePps(form.taxId)
      break
    case 'steuer_id':
      err = validateSteuerId(form.taxId)
      break
    case 'nir':
      err = validateNir(form.taxId)
      break
    case 'bsn':
      err = validateBsn(form.taxId)
      break
    case 'nie_nif':
      err = validateNieNif(form.taxId)
      break
    case 'codice_fiscale':
      err = validateCodiceFiscale(form.taxId)
      break
    case 'tfn':
      err = validateTfn(form.taxId)
      break
    case 'pan':
      err = validatePan(form.taxId)
      break
    default:
      err = validateNationalId(form.taxId, {
        required: profile.required !== false,
        label
      })
  }
  if (err) e.taxId = err

  if (profile.confirmRequired !== false) {
    if (!b) e.taxIdConfirm = `Confirm your ${label}`
    else if (a !== b) e.taxIdConfirm = `${label} confirmation does not match`
  }
  return e
}

/** @deprecated use validateSinStep */
export function validateIdentity(form) {
  return validateSinStep(form)
}

export function validateGovId({ frontFile, backFile, existing }) {
  const e = {}
  if (!(frontFile || existing?.front)) e.front = 'Front of ID is required'
  if (!(backFile || existing?.back)) e.back = 'Back of ID is required'
  return e
}

export function validateResidencyChoice(form) {
  const e = {}
  if (!form.residencyType) e.residencyType = 'Select PR card or passport'
  return e
}

export function validateResidencyPhoto({ passportFile, existing }) {
  const e = {}
  if (!(passportFile || existing?.passport)) e.passport = 'Photograph your PR card or passport'
  return e
}

export function validateSelfie({ selfieFile, existing }) {
  const e = {}
  if (!(selfieFile || existing?.selfie)) e.selfie = 'Selfie is required'
  return e
}

export function validateDocuments({ documentType, frontFile, backFile, selfieFile, existing, passportFile }) {
  const e = {
    ...validateGovId({ frontFile, backFile, existing }),
    ...validateSelfie({ selfieFile, existing })
  }
  if (!documentType) e.documentType = 'Select document type'
  if (!(passportFile || existing?.passport)) e.passport = 'Residency document is required'
  return e
}

export function validateProof({ file, existing }) {
  const e = {}
  if (!file && !existing) e.file = 'Upload a proof of address document'
  return e
}

export function isAllowedFile(file, { imagesOnly = false } = {}) {
  if (!file) return false
  const mime = String(file.type || '').toLowerCase()
  const ext = String(file.name || '').toLowerCase().split('.').pop()
  const imageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
  const docMimes = [...imageMimes, 'application/pdf']
  const imageExt = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'jfif']
  const docExt = [...imageExt, 'pdf']
  if (imagesOnly) return imageMimes.includes(mime) || imageExt.includes(ext)
  return docMimes.includes(mime) || docExt.includes(ext)
}

/** Display formatting by country profile */
export function formatTaxId(value, profile) {
  const key = profile?.taxKey || 'ssn'
  if (key === 'ssn') {
    const d = String(value || '').replace(/\D/g, '').slice(0, 9)
    if (d.length <= 3) return d
    if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
  }
  if (key === 'sin') {
    const d = String(value || '').replace(/\D/g, '').slice(0, 9)
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  }
  if (key === 'nino') {
    const v = String(value || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 9)
    // QQ 12 34 56 C
    const parts = []
    if (v.length > 0) parts.push(v.slice(0, 2))
    if (v.length > 2) parts.push(v.slice(2, 4))
    if (v.length > 4) parts.push(v.slice(4, 6))
    if (v.length > 6) parts.push(v.slice(6, 8))
    if (v.length > 8) parts.push(v.slice(8, 9))
    return parts.join(' ')
  }
  if (key === 'steuer_id' || key === 'tfn') {
    const d = String(value || '').replace(/\D/g, '').slice(0, profile?.maxLength || 11)
    return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
  }
  if (key === 'nir') {
    const d = String(value || '').replace(/\D/g, '').slice(0, 15)
    return d
  }
  // Alphanumeric IDs: show uppercased compact
  if (profile && !profile.digitsOnly) {
    return String(value || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, profile.maxLength || 20)
  }
  return String(value || '').replace(/\D/g, '').slice(0, profile?.maxLength || 20)
}

export function maskTaxIdForReview(value, profile) {
  const formatted = formatTaxId(value, profile)
  if (!formatted) return '—'
  const clean = String(formatted).replace(/\s/g, '')
  if (clean.length <= 4) return '••••'
  return `${'•'.repeat(Math.min(clean.length - 4, 8))}${clean.slice(-4)}`
}
