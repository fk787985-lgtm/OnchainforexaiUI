import PhoneInput from '../../../../components/PhoneInput'
import { KycField, KycTextInput } from '../KycField'
import KycSection from '../KycSection'

export default function StepContact({ form, errors, onChange, touched }) {
  const show = (key) => touched[key] || errors[key]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Confirm the contact details from your personal information. These are used for security alerts and KYC status updates.
      </div>
      <KycSection title="Confirm contact">
        <KycTextInput
          id="email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => onChange('email', e.target.value)}
          error={show('email') ? errors.email : ''}
          placeholder="you@example.com"
          hint="Verification updates are sent here"
        />
        <KycField
          label="Phone number"
          htmlFor="phone"
          required
          error={show('phone') ? errors.phone : ''}
          hint="Include country code · account security"
        >
          <PhoneInput
            name="phone"
            value={form.phone}
            onChange={(e) => onChange('phone', e.target?.value ?? '')}
            error={show('phone') ? errors.phone : ''}
            required
          />
        </KycField>
      </KycSection>
    </div>
  )
}
