import { optionCard } from '../../styles/kycUi'

const HIGHLIGHTS = [
  {
    title: 'Why we verify',
    body: 'Regulations require us to confirm who you are before full trading access. This protects your account and our community.'
  },
  {
    title: 'About 5–8 minutes',
    body: 'Have a government ID and a recent proof of address ready. You can save progress and finish later.'
  },
  {
    title: 'Your data is protected',
    body: 'Documents are encrypted in transit and at rest. Tax IDs are masked and never shown in full after submission.'
  }
]

export default function StepWelcome() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-transparent p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Secure identity verification
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Complete KYC once to unlock deposits, withdrawals, and higher limits.
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-2.5">
        {HIGHLIGHTS.map((item) => (
          <li key={item.title} className={optionCard(false)}>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {item.body}
            </p>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          You will need
        </p>
        <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside">
          <li>Legal name and date of birth</li>
          <li>Residential address</li>
          <li>Government-issued photo ID</li>
          <li>Selfie and proof of address</li>
        </ol>
      </div>
    </div>
  )
}
