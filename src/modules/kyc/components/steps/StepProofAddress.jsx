import { POA_TYPES } from '../../config/steps'
import KycFileDropzone from '../KycFileDropzone'
import KycSection from '../KycSection'
import { optionCard } from '../../styles/kycUi'

export default function StepProofAddress({ form, onChange, file, preview, existing, error, onFile, onClear }) {
  return (
    <div className="space-y-4">
      <KycSection title="Document type">
        <div className="space-y-2">
          {POA_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange('poaType', t.value)}
              className={optionCard(form.poaType === t.value)}
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </KycSection>

      <KycSection title="Upload">
        <KycFileDropzone
          label="Proof of address"
          required
          accept="image/*,application/pdf"
          hint="Issued within last 3 months · shows your name & address"
          file={file}
          previewUrl={preview}
          existingUrl={existing}
          onFile={onFile}
          onClear={onClear}
          error={error}
        />
      </KycSection>

      <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 px-1">
        <li>• Name and address must match your application</li>
        <li>• Document date should be within the last 90 days</li>
        <li>• Full page visible, not cropped, max 10MB</li>
      </ul>
    </div>
  )
}
