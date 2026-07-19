/** KYC flow — Background Search style identity capture */

export const KYC_STEPS = [
  { id: 'welcome', number: 1, label: 'Welcome', short: 'Start' },
  { id: 'personal', number: 2, label: 'Personal', short: 'Personal' },
  { id: 'address', number: 3, label: 'Address', short: 'Address' },
  { id: 'sin', number: 4, label: 'Identity number', short: 'ID #' },
  { id: 'gov_id', number: 5, label: 'Photo ID', short: 'ID' },
  { id: 'residency_choice', number: 6, label: 'PR or Passport', short: 'Residency' },
  { id: 'residency_photo', number: 7, label: 'Residency photo', short: 'Doc' },
  { id: 'selfie', number: 8, label: 'Selfie', short: 'Selfie' },
  { id: 'proof', number: 9, label: 'Proof of address', short: 'Proof' },
  { id: 'review', number: 10, label: 'Review', short: 'Review' },
  { id: 'submitted', number: 11, label: 'Submitted', short: 'Done' }
]

export const KYC_DRAFT_KEY = 'kyc_premium_draft_v3'
export const KYC_TOTAL_STEPS = 11
export const KYC_LAST_FORM_STEP = 10

/** Camera-only full-screen steps */
export function isCameraStep(step) {
  return [5, 7, 8].includes(Number(step))
}

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
]

export const COUNTRY_OPTIONS = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'IN', name: 'India' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'OTHER', name: 'Other' }
]

/** Normalize free-text or ISO country codes for identity profile lookup */
export function normalizeCountryCode(country) {
  const raw = String(country || '').trim()
  if (!raw) return ''
  const upper = raw.toUpperCase()
  const map = {
    USA: 'US',
    'UNITED STATES': 'US',
    'UNITED STATES OF AMERICA': 'US',
    CAN: 'CA',
    CANADA: 'CA',
    UK: 'GB',
    'UNITED KINGDOM': 'GB',
    'GREAT BRITAIN': 'GB',
    ENGLAND: 'GB',
    DEU: 'DE',
    GERMANY: 'DE',
    FRA: 'FR',
    FRANCE: 'FR',
    NLD: 'NL',
    NETHERLANDS: 'NL',
    HOLLAND: 'NL',
    ESP: 'ES',
    SPAIN: 'ES',
    ITA: 'IT',
    ITALY: 'IT',
    IRL: 'IE',
    IRELAND: 'IE',
    AUS: 'AU',
    AUSTRALIA: 'AU',
    BEL: 'BE',
    BELGIUM: 'BE',
    PRT: 'PT',
    PORTUGAL: 'PT',
    SWE: 'SE',
    SWEDEN: 'SE',
    NOR: 'NO',
    NORWAY: 'NO',
    DNK: 'DK',
    DENMARK: 'DK',
    FIN: 'FI',
    FINLAND: 'FI',
    POL: 'PL',
    POLAND: 'PL',
    AUT: 'AT',
    AUSTRIA: 'AT',
    CHE: 'CH',
    SWITZERLAND: 'CH',
    IND: 'IN',
    INDIA: 'IN',
    BRA: 'BR',
    BRAZIL: 'BR',
    MEX: 'MX',
    MEXICO: 'MX'
  }
  if (map[upper]) return map[upper]
  if (/^[A-Z]{2}$/.test(upper)) return upper
  const byName = COUNTRY_OPTIONS.find((c) => c.name.toUpperCase() === upper)
  return byName?.code || upper
}

export const POA_TYPES = [
  { value: 'utility_bill', label: 'Utility bill', desc: 'Electricity, water, gas, or internet' },
  { value: 'bank_statement', label: 'Bank statement', desc: 'Recent statement with your address' },
  { value: 'government_letter', label: 'Government letter', desc: 'Official correspondence' }
]

/** Passport first, PR listed under it — same for all countries */
export const RESIDENCY_OPTIONS = [
  {
    value: 'passport',
    label: 'Passport',
    text: 'Photograph your passport bio / photo page.'
  },
  {
    value: 'permanent_resident_card',
    label: 'Permanent Resident (PR) Card',
    text: 'Photograph your permanent resident card (front).'
  }
]

/**
 * Country-aware identity number (SIN / SSN / EU national IDs).
 * Prefer country of residence for tax/social ID type.
 */
