import { kycBtnPrimary, kycCard } from '../../styles/kycUi'

const TIMELINE = [
  { key: 'submitted', label: 'Submitted', desc: 'Application received' },
  { key: 'documents', label: 'Documents received', desc: 'Files uploaded successfully' },
  { key: 'review', label: 'Under review', desc: 'Compliance team is verifying' },
  { key: 'decision', label: 'Decision', desc: 'Approved or more info requested' }
]

function statusIndex(status) {
  if (status === 'approved') return 3
  if (status === 'rejected') return 3
  if (status === 'under_review') return 2
  if (status === 'pending') return 2
  return 1
}

export default function StepSubmission({
  status = 'pending',
  referenceNumber,
  expectedReviewHours = 48,
  onDone
}) {
  const active = statusIndex(status)
  const isApproved = status === 'approved'
  const isRejected = status === 'rejected'

  return (
    <div className="space-y-6 text-center">
      <div className="relative mx-auto w-20 h-20">
        <div
          className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
            isApproved ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-teal-500'
          }`}
        />
        <div
          className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl ${
            isApproved
              ? 'bg-gradient-to-br from-emerald-400 to-teal-600'
              : isRejected
                ? 'bg-gradient-to-br from-red-400 to-rose-600'
                : 'bg-gradient-to-br from-teal-400 to-cyan-600'
          }`}
        >
          {isRejected ? (
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isApproved
            ? 'You are verified'
            : isRejected
              ? 'Verification needs attention'
              : 'Verification submitted'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          {isApproved
            ? 'Your identity has been approved. Full platform access is unlocked.'
            : isRejected
              ? 'Please review the feedback and resubmit when ready.'
              : `Our team typically reviews applications within ${expectedReviewHours} hours. We’ll email you with the outcome.`}
        </p>
      </div>

      <div className={`${kycCard} p-4 text-left space-y-3`}>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Status</span>
          <span className="font-semibold capitalize text-amber-600 dark:text-amber-400">
            {String(status).replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Reference</span>
          <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-100">
            {referenceNumber || '—'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Est. review</span>
          <span className="font-medium">Up to {expectedReviewHours}h</span>
        </div>
      </div>

      <div className={`${kycCard} p-5 text-left`}>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Verification timeline
        </p>
        <ol className="space-y-0">
          {TIMELINE.map((item, idx) => {
            const done = idx < active || (idx === active && isApproved)
            const current = idx === active && !isApproved
            return (
              <li key={item.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 mt-1 ${
                      done
                        ? 'bg-teal-500'
                        : current
                          ? 'bg-teal-500 ring-4 ring-teal-500/25'
                          : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                  {idx < TIMELINE.length - 1 ? (
                    <div
                      className={`w-0.5 flex-1 min-h-[28px] ${
                        idx < active ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ) : null}
                </div>
                <div className="pb-5">
                  <p
                    className={`text-sm font-semibold ${
                      done || current ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                    {item.key === 'decision' && isApproved ? ' · Approved' : ''}
                    {item.key === 'decision' && isRejected ? ' · Rejected' : ''}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {onDone ? (
        <button type="button" onClick={onDone} className={kycBtnPrimary}>
          Back to dashboard
        </button>
      ) : null}
    </div>
  )
}
