import { kycError, kycHint, kycInput, kycLabel, kycSelect } from '../styles/kycUi'

export function KycField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className = ''
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className={kycLabel}>
          {label}
          {required ? <span className="text-teal-500 ml-0.5">*</span> : null}
        </label>
      )}
      {children}
      {error ? (
        <p className={kycError} role="alert">
          <span aria-hidden>⚠</span> {error}
        </p>
      ) : hint ? (
        <p className={kycHint}>{hint}</p>
      ) : null}
    </div>
  )
}

export function KycTextInput({
  id,
  label,
  error,
  hint,
  required,
  className = '',
  ...props
}) {
  return (
    <KycField label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <input
        id={id}
        className={`${kycInput} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        {...props}
      />
    </KycField>
  )
}

export function KycSelect({
  id,
  label,
  error,
  hint,
  required,
  children,
  className = '',
  ...props
}) {
  return (
    <KycField label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <select
        id={id}
        className={`${kycSelect} ${error ? 'border-red-400' : ''} ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
    </KycField>
  )
}
