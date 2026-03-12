export default function KycStepPersonalInfo({ form, onChange, onNext, loading }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onNext()
      }}
      className="space-y-4 animate-fade-in"
    >
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
      <button type="submit" disabled={loading} className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60">
        {loading ? 'Saving...' : 'Next'}
      </button>
    </form>
  )
}
