import { COUNTRY_OPTIONS, GENDER_OPTIONS, getIdentityProfile } from '../../config/steps'
import { maskTaxIdForReview } from '../../validation/kycValidation'
import { kycCard } from '../../styles/kycUi'

function countryName(code) {
  return COUNTRY_OPTIONS.find((c) => c.code === code)?.name || code || '—'
}

function genderLabel(v) {
  return GENDER_OPTIONS.find((g) => g.value === v)?.label || v || '—'
}

function ReviewCard({ title, step, onEdit, incomplete, children }) {
  return (
    <section
      className={`${kycCard} p-4 sm:p-5 ${
        incomplete ? 'ring-1 ring-amber-400/60 border-amber-300 dark:border-amber-700' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          {incomplete ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Incomplete — please edit</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline shrink-0"
        >
          Edit
        </button>
      </div>
      <dl className="space-y-2 text-sm">{children}</dl>
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500 dark:text-slate-400 shrink-0">{label}</dt>
      <dd className="text-right font-medium text-slate-800 dark:text-slate-100 break-words">
        {value || '—'}
      </dd>
    </div>
  )
}

export default function StepReview({ form, files, existing, onEdit }) {
  const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ')
  const streetLine = [form.street, form.apartment].filter(Boolean).join(', ')
  const hasFront = files.front || existing.front
  const hasSelfie = files.selfie || existing.selfie
  const hasPoa = files.proof || existing.proof
  const idProfile = getIdentityProfile(form.countryOfResidence || form.nationality)

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Confirm everything looks correct. You can edit any section before submitting.
      </p>

      <ReviewCard title="Personal information" step={2} onEdit={onEdit} incomplete={!fullName || !form.dateOfBirth}>
        <Row label="Name" value={fullName} />
        <Row label="Date of birth" value={form.dateOfBirth} />
        <Row label="Gender" value={genderLabel(form.gender)} />
        <Row label="Nationality" value={countryName(form.nationality)} />
        <Row label="Residence" value={countryName(form.countryOfResidence)} />
        <Row label="Email" value={form.email} />
        <Row label="Phone" value={form.phone} />
      </ReviewCard>

      <ReviewCard title="Address" step={3} onEdit={onEdit} incomplete={!form.street || !form.city}>
        <Row label="Street" value={streetLine} />
        <Row label="City" value={form.city} />
        <Row label="State" value={form.state} />
        <Row label="Postal" value={form.postalCode} />
      </ReviewCard>

      <ReviewCard
        title={idProfile.taxLabel}
        step={4}
        onEdit={onEdit}
        incomplete={idProfile.required !== false && !form.taxId}
      >
        <Row label="Country" value={idProfile.countryName} />
        <Row
          label={idProfile.shortLabel}
          value={form.taxId ? maskTaxIdForReview(form.taxId, idProfile) : '—'}
        />
      </ReviewCard>

      <ReviewCard
        title="Documents"
        step={5}
        onEdit={onEdit}
        incomplete={!hasFront || !hasSelfie}
      >
        <Row label="Photo ID" value={hasFront ? 'Captured' : 'Missing'} />
        <Row label="ID back" value={files.back || existing.back ? 'Captured' : '—'} />
        <Row
          label="Residency"
          value={
            files.passport || existing.passport
              ? form.residencyType?.replace(/_/g, ' ') || 'Captured'
              : 'Missing'
          }
        />
        <Row label="Selfie" value={hasSelfie ? 'Captured' : 'Missing'} />
      </ReviewCard>

      <ReviewCard title="Proof of address" step={9} onEdit={onEdit} incomplete={!hasPoa}>
        <Row label="Type" value={form.poaType?.replace(/_/g, ' ')} />
        <Row label="File" value={hasPoa ? 'Ready' : 'Missing'} />
      </ReviewCard>

      <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        By submitting, you confirm the information is accurate and you authorize us to verify your
        identity for compliance purposes.
      </div>
    </div>
  )
}
