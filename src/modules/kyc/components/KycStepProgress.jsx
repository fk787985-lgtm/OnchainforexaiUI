export default function KycStepProgress({ step }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= s
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {step > s ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </div>
            <div className="mt-2 text-xs text-center text-gray-600 dark:text-gray-300">
              {s === 1 && 'Personal Info'}
              {s === 2 && 'Address'}
              {s === 3 && 'Documents'}
            </div>
          </div>
          {s < 3 && (
            <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
