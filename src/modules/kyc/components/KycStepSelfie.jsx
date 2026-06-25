export default function KycStepSelfie({ selfiePreviewUrl, onOpenCapture, onNext, onBack, canProceed }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Selfie Verification</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Capture a clear selfie in good lighting. Keep your face centered.</p>
        <div className="mb-3 rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 p-3">
          <p className="text-xs text-cyan-700 dark:text-cyan-300">Tip: Remove sunglasses/hats and keep your entire face visible.</p>
        </div>
        <button onClick={onOpenCapture} className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition">
          {selfiePreviewUrl ? 'Retake Selfie' : 'Open Camera'}
        </button>
        {selfiePreviewUrl ? (
          <img src={selfiePreviewUrl} alt="Selfie preview" className="mt-3 w-full max-h-72 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
        ) : null}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-xl font-semibold">Back</button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60 transition"
        >
          Next
        </button>
      </div>
    </div>
  )
}
