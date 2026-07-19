export default function KycStepIdentityDetails({ form, onChange, onNext, onBack, loading, canProceed }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onNext()
      }}
      className="space-y-5 animate-fade-in"
    >
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Additional Identity Details</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Compliance information required for account verification.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="fx-label">Occupation *</label>
          <input
            className="fx-input"
            value={form.occupation}
            onChange={(e) => onChange('occupation', e.target.value)}
            required
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div>
          <label className="fx-label">Employer</label>
          <input
            className="fx-input"
            value={form.employer}
            onChange={(e) => onChange('employer', e.target.value)}
            placeholder="Company name"
          />
        </div>
        <div>
          <label className="fx-label">Annual income</label>
          <select
            className="fx-input"
            value={form.annualIncome}
            onChange={(e) => onChange('annualIncome', e.target.value)}
          >
            <option value="">Select range</option>
            <option value="under_25k">Under $25,000</option>
            <option value="25k_50k">$25,000 – $50,000</option>
            <option value="50k_100k">$50,000 – $100,000</option>
            <option value="100k_250k">$100,000 – $250,000</option>
            <option value="over_250k">Over $250,000</option>
          </select>
        </div>
        <div>
          <label className="fx-label">Source of funds *</label>
          <select
            className="fx-input"
            value={form.sourceOfFunds}
            onChange={(e) => onChange('sourceOfFunds', e.target.value)}
            required
          >
            <option value="">Select source</option>
            <option value="employment">Employment income</option>
            <option value="business">Business ownership</option>
            <option value="investments">Investments</option>
            <option value="inheritance">Inheritance</option>
            <option value="savings">Savings</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="fx-label">Tax residency *</label>
          <input
            className="fx-input"
            value={form.taxResidency}
            onChange={(e) => onChange('taxResidency', e.target.value)}
            required
            placeholder="Country of tax residence"
          />
        </div>
        <div>
          <label className="fx-label">Purpose of account *</label>
          <select
            className="fx-input"
            value={form.purposeOfAccount}
            onChange={(e) => onChange('purposeOfAccount', e.target.value)}
            required
          >
            <option value="">Select purpose</option>
            <option value="trading">Trading</option>
            <option value="investment">Long-term investment</option>
            <option value="payments">Payments</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={!!form.isPep}
              onChange={(e) => onChange('isPep', e.target.checked)}
              className="rounded border-slate-300"
            />
            I am a Politically Exposed Person (PEP) or related to one
          </label>
        </div>
        {form.isPep && (
          <div className="sm:col-span-2">
            <label className="fx-label">PEP details</label>
            <textarea
              className="fx-input"
              rows={2}
              value={form.pepDetails}
              onChange={(e) => onChange('pepDetails', e.target.value)}
              placeholder="Describe your political exposure"
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="fx-label">Additional notes</label>
          <textarea
            className="fx-input"
            rows={2}
            value={form.additionalNotes}
            onChange={(e) => onChange('additionalNotes', e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold disabled:opacity-60"
            disabled={loading}
          >
            Back
          </button>
        )}
        <button
          type="submit"
          className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-60"
          disabled={!canProceed || loading}
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </form>
  )
}
