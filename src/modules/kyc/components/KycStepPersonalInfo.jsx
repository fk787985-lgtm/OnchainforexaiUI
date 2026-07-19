export default function KycStepPersonalInfo({ form, onChange, onNext, loading, canProceed }) {
  const checklist = [
    { label: 'Full legal name', done: Boolean(form.fullName?.trim()) },
    { label: 'Date of birth', done: Boolean(form.dateOfBirth) },
    { label: 'Gender', done: Boolean(form.gender) },
    { label: 'Nationality', done: Boolean(form.nationality?.trim()) },
    { label: 'Street address', done: Boolean(form.street?.trim() || form.address?.trim()) },
    { label: 'City', done: Boolean(form.city?.trim()) },
    { label: 'Country', done: Boolean(form.country?.trim()) },
    { label: 'ZIP / Postal', done: Boolean(form.zipCode?.trim()) },
    { label: 'Phone number', done: Boolean(form.phoneNumber?.trim()) }
  ]

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onNext()
      }}
      className="space-y-5 animate-fade-in"
    >
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Use legal details exactly as shown on your identity document.</p>
      </div>
      <div className="rounded-xl border border-cyan-100 dark:border-cyan-800/50 bg-cyan-50/70 dark:bg-cyan-950/20 p-4">
        <p className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Step readiness</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checklist.map((item) => (
            <p key={item.label} className={`text-xs ${item.done ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {item.done ? '✓' : '•'} {item.label}
            </p>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
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
            <label className="fx-label">Gender *</label>
            <select
              className="fx-input"
              value={form.gender || ''}
              onChange={(e) => onChange('gender', e.target.value)}
              required
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
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
            <label className="fx-label">Phone Number *</label>
            <input
              className="fx-input"
              value={form.phoneNumber}
              onChange={(e) => onChange('phoneNumber', e.target.value)}
              placeholder="+1 000 000 0000"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="fx-label">Street Address *</label>
            <input
              className="fx-input"
              value={form.street || form.address || ''}
              onChange={(e) => {
                onChange('street', e.target.value)
                onChange('address', e.target.value)
              }}
              placeholder="Street address"
              required
            />
          </div>
          <div>
            <label className="fx-label">City *</label>
            <input
              className="fx-input"
              value={form.city || ''}
              onChange={(e) => onChange('city', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="fx-label">State / Province</label>
            <input
              className="fx-input"
              value={form.state || ''}
              onChange={(e) => onChange('state', e.target.value)}
            />
          </div>
          <div>
            <label className="fx-label">ZIP / Postal Code *</label>
            <input
              className="fx-input"
              value={form.zipCode || ''}
              onChange={(e) => onChange('zipCode', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="fx-label">Country *</label>
            <input
              className="fx-input"
              value={form.country || ''}
              onChange={(e) => onChange('country', e.target.value)}
              required
            />
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || !canProceed}
        className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60 transition"
      >
        {loading ? 'Saving...' : 'Next'}
      </button>
    </form>
  )
}
