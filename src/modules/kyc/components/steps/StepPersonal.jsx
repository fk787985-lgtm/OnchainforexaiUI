import PhoneInput from '../../../../components/PhoneInput'
import { COUNTRY_OPTIONS, GENDER_OPTIONS } from '../../config/steps'
import { KycField, KycSelect, KycTextInput } from '../KycField'
import KycSection from '../KycSection'
import KycDatePicker from '../KycDatePicker'

export default function StepPersonal({ form, errors, onChange, touched }) {
  const show = (key) => touched[key] || errors[key]

  return (
    <div className="space-y-4">
      <KycSection title="Legal name">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <KycTextInput
            id="firstName"
            label="First name"
            required
            autoComplete="given-name"
            value={form.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            error={show('firstName') ? errors.firstName : ''}
            placeholder="Jane"
          />
          <KycTextInput
            id="middleName"
            label="Middle name"
            autoComplete="additional-name"
            value={form.middleName}
            onChange={(e) => onChange('middleName', e.target.value)}
            error={show('middleName') ? errors.middleName : ''}
            placeholder="Optional"
            hint="Optional"
          />
        </div>
        <KycTextInput
          id="lastName"
          label="Last name"
          required
          autoComplete="family-name"
          value={form.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          error={show('lastName') ? errors.lastName : ''}
          placeholder="Doe"
        />
      </KycSection>

      <KycSection title="Demographics">
        <KycDatePicker
          id="dateOfBirth"
          label="Date of birth"
          required
          value={form.dateOfBirth}
          onChange={(iso) => onChange('dateOfBirth', iso)}
          error={show('dateOfBirth') ? errors.dateOfBirth : ''}
          hint="Select day, month, and year · must be 18+"
        />
        <KycSelect
          id="gender"
          label="Gender"
          required
          value={form.gender}
          onChange={(e) => onChange('gender', e.target.value)}
          error={show('gender') ? errors.gender : ''}
        >
          <option value="">Select</option>
          {GENDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </KycSelect>
        <KycSelect
          id="nationality"
          label="Nationality"
          required
          value={form.nationality}
          onChange={(e) => onChange('nationality', e.target.value)}
          error={show('nationality') ? errors.nationality : ''}
        >
          <option value="">Select country</option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </KycSelect>
        <KycSelect
          id="countryOfResidence"
          label="Country of residence"
          required
          value={form.countryOfResidence}
          onChange={(e) => onChange('countryOfResidence', e.target.value)}
          error={show('countryOfResidence') ? errors.countryOfResidence : ''}
        >
          <option value="">Select country</option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </KycSelect>
      </KycSection>

      <KycSection title="Contact details">
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1 mb-1">
          How we reach you about verification and account security.
        </p>
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
          hint="Include country code"
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
