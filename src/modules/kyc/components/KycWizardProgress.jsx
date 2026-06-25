const STEP_ITEMS = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Document' },
  { id: 3, label: 'Selfie' },
  { id: 4, label: 'Liveness' },
  { id: 5, label: 'Submit' }
]

export default function KycWizardProgress({ step }) {
  const progressPercent = Math.max(0, Math.min(100, (step / STEP_ITEMS.length) * 100))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Step {step} of {STEP_ITEMS.length}</p>
        <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
          KYC Flow
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEP_ITEMS.map((item, index) => (
          <div key={item.id} className="flex items-center min-w-fit">
            <div className={`w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition ${
              step >= item.id
                ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {step > item.id ? '✓' : item.id}
            </div>
            <span className={`ml-2 mr-2 text-xs sm:text-sm font-medium ${step >= item.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              {item.label}
            </span>
            {index < STEP_ITEMS.length - 1 ? (
              <div className={`w-6 sm:w-10 h-0.5 ${step > item.id ? 'bg-cyan-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
