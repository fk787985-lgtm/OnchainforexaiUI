const DOC_OPTIONS = [
  { value: 'passport', label: 'Passport', requiresBack: false },
  { value: 'national_id', label: 'National ID', requiresBack: true },
  { value: 'drivers_license', label: "Driver's License", requiresBack: true }
]

export default function KycStepDocumentUpload({
  docType,
  onDocTypeChange,
  frontFile,
  backFile,
  frontPreviewUrl,
  backPreviewUrl,
  onFrontUpload,
  onBackUpload,
  onNext,
  onBack,
  canProceed
}) {
  const selected = DOC_OPTIONS.find((o) => o.value === docType) || DOC_OPTIONS[0]
  const isPdf = (file) => (file?.type || '').toLowerCase() === 'application/pdf'

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <label className="fx-label">Document Type *</label>
        <select className="fx-select" value={docType} onChange={(e) => onDocTypeChange(e.target.value)}>
          {DOC_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <p className="text-sm font-semibold mb-2">Document checklist</p>
        <div className="space-y-1">
          <p className={`text-xs ${frontFile ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {frontFile ? '✓' : '•'} Front side uploaded
          </p>
          {selected.requiresBack ? (
            <p className={`text-xs ${backFile ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {backFile ? '✓' : '•'} Back side uploaded
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="fx-label">Front Side *</label>
        <input className="fx-input !py-2" type="file" accept="image/*,.pdf" onChange={(e) => onFrontUpload(e.target.files?.[0])} />
        <p className="fx-help">Only images (JPEG, PNG), PDF, and video files are allowed.</p>
        {frontFile ? <p className="fx-help">Uploaded: {frontFile.name || 'Captured file'}</p> : null}
        {frontPreviewUrl && !isPdf(frontFile) ? (
          <img src={frontPreviewUrl} alt="Front preview" className="mt-2 w-full max-h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
        ) : null}
        {frontPreviewUrl && isPdf(frontFile) ? (
          <a
            href={frontPreviewUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400"
          >
            Open Front PDF
          </a>
        ) : null}
      </div>

      {selected.requiresBack ? (
        <div>
          <label className="fx-label">Back Side *</label>
          <input className="fx-input !py-2" type="file" accept="image/*,.pdf" onChange={(e) => onBackUpload(e.target.files?.[0])} />
          <p className="fx-help">Only images (JPEG, PNG), PDF, and video files are allowed.</p>
          {backFile ? <p className="fx-help">Uploaded: {backFile.name || 'Captured file'}</p> : null}
          {backPreviewUrl && !isPdf(backFile) ? (
            <img src={backPreviewUrl} alt="Back preview" className="mt-2 w-full max-h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
          ) : null}
          {backPreviewUrl && isPdf(backFile) ? (
            <a
              href={backPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400"
            >
              Open Back PDF
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-semibold">Back</button>
        <button onClick={onNext} disabled={!canProceed} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60">Next</button>
      </div>
    </div>
  )
}
