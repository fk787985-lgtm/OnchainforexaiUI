export default function KycStepSelfie({ selfiePreviewUrl, onOpenCapture, onNext, onBack, canProceed }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Selfie Verification</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Capture a clear selfie in good lighting. Keep your face centered.</p>
        <div className="mb-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-3">
          <p className="text-xs text-indigo-700 dark:text-indigo-300">Tip: Remove sunglasses/hats and keep your entire face visible.</p>
        </div>
        <button onClick={onOpenCapture} className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold">
          {selfiePreviewUrl ? 'Retake Selfie' : 'Open Camera'}
        </button>
        {selfiePreviewUrl ? (
          <img src={selfiePreviewUrl} alt="Selfie preview" className="mt-3 w-full max-h-72 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
        ) : null}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-semibold">Back</button>
        <button onClick={onNext} disabled={!canProceed} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60">Next</button>
      </div>
    </div>
  )
}
