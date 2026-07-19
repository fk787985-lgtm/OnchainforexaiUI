export default function KycStepSsn({ form, onChange, onNext, onBack, loading, canProceed }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onNext()
      }}
      className="space-y-5 animate-fade-in"
    >
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">SSN Verification</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Your Social Security Number is encrypted and stored securely. Only the last 4 digits are shown after submission.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div>
          <label className="fx-label">Social Security Number *</label>
          <input
            className="fx-input font-mono tracking-widest"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="•••-••-••••"
            value={form.ssn}
            onChange={(e) => onChange('ssn', e.target.value.replace(/\D/g, '').slice(0, 9))}
            required
            maxLength={9}
          />
        </div>
        <div>
          <label className="fx-label">Confirm SSN *</label>
          <input
            className="fx-input font-mono tracking-widest"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Re-enter SSN"
            value={form.ssnConfirm}
            onChange={(e) => onChange('ssnConfirm', e.target.value.replace(/\D/g, '').slice(0, 9))}
            required
            maxLength={9}
          />
        </div>
        {form.ssn && form.ssnConfirm && form.ssn !== form.ssnConfirm && (
          <p className="text-xs text-red-600">SSN confirmation does not match.</p>
        )}
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
          Never share your SSN with anyone claiming to be support outside this secure form.
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
