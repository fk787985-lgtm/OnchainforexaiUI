export default function KycStepReviewSubmit({
  personalInfo,
  docTypeLabel,
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
        {frontPreviewUrl ? <img src={frontPreviewUrl} alt="Document front preview" className="w-full max-h-52 object-cover rounded-xl border border-gray-200 dark:border-gray-700 mb-2" /> : null}
        {requiresBack && backPreviewUrl ? <img src={backPreviewUrl} alt="Document back preview" className="w-full max-h-52 object-cover rounded-xl border border-gray-200 dark:border-gray-700" /> : null}
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
