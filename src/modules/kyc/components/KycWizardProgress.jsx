const STEP_ITEMS = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Document' },
  { id: 3, label: 'Selfie' },
  { id: 4, label: 'Liveness' },
  { id: 5, label: 'Submit' }
]

export default function KycWizardProgress({ step }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">Step {step} of {STEP_ITEMS.length}</p>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEP_ITEMS.map((item, index) => (
          <div key={item.id} className="flex items-center min-w-fit">
            <div className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center ${
              step >= item.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {step > item.id ? '✓' : item.id}
            </div>
            <span className={`ml-2 mr-2 text-xs sm:text-sm ${step >= item.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              {item.label}
            </span>
            {index < STEP_ITEMS.length - 1 ? (
              <div className={`w-6 sm:w-10 h-0.5 ${step > item.id ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
