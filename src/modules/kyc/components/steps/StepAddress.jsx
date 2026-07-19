import { KycTextInput } from '../KycField'
import KycSection from '../KycSection'

export default function StepAddress({ form, errors, onChange, touched }) {
  const show = (key) => touched[key] || errors[key]

  return (
    <div className="space-y-4">
      <KycSection title="Residential address">
        <KycTextInput
          id="street"
          label="Street address"
          required
          autoComplete="street-address"
          value={form.street}
          onChange={(e) => onChange('street', e.target.value)}
          error={show('street') ? errors.street : ''}
          placeholder="123 Main Street"
        />
        <KycTextInput
          id="apartment"
          label="Apartment / suite"
          autoComplete="address-line2"
          value={form.apartment}
          onChange={(e) => onChange('apartment', e.target.value)}
          placeholder="Apt 4B (optional)"
          hint="Optional"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <KycTextInput
            id="city"
            label="City"
            required
            autoComplete="address-level2"
            value={form.city}
            onChange={(e) => onChange('city', e.target.value)}
            error={show('city') ? errors.city : ''}
            placeholder="New York"
          />
          <KycTextInput
            id="state"
            label="State / province"
            required
            autoComplete="address-level1"
            value={form.state}
            onChange={(e) => onChange('state', e.target.value)}
            error={show('state') ? errors.state : ''}
            placeholder="NY"
          />
        </div>
        <KycTextInput
          id="postalCode"
          label="Postal code"
          required
          autoComplete="postal-code"
          value={form.postalCode}
          onChange={(e) => onChange('postalCode', e.target.value)}
          error={show('postalCode') ? errors.postalCode : ''}
          placeholder={
            form.countryOfResidence === 'US'
              ? '10001'
              : form.countryOfResidence === 'CA'
                ? 'K1A 0B1'
                : 'Postal code'
          }
        />
      </KycSection>
      <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
        Use the address on your government ID or recent utility bill. This must match your proof of
        address document.
      </p>
    </div>
  )
}