export function getIdentityProfile(countryCode) {
  const c = normalizeCountryCode(countryCode)

  if (c === 'US') {
    return {
      region: 'US',
      taxKey: 'ssn',
      shortLabel: 'SSN',
      taxLabel: 'Social Security Number (SSN)',
      taxHint: '',
      placeholder: 'XXX-XX-XXXX',
      maxLength: 9,
      digitsOnly: true,
      required: true,
      confirmRequired: true,
      govIdType: 'drivers_license',
      govIdLabel: "Driver's license or state ID",
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: 'United States'
    }
  }

  if (c === 'CA') {
    return {
      region: 'CA',
      taxKey: 'sin',
      shortLabel: 'SIN',
      taxLabel: 'Social Insurance Number (SIN)',
      taxHint: '',
      placeholder: 'XXX-XXX-XXX',
      maxLength: 9,
      digitsOnly: true,
      required: true,
      confirmRequired: true,
      govIdType: 'drivers_license',
      govIdLabel: "Driver's license or government ID",
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: 'Canada'
    }
  }

  if (c === 'GB') {
    return {
      region: 'GB',
      taxKey: 'nino',
      shortLabel: 'NI number',
      taxLabel: 'National Insurance number (NINO)',
      taxHint: '',
      placeholder: 'QQ 12 34 56 C',
      maxLength: 9,
      digitsOnly: false,
      required: true,
      confirmRequired: true,
      govIdType: 'national_id',
      govIdLabel: 'Passport or driving licence',
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: 'United Kingdom'
    }
  }

  if (c === 'IE') {
    return {
      region: 'IE',
      taxKey: 'pps',
      shortLabel: 'PPS',
      taxLabel: 'Personal Public Service (PPS) number',
      taxHint: '',
      placeholder: '1234567T',
      maxLength: 9,
      digitsOnly: false,
      required: true,
      confirmRequired: true,
      govIdType: 'national_id',
      govIdLabel: 'Passport or driving licence',
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: 'Ireland'
    }
  }

  if (c === 'DE') {
    return {
      region: 'DE',
      taxKey: 'steuer_id',
      shortLabel: 'Tax ID',
      taxLabel: 'Steueridentifikationsnummer (Tax ID)',
      taxHint: '',
      placeholder: '12 345 678 901',
      maxLength: 11,
      digitsOnly: true,
      required: true,
      confirmRequired: true,
      govIdType: 'national_id',
      govIdLabel: 'Personalausweis or passport',
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: 'Germany'
    }
  }

  if (c === 'FR') {
    return {
      region: 'FR',
      taxKey: 'nir',
      shortLabel: 'NIR',
      taxLabel: 'Numéro de sécurité sociale (NIR)',
      taxHint: '',
      placeholder: '1 85 05 78 006 084 36',
      maxLength: 15,
      digitsOnly: true,
      required: true,
      confirmRequired: true,
      govIdType: 'national_id',
      govIdLabel: "Carte d'identité or passport",
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: 'France'
    }
  }

  if (c === 'NL') {
    return {
      region: 'NL',
      taxKey: 'bsn',
      shortLabel: 'BSN',
      taxLabel: 'Burgerservicenummer (BSN)',
      taxHint: '',
      placeholder: '123456789',
      maxLength: 9,
      digitsOnly: true,
      required: true,
      confirmRequired: true,
      govIdType: 'national_id',
      govIdLabel: 'ID card or passport',
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: 'Netherlands'
    }
  }

  if (c === 'ES') {
    return {
      region: 'ES',
      taxKey: 'nie_nif',
      shortLabel: 'NIE/NIF',
      taxLabel: 'NIE or NIF number',
      taxHint: '',
      placeholder: 'X1234567L',
      maxLength: 12,
      digitsOnly: false,
      required: true,
      confirmRequired: true,
      govIdType: 'national_id',
      govIdLabel: 'DNI, NIE card, or passport',
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: 'Spain'
    }
  }

  if (c === 'IT') {
    return {
      region: 'IT',
      taxKey: 'codice_fiscale',
      shortLabel: 'Codice fiscale',
      taxLabel: 'Codice fiscale',
      taxHint: '',
      placeholder: 'RSSMRA85T10A562S',
      maxLength: 16,
      digitsOnly: false,
      required: true,
      confirmRequired: true,
      govIdType: 'national_id',
      govIdLabel: "Carta d'identità or passport",
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: 'Italy'
    }
  }

  if (c === 'AU') {
    return {
      region: 'AU',
      taxKey: 'tfn',
      shortLabel: 'TFN',
      taxLabel: 'Tax File Number (TFN)',
      taxHint: '',
      placeholder: '123 456 789',
      maxLength: 9,
      digitsOnly: true,
      required: true,
      confirmRequired: true,
      govIdType: 'drivers_license',
      govIdLabel: "Driver's licence or passport",
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: 'Australia'
    }
  }

  if (c === 'IN') {
    return {
      region: 'IN',
      taxKey: 'pan',
      shortLabel: 'PAN',
      taxLabel: 'Permanent Account Number (PAN)',
      taxHint: '',
      placeholder: 'ABCDE1234F',
      maxLength: 10,
      digitsOnly: false,
      required: true,
      confirmRequired: true,
      govIdType: 'national_id',
      govIdLabel: 'Aadhaar card or passport',
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: 'India'
    }
  }

  // Other EU / Europe-ish codes with generic national ID
  const euLike = [
    'BE',
    'PT',
    'SE',
    'NO',
    'DK',
    'FI',
    'PL',
    'AT',
    'CH',
    'CZ',
    'RO',
    'HU',
    'GR',
    'LU'
  ]
  if (euLike.includes(c)) {
    const name = COUNTRY_OPTIONS.find((x) => x.code === c)?.name || c
    return {
      region: 'EU',
      taxKey: 'national_id',
      shortLabel: 'National ID',
      taxLabel: `National ID / tax number (${name})`,
      taxHint: '',
      placeholder: 'Your national ID number',
      maxLength: 20,
      digitsOnly: false,
      required: true,
      confirmRequired: true,
      govIdType: 'national_id',
      govIdLabel: 'National ID card or passport',
      residencyOptions: RESIDENCY_OPTIONS,
      countryName: name
    }
  }

  return {
    region: 'OTHER',
    taxKey: 'national_id',
    shortLabel: 'National ID',
    taxLabel: 'National ID / tax number',
    taxHint: '',
    placeholder: 'National ID number',
    maxLength: 20,
    digitsOnly: false,
    required: true,
    confirmRequired: true,
    govIdType: 'national_id',
    govIdLabel: 'Government-issued photo ID',
    residencyOptions: RESIDENCY_OPTIONS,
    countryName: COUNTRY_OPTIONS.find((x) => x.code === c)?.name || 'your country'
  }
}

export function needsBackSide(documentType) {
  return ['drivers_license', 'national_id', 'permanent_resident_card'].includes(documentType)
}

export function emptyKycForm() {
  return {
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    countryOfResidence: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    email: '',
    phone: '',
    taxId: '',
    taxIdConfirm: '',
    governmentIdType: '',
    documentType: '',
    residencyType: '',
    poaType: 'utility_bill'
  }
}
