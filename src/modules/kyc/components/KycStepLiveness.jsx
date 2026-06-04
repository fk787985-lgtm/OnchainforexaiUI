export default function KycStepLiveness({ videoPreviewUrl, onOpenRecorder, onNext, onBack, canProceed }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Liveness Check</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Record a short 3-5 second verification clip.</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Look at the camera and blink or turn your head.</p>
        <div className="mb-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-3">
          <p className="text-xs text-purple-700 dark:text-purple-300">Tip: Keep your phone steady and avoid low light for faster approval.</p>
        </div>
        <button onClick={onOpenRecorder} className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold">
          {videoPreviewUrl ? 'Retake Video' : 'Start Video Verification'}
        </button>
        {videoPreviewUrl ? (
          <video src={videoPreviewUrl} controls className="mt-3 w-full rounded-xl border border-gray-200 dark:border-gray-700" />
        ) : null}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-semibold">Back</button>
        <button onClick={onNext} disabled={!canProceed} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60">Next</button>
      </div>
    </div>
  )
}
