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
  onEditStep,
  onBack,
  onSubmit
}) {
  const isPdf = (file) => (file?.type || '').toLowerCase() === 'application/pdf'

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="fx-card p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold">Personal Information</p>
          <button onClick={() => onEditStep(1)} className="text-sm text-indigo-600 dark:text-indigo-400">Edit</button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{personalInfo.fullName}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{personalInfo.dateOfBirth} • {personalInfo.nationality}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{personalInfo.address}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{personalInfo.phoneNumber}</p>
      </div>

      <div className="fx-card p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold">Document ({docTypeLabel})</p>
          <button onClick={() => onEditStep(2)} className="text-sm text-indigo-600 dark:text-indigo-400">Edit</button>
        </div>
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

      <div className="fx-card p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold">Selfie</p>
          <button onClick={() => onEditStep(3)} className="text-sm text-indigo-600 dark:text-indigo-400">Edit</button>
        </div>
        {selfiePreviewUrl ? <img src={selfiePreviewUrl} alt="Selfie preview" className="w-full max-h-52 object-cover rounded-xl border border-gray-200 dark:border-gray-700" /> : null}
      </div>

      <div className="fx-card p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold">Liveness Video</p>
          <button onClick={() => onEditStep(4)} className="text-sm text-indigo-600 dark:text-indigo-400">Edit</button>
        </div>
        {videoPreviewUrl ? <video src={videoPreviewUrl} controls className="w-full rounded-xl border border-gray-200 dark:border-gray-700" /> : null}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-semibold">Back</button>
        <button onClick={onSubmit} disabled={loading} className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold disabled:opacity-60">
          {loading ? 'Submitting...' : 'Submit Verification'}
        </button>
      </div>
    </div>
  )
}
