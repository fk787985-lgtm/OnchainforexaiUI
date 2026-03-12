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
  onBack
}) {
  const selected = DOC_OPTIONS.find((o) => o.value === docType) || DOC_OPTIONS[0]

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

      <div>
        <label className="fx-label">Front Side *</label>
        <input className="fx-input !py-2" type="file" accept="image/*,.pdf" onChange={(e) => onFrontUpload(e.target.files?.[0])} />
        <p className="fx-help">Only images (JPEG, PNG), PDF, and video files are allowed.</p>
        {frontFile ? <p className="fx-help">Uploaded: {frontFile.name || 'Captured file'}</p> : null}
        {frontPreviewUrl ? <img src={frontPreviewUrl} alt="Front preview" className="mt-2 w-full max-h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-700" /> : null}
      </div>

      {selected.requiresBack ? (
        <div>
          <label className="fx-label">Back Side *</label>
          <input className="fx-input !py-2" type="file" accept="image/*,.pdf" onChange={(e) => onBackUpload(e.target.files?.[0])} />
          <p className="fx-help">Only images (JPEG, PNG), PDF, and video files are allowed.</p>
          {backFile ? <p className="fx-help">Uploaded: {backFile.name || 'Captured file'}</p> : null}
          {backPreviewUrl ? <img src={backPreviewUrl} alt="Back preview" className="mt-2 w-full max-h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-700" /> : null}
        </div>
      ) : null}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-semibold">Back</button>
        <button onClick={onNext} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold">Next</button>
      </div>
    </div>
  )
}
