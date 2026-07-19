import { useEffect, useMemo, useState } from 'react'
import { KycField } from './KycField'
import { kycSelect } from '../styles/kycUi'

const MONTHS = [
  { v: '01', l: 'January' },
  { v: '02', l: 'February' },
  { v: '03', l: 'March' },
  { v: '04', l: 'April' },
  { v: '05', l: 'May' },
  { v: '06', l: 'June' },
  { v: '07', l: 'July' },
  { v: '08', l: 'August' },
  { v: '09', l: 'September' },
  { v: '10', l: 'October' },
  { v: '11', l: 'November' },
  { v: '12', l: 'December' }
]

function daysInMonth(year, month) {
  const y = parseInt(year, 10)
  const m = parseInt(month, 10)
  if (!y || !m) return 31
  return new Date(y, m, 0).getDate()
}

function parseIso(value) {
  if (!value || typeof value !== 'string') return { y: '', m: '', d: '' }
  // Accept YYYY-MM-DD or ISO datetime
  const datePart = value.includes('T') ? value.split('T')[0] : value
  const [y, m, d] = datePart.split('-')
  if (!y || y.length !== 4) return { y: '', m: '', d: '' }
  return {
    y: y || '',
    m: m ? String(m).padStart(2, '0') : '',
    d: d ? String(d).padStart(2, '0') : ''
  }
}

function toIso(y, m, d) {
  if (!y || !m || !d) return ''
  const max = daysInMonth(y, m)
  let day = parseInt(d, 10)
  if (Number.isNaN(day) || day < 1) return ''
  if (day > max) day = max
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Day / Month / Year selects with local state so partial picks always stick.
 * Parent only receives a full YYYY-MM-DD when all three are set.
 */
export default function KycDatePicker({
  id = 'dateOfBirth',
  label = 'Date of birth',
  value,
  onChange,
  error,
  hint = 'You must be at least 18 years old',
  required = true,
  minAge = 18,
  maxAge = 100
}) {
  const now = new Date()
  const maxYear = now.getFullYear() - minAge
  const minYear = now.getFullYear() - maxAge

  const parsed = parseIso(value)
  const [y, setY] = useState(parsed.y)
  const [m, setM] = useState(parsed.m)
  const [d, setD] = useState(parsed.d)

  // Sync from parent when value changes externally (e.g. draft load)
  useEffect(() => {
    const next = parseIso(value)
    setY(next.y)
    setM(next.m)
    setD(next.d)
  }, [value])

  const years = useMemo(() => {
    const list = []
    for (let yr = maxYear; yr >= minYear; yr--) list.push(String(yr))
    return list
  }, [maxYear, minYear])

  const maxDay = daysInMonth(y, m)
  const days = useMemo(() => {
    const list = []
    for (let i = 1; i <= maxDay; i++) list.push(String(i).padStart(2, '0'))
    return list
  }, [maxDay])

  const push = (ny, nm, nd) => {
    let day = nd
    const max = daysInMonth(ny, nm)
    if (day && parseInt(day, 10) > max) {
      day = String(max).padStart(2, '0')
    }
    setY(ny)
    setM(nm)
    setD(day)
    // Only notify parent with complete date (or clear when incomplete after full clear)
    const iso = toIso(ny, nm, day)
    if (iso) {
      onChange?.(iso)
    } else if (!ny && !nm && !day) {
      onChange?.('')
    }
    // Partial selection: keep local UI state without wiping parent mid-entry
  }

  const selClass = `${kycSelect} !min-h-[48px] !text-sm tabular-nums cursor-pointer appearance-auto ${
    error ? 'border-red-400' : ''
  }`

  return (
    <KycField label={label} htmlFor={`${id}-day`} error={error} hint={hint} required={required}>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 relative z-10">
        <div>
          <label htmlFor={`${id}-day`} className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1 block">
            Day
          </label>
          <select
            id={`${id}-day`}
            className={selClass}
            value={d}
            onChange={(e) => push(y, m, e.target.value)}
            aria-label="Day of birth"
          >
            <option value="">DD</option>
            {days.map((day) => (
              <option key={day} value={day}>
                {parseInt(day, 10)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-month`} className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1 block">
            Month
          </label>
          <select
            id={`${id}-month`}
            className={selClass}
            value={m}
            onChange={(e) => push(y, e.target.value, d)}
            aria-label="Month of birth"
          >
            <option value="">MM</option>
            {MONTHS.map((mo) => (
              <option key={mo.v} value={mo.v}>
                {mo.l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-year`} className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1 block">
            Year
          </label>
          <select
            id={`${id}-year`}
            className={selClass}
            value={y}
            onChange={(e) => push(e.target.value, m, d)}
            aria-label="Year of birth"
          >
            <option value="">YYYY</option>
            {years.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>
      {y && m && d ? (
        <p className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-medium tabular-nums">
          Selected: {d}/{m}/{y}
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-400">Pick day, month, and year</p>
      )}
    </KycField>
  )
}
