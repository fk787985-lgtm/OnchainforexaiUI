import { getIdentityProfile } from '../../config/steps'
import { optionCard } from '../../styles/kycUi'

/**
 * Choose PR card or Passport — click opens camera on next step immediately
 * (no extra "Take photo" button).
 */
export default function StepResidencyChoice({ form, errors, onChange, touched, onPicked }) {
  const profile = getIdentityProfile(form.countryOfResidence || form.nationality)
  const options = profile.residencyOptions || []
  const showErr = (touched.residencyType || errors.residencyType) && errors.residencyType

  const pick = (value) => {
    onChange('residencyType', value)
    // Keep primary documentType as government ID already chosen
    if (!form.documentType || form.documentType === 'passport' || form.documentType === 'permanent_resident_card') {
      onChange('documentType', form.governmentIdType || profile.govIdType || 'drivers_license')
    }
    // Immediately continue to camera page
    onPicked?.(value)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Tap an option — the camera opens right away so you can photograph that document.
      </div>

      <div className="space-y-2.5">
        {/* Passport first, Permanent Resident listed under it */}
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => pick(opt.value)}
            className={`${optionCard(form.residencyType === opt.value)} !p-5 active:scale-[0.99]`}
          >
            <div className="flex items-center gap-3.5">
              <span className="w-12 h-12 rounded-2xl bg-[#1199fa]/12 text-[#1199fa] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <div className="text-left min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-slate-900 dark:text-white">{opt.label}</p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {opt.text}
                </p>
              </div>
              <span className="shrink-0 text-[#1199fa]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </button>
        ))}
      </div>

      {showErr ? (
        <p className="text-xs text-red-500" role="alert">
          {errors.residencyType}
        </p>
      ) : null}
    </div>
  )
}
