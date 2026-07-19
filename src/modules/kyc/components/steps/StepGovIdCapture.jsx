import { useState } from 'react'
import KycCameraCapture from '../KycCameraCapture'
import { optionCard } from '../../styles/kycUi'

const ID_OPTIONS = [
  {
    value: 'drivers_license',
    label: "Driver's license",
    text: 'Tap to open camera and photograph front, then back.'
  },
  {
    value: 'national_id',
    label: 'Government ID',
    text: 'Tap to open camera and photograph front, then back.'
  }
]

/**
 * After SIN: list 2 options (Driver’s license | Government ID).
 * Click → camera opens immediately (front → back).
 */
export default function StepGovIdCapture({
  form,
  files,
  existing,
  onChange,
  onFile,
  onComplete,
  onBack
}) {
  const frontDone = Boolean(files.front || existing.front)
  const backDone = Boolean(files.back || existing.back)

  // Always show the 2-option list first unless both sides already captured mid-flow
  const [phase, setPhase] = useState(() => {
    if (frontDone && !backDone) return 'back'
    if (frontDone && backDone) return 'choose'
    return 'choose'
  })
  const [idType, setIdType] = useState(() =>
    form.documentType === 'drivers_license' || form.documentType === 'national_id'
      ? form.documentType
      : ''
  )

  const selected = ID_OPTIONS.find((o) => o.value === idType) || ID_OPTIONS[0]
  const label = selected.label

  const pickIdType = (value) => {
    setIdType(value)
    onChange?.('documentType', value)
    onChange?.('governmentIdType', value)
    // Click → camera (front)
    setPhase('front')
  }

  const handleConfirm = async (file) => {
    if (phase === 'front') {
      onFile('front', file)
      setPhase('back')
      return
    }
    onFile('back', file)
    onComplete?.()
  }

  // ——— After SIN: always show these 2 options ———
  if (phase === 'choose') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
          <div className="max-w-lg mx-auto px-4 h-12 flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-1 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <p className="text-[15px] font-semibold text-slate-900 dark:text-white leading-tight">
                Photo ID
              </p>
              <p className="text-[11px] text-slate-500">After tax ID · choose one</p>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Select your ID type
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Choose <strong className="font-semibold text-slate-700 dark:text-slate-200">Driver’s license</strong>{' '}
              or <strong className="font-semibold text-slate-700 dark:text-slate-200">Government ID</strong>.
              When you tap, the camera opens to take the photo.
            </p>
          </div>

          <div className="space-y-3">
            {ID_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => pickIdType(opt.value)}
                className={`${optionCard(false)} !p-5 active:scale-[0.99]`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-12 h-12 rounded-2xl bg-[#1199fa]/12 text-[#1199fa] flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </span>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-slate-900 dark:text-white">
                      {opt.label}
                    </p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {opt.text}
                    </p>
                  </div>
                  <span className="shrink-0 text-[#1199fa]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // Camera opens right after option click
  const isFront = phase === 'front'

  return (
    <KycCameraCapture
      key={`${idType}-${phase}`}
      title={isFront ? `Front of ${label}` : `Back of ${label}`}
      instruction={
        isFront
          ? `Position the front of your ${label} inside the frame`
          : `Position the back of your ${label} inside the frame`
      }
      permissionText={`We'll use your camera to photograph your ${label}. Tap Allow when your browser asks.`}
      facingMode="environment"
      frameType="card"
      confirmLabel="Use photo"
      onBack={() => {
        if (phase === 'back') {
          setPhase('front')
          return
        }
        // Return to Driver's license / Government ID list
        setPhase('choose')
      }}
      onConfirm={handleConfirm}
    />
  )
}
