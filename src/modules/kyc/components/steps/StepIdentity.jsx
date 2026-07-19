import { getIdentityProfile } from '../../config/steps'
import { formatTaxId } from '../../validation/kycValidation'
import { KycTextInput } from '../KycField'
import KycSection from '../KycSection'
import { optionCard } from '../../styles/kycUi'

/** Group docs into primary government ID vs passport / residency */
function groupDocs(docs) {
  const gov = []
  const travel = []
  docs.forEach((d) => {
    if (d.value === 'passport' || d.value === 'permanent_resident_card') travel.push(d)
    else gov.push(d)
  })
  return { gov, travel }
}

export default function StepIdentity({ form, errors, onChange, touched }) {
  const profile = getIdentityProfile(form.countryOfResidence || form.nationality)
  const show = (key) => touched[key] || errors[key]
  const needsTaxConfirm = profile.taxKey === 'ssn' || profile.taxKey === 'sin'
  const { gov, travel } = groupDocs(profile.docs)

  const selectDoc = (value) => {
    onChange('governmentIdType', value)
    onChange('documentType', value)
  }

  const DocButton = ({ doc }) => (
    <button
      key={doc.value}
      type="button"
      onClick={() => selectDoc(doc.value)}
      className={optionCard(form.governmentIdType === doc.value)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-left min-w-0">
          <span className="text-sm font-semibold text-slate-900 dark:text-white block">{doc.label}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Next: take a clear photo with your camera
          </span>
        </div>
        <span
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            form.governmentIdType === doc.value
              ? 'border-[#1199fa] bg-[#1199fa]'
              : 'border-slate-300 dark:border-slate-600'
          }`}
        >
          {form.governmentIdType === doc.value ? (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </span>
      </div>
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
        Fields are tailored for{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {form.countryOfResidence || form.nationality || 'your country'}
        </span>
        . Choose one ID type — you will photograph it next.
      </div>

      {needsTaxConfirm ? (
        <KycSection title={profile.taxLabel}>
          <KycTextInput
            id="taxId"
            label={profile.taxLabel}
            required
            inputMode="numeric"
            autoComplete="off"
            value={formatTaxId(form.taxId)}
            onChange={(e) => onChange('taxId', e.target.value.replace(/\D/g, '').slice(0, 9))}
            error={show('taxId') ? errors.taxId : ''}
            placeholder="XXX-XX-XXXX"
            hint={profile.taxHint}
          />
          <KycTextInput
            id="taxIdConfirm"
            label={`Confirm ${profile.taxKey.toUpperCase()}`}
            required
            inputMode="numeric"
            autoComplete="off"
            value={formatTaxId(form.taxIdConfirm)}
            onChange={(e) =>
              onChange('taxIdConfirm', e.target.value.replace(/\D/g, '').slice(0, 9))
            }
            error={show('taxIdConfirm') ? errors.taxIdConfirm : ''}
            placeholder="Re-enter"
          />
        </KycSection>
      ) : (
        <KycSection title="National ID (optional)">
          <KycTextInput
            id="taxId"
            label={profile.taxLabel}
            value={form.taxId}
            onChange={(e) => onChange('taxId', e.target.value)}
            error={show('taxId') ? errors.taxId : ''}
            hint={profile.taxHint}
            placeholder="Optional"
          />
        </KycSection>
      )}

      {gov.length > 0 && (
        <KycSection title="1 · Driver’s license / government ID">
          <div className="space-y-2">{gov.map((doc) => DocButton({ doc }))}</div>
        </KycSection>
      )}

      {travel.length > 0 && (
        <KycSection title="2 · Passport / permanent resident">
          <div className="space-y-2">{travel.map((doc) => DocButton({ doc }))}</div>
        </KycSection>
      )}

      {show('governmentIdType') && errors.governmentIdType ? (
        <p className="text-xs text-red-500" role="alert">
          {errors.governmentIdType}
        </p>
      ) : null}

      {form.governmentIdType ? (
        <div className="rounded-xl border border-[#1199fa]/25 bg-[#1199fa]/8 px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
          Selected.{' '}
          <span className="font-semibold text-[#0b7dd4] dark:text-sky-300">Continue</span> to open the
          camera and capture your ID, then a quick liveness selfie.
        </div>
      ) : null}
    </div>
  )
}
