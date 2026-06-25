export default function KycStepReviewSubmit({
  personalInfo,
  docTypeLabel,
  frontFile,
  backFile,
  frontPreviewUrl,
  backPreviewUrl,
  selfiePreviewUrl,
  videoPreviewUrl,
  requiresBack,
  loading,
  canSubmit,
  declarationChecked,
  onDeclarationChange,
  onEditStep,
  onBack,
  onSubmit
}) {
  const isPdf = (file) => (file?.type || '').toLowerCase() === 'application/pdf'

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-base text-gray-900 dark:text-gray-100">Review & Submit</p>
          <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
            Final Step
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={() => onEditStep(1)} className="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:bg-slate-200 dark:hover:bg-slate-700">
            Edit Personal
          </button>
          <button onClick={() => onEditStep(2)} className="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:bg-slate-200 dark:hover:bg-slate-700">
            Edit Document
          </button>
          <button onClick={() => onEditStep(3)} className="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:bg-slate-200 dark:hover:bg-slate-700">
            Edit Selfie
          </button>
          <button onClick={() => onEditStep(4)} className="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:bg-slate-200 dark:hover:bg-slate-700">
            Edit Video
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3">
          <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Personal Information</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{personalInfo.fullName}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{personalInfo.dateOfBirth} • {personalInfo.nationality}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{personalInfo.address}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{personalInfo.phoneNumber}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3">
          <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Identity Document ({docTypeLabel})</p>
          {frontPreviewUrl && !isPdf(frontFile) ? (
            <img src={frontPreviewUrl} alt="Document front preview" className="w-full max-h-52 object-cover rounded-xl border border-gray-200 dark:border-gray-700 mb-2" />
          ) : null}
          {frontPreviewUrl && isPdf(frontFile) ? (
            <a
              href={frontPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="mb-2 inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400"
            >
              Open Front PDF
            </a>
          ) : null}
          {requiresBack && backPreviewUrl && !isPdf(backFile) ? (
            <img src={backPreviewUrl} alt="Document back preview" className="w-full max-h-52 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
          ) : null}
          {requiresBack && backPreviewUrl && isPdf(backFile) ? (
            <a
              href={backPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400"
            >
              Open Back PDF
            </a>
          ) : null}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3">
            <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Selfie</p>
            {selfiePreviewUrl ? <img src={selfiePreviewUrl} alt="Selfie preview" className="w-full max-h-52 object-cover rounded-xl border border-gray-200 dark:border-gray-700" /> : null}
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3">
            <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Liveness Video</p>
            {videoPreviewUrl ? <video src={videoPreviewUrl} controls className="w-full rounded-xl border border-gray-200 dark:border-gray-700" /> : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={declarationChecked}
            onChange={(e) => onDeclarationChange(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-xs text-amber-900 dark:text-amber-200">
            I confirm all details and uploaded documents are accurate and belong to me.
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-xl font-semibold">Back</button>
        <button
          onClick={onSubmit}
          disabled={loading || !canSubmit}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60 transition"
        >
          {loading ? 'Submitting...' : 'Submit Verification'}
        </button>
      </div>
    </div>
  )
}
