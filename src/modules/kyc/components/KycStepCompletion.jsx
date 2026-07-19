export default function KycStepCompletion({
  status = 'pending',
  referenceNumber,
  expectedReviewHours = 48,
  onDone
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center space-y-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Verification submitted</h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto">
        Your KYC application is under review. We will notify you once a decision is made.
      </p>
      <dl className="text-left max-w-sm mx-auto space-y-2 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="flex justify-between">
          <dt className="text-slate-500">Status</dt>
          <dd className="font-semibold capitalize text-amber-600">{status.replace('_', ' ')}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Reference</dt>
          <dd className="font-mono text-xs text-slate-800 dark:text-slate-200">{referenceNumber || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Expected review</dt>
          <dd className="font-medium text-slate-900 dark:text-white">Up to {expectedReviewHours} hours</dd>
        </div>
      </dl>
      {onDone && (
        <button
          type="button"
          onClick={onDone}
          className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl font-semibold"
        >
          Back to profile
        </button>
      )}
    </div>
  )
}
