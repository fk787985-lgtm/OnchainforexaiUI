import { useMemo, useState } from 'react'
import { getIdentityProfile } from '../../config/steps'
import {
  formatTaxId,
  normalizeTaxInput
} from '../../validation/kycValidation'
import { kycInput } from '../../styles/kycUi'

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  )
}

function SecureField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  visible,
  onToggle,
  profile,
  matchOk
}) {
  const display = formatTaxId(value, profile)

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
        {label}
        <span className="text-teal-500 ml-0.5">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          inputMode={profile.digitsOnly ? 'numeric' : 'text'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          name={id}
          value={display}
          onChange={(e) => onChange(normalizeTaxInput(e.target.value, profile))}
          placeholder={placeholder}
          className={`${kycInput} !pr-12 !py-3.5 !text-base font-mono tracking-[0.18em] ${
            error
              ? '!border-red-400 focus:!border-red-500 focus:!ring-red-500/20'
              : matchOk
                ? '!border-emerald-400 focus:!border-emerald-500 focus:!ring-emerald-500/15'
                : ''
          }`}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label={visible ? 'Hide' : 'Show'}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Clean country-aware SIN / SSN / national ID entry */
export default function StepSin({ form, errors, onChange, touched }) {
  const country = form.countryOfResidence || form.nationality
  const profile = useMemo(() => getIdentityProfile(country), [country])
  const show = (key) => touched[key] || errors[key]
  const [visible, setVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)

  const matches =
    Boolean(form.taxId) &&
    Boolean(form.taxIdConfirm) &&
    normalizeTaxInput(form.taxId, profile) === normalizeTaxInput(form.taxIdConfirm, profile)

  return (
    <div className="space-y-5">
      {/* Compact header chip */}
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
            {profile.taxLabel}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {profile.countryName}
          </p>
        </div>
        {matches ? (
          <span className="ml-auto shrink-0 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-full">
            ✓ Matched
          </span>
        ) : null}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4 shadow-sm">
        <SecureField
          id="taxId"
          label={profile.shortLabel}
          value={form.taxId}
          onChange={(v) => onChange('taxId', v)}
          error={show('taxId') ? errors.taxId : ''}
          placeholder={profile.placeholder}
          visible={visible}
          onToggle={() => setVisible((v) => !v)}
          profile={profile}
        />

        {profile.confirmRequired !== false && (
          <SecureField
            id="taxIdConfirm"
            label={`Confirm ${profile.shortLabel}`}
            value={form.taxIdConfirm}
            onChange={(v) => onChange('taxIdConfirm', v)}
            error={show('taxIdConfirm') ? errors.taxIdConfirm : ''}
            placeholder={profile.placeholder}
            visible={confirmVisible}
            onToggle={() => setConfirmVisible((v) => !v)}
            profile={profile}
            matchOk={matches}
          />
        )}
      </div>
    </div>
  )
}
