export default function KycStepPersonalInfo({ form, onChange, onNext, loading, canProceed }) {
  const checklist = [
    { label: 'Full legal name', done: Boolean(form.fullName?.trim()) },
    { label: 'Date of birth', done: Boolean(form.dateOfBirth) },
    { label: 'Nationality', done: Boolean(form.nationality?.trim()) },
    { label: 'Residential address', done: Boolean(form.address?.trim()) },
    { label: 'Phone number', done: Boolean(form.phoneNumber?.trim()) }
  ]

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onNext()
      }}
      className="space-y-4 animate-fade-in"
    >
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enter details exactly as shown on your official documents.</p>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
        <p className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Step readiness</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checklist.map((item) => (
            <p key={item.label} className={`text-xs ${item.done ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {item.done ? '✓' : '•'} {item.label}
            </p>
          ))}
        </div>
      </div>
      <div>
        <label className="fx-label">Full Name *</label>
        <input
          className="fx-input"
          value={form.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
          placeholder="Enter your legal full name"
          required
        />
      </div>
      <div>
        <label className="fx-label">Date of Birth *</label>
        <input
          type="date"
          className="fx-input"
          value={form.dateOfBirth}
          onChange={(e) => onChange('dateOfBirth', e.target.value)}
          required
        />
      </div>
      <div>
        <label className="fx-label">Nationality *</label>
        <input
          className="fx-input"
          value={form.nationality}
          onChange={(e) => onChange('nationality', e.target.value)}
          placeholder="e.g. United States"
          required
        />
      </div>
      <div>
        <label className="fx-label">Address *</label>
        <input
          className="fx-input"
          value={form.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Street, city, state/province, postal code, country"
          required
        />
      </div>
      <div>
        <label className="fx-label">Phone Number *</label>
        <input
          className="fx-input"
          value={form.phoneNumber}
          onChange={(e) => onChange('phoneNumber', e.target.value)}
          placeholder="+1 000 000 0000"
          required
        />
      </div>
      <button type="submit" disabled={loading || !canProceed} className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60">
        {loading ? 'Saving...' : 'Next'}
      </button>
    </form>
  )
}
