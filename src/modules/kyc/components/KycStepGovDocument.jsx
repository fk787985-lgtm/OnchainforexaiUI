const DOC_TYPES = [
  { value: 'passport', label: 'Passport', requiresBack: false },
  { value: 'permanent_resident_card', label: 'Permanent Resident Card (Green Card)', requiresBack: true },
  { value: 'national_id', label: 'National ID', requiresBack: true },
  { value: 'drivers_license', label: "Driver's License", requiresBack: true },
  { value: 'other', label: 'Other government-issued ID', requiresBack: true }
]

export default function KycStepGovDocument({
  documentType,
  onDocumentTypeChange,
  frontFile,
  backFile,
  frontPreview,
  backPreview,
  onFrontChange,
  onBackChange,
  onNext,
  onBack,
  loading,
  canProceed
}) {
  const meta = DOC_TYPES.find((d) => d.value === documentType) || DOC_TYPES[0]

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onNext()
      }}
      className="space-y-5 animate-fade-in"
    >
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Identity Document</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Upload a high-resolution photo of your passport or permanent resident card. Ensure all text is readable.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div>
          <label className="fx-label">Document type *</label>
          <select
            className="fx-input"
            value={documentType}
            onChange={(e) => onDocumentTypeChange(e.target.value)}
          >
            {DOC_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <UploadBox
          label="Front image *"
          file={frontFile}
          preview={frontPreview}
          onChange={onFrontChange}
        />

        {(meta.requiresBack || documentType !== 'passport') && (
          <UploadBox
            label={meta.requiresBack ? 'Back image *' : 'Back image (if applicable)'}
            file={backFile}
            preview={backPreview}
            onChange={onBackChange}
            required={meta.requiresBack}
          />
        )}
      </div>

      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold disabled:opacity-60"
            disabled={loading}
          >
            Back
          </button>
        )}
        <button
          type="submit"
          className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-60"
          disabled={!canProceed || loading}
        >
          {loading ? 'Uploading…' : 'Continue'}
        </button>
      </div>
    </form>
  )
}

function UploadBox({ label, file, preview, onChange, required }) {
  return (
    <div>
      <label className="fx-label">{label}</label>
      <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 text-center">
        {preview ? (
          <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain mb-3" />
        ) : (
          <div className="py-6 text-slate-400 text-sm">Click to upload or drag an image</div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif,application/pdf"
          required={required && !file && !preview}
          onChange={onChange}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:text-cyan-700 dark:file:bg-cyan-950 file:font-medium"
        />
        {file && <p className="text-xs text-slate-500 mt-2 truncate">{file.name}</p>}
      </div>
    </div>
  )
}
