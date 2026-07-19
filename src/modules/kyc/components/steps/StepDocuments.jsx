import { useEffect, useMemo, useState } from 'react'
import { needsBackSide } from '../../config/steps'
import KycSection from '../KycSection'
import KycCameraCapture from '../KycCameraCapture'

function SlotCard({
  title,
  subtitle,
  done,
  active,
  previewUrl,
  existingUrl,
  onCapture,
  onReplace,
  disabled
}) {
  const img = previewUrl || existingUrl
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        active
          ? 'border-[#1199fa] bg-[#1199fa]/8 shadow-sm'
          : done
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            done
              ? 'bg-emerald-500 text-white'
              : active
                ? 'bg-[#1199fa] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}
        >
          {done ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          {img ? (
            <img
              src={img}
              alt=""
              className="mt-3 w-full max-h-36 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          ) : null}
          <div className="mt-3 flex gap-2">
            {!done ? (
              <button
                type="button"
                disabled={disabled}
                onClick={onCapture}
                className="h-10 px-4 rounded-xl bg-[#1199fa] text-white text-sm font-semibold disabled:opacity-40"
              >
                Open camera
              </button>
            ) : (
              <button
                type="button"
                onClick={onReplace}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Retake
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StepDocuments({
  form,
  files,
  previews,
  existing,
  errors,
  onFile,
  onClear,
  autoStart = true
}) {
  const backNeeded = needsBackSide(form.documentType || form.governmentIdType)
  const docLabel =
    form.documentType === 'passport'
      ? 'Passport'
      : form.documentType === 'permanent_resident_card'
        ? 'PR card'
        : form.documentType === 'drivers_license'
          ? "Driver's license"
          : 'Government ID'

  const frontDone = Boolean(files.front || existing.front)
  const backDone = !backNeeded || Boolean(files.back || existing.back)
  const selfieDone = Boolean(files.selfie || existing.selfie)

  const initialPhase = useMemo(() => {
    if (!frontDone) return 'front'
    if (backNeeded && !backDone) return 'back'
    if (!selfieDone) return 'selfie'
    return null
  }, [frontDone, backNeeded, backDone, selfieDone])

  const [cameraPhase, setCameraPhase] = useState(null) // which camera is open
  const [guidePhase, setGuidePhase] = useState(initialPhase)
  const [userDismissed, setUserDismissed] = useState(false)
  const [chainOpen, setChainOpen] = useState(autoStart) // auto chain after each capture

  // Auto-open camera for the next required capture (like Background Search)
  useEffect(() => {
    if (!autoStart || !chainOpen || userDismissed || cameraPhase) return
    if (!frontDone) {
      setGuidePhase('front')
      setCameraPhase('front')
      return
    }
    if (backNeeded && !backDone) {
      setGuidePhase('back')
      setCameraPhase('back')
      return
    }
    if (!selfieDone) {
      setGuidePhase('selfie')
      setCameraPhase('selfie')
    }
  }, [autoStart, chainOpen, userDismissed, frontDone, backNeeded, backDone, selfieDone, cameraPhase])

  const openCamera = (phase) => {
    setUserDismissed(false)
    setChainOpen(true)
    setGuidePhase(phase)
    setCameraPhase(phase)
  }

  const handleCaptured = (phase, file) => {
    if (phase === 'front') onFile('front', file)
    if (phase === 'back') onFile('back', file)
    if (phase === 'selfie') onFile('selfie', file)
    setCameraPhase(null)
    setUserDismissed(false)
    setChainOpen(true)

    // Advance guide to next required step
    if (phase === 'front') {
      if (backNeeded) setGuidePhase('back')
      else setGuidePhase('selfie')
    } else if (phase === 'back') {
      setGuidePhase('selfie')
    } else {
      setGuidePhase(null)
      setChainOpen(false)
    }
  }

  const camMeta =
    cameraPhase === 'selfie'
      ? {
          title: 'Liveness check',
          instruction: 'Hold still · face the light',
          facing: 'user',
          frame: 'oval',
          confirm: 'Use selfie'
        }
      : cameraPhase === 'back'
        ? {
            title: `Back of ${docLabel}`,
            instruction: 'Fill the frame · avoid glare',
            facing: 'environment',
            frame: 'card',
            confirm: 'Use photo'
          }
        : {
            title: `Front of ${docLabel}`,
            instruction: 'Fill the frame · avoid glare',
            facing: 'environment',
            frame: 'card',
            confirm: 'Use photo'
          }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Photograph your {docLabel}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Camera opens automatically. Capture front
          {backNeeded ? ', then back,' : ''} then a quick selfie for liveness.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['front', ...(backNeeded ? ['back'] : []), 'selfie'].map((p) => {
            const done =
              p === 'front' ? frontDone : p === 'back' ? backDone : selfieDone
            const active = guidePhase === p
            return (
              <span
                key={p}
                className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md ${
                  done
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : active
                      ? 'bg-[#1199fa]/15 text-[#1199fa]'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {p === 'selfie' ? 'Selfie' : p}
                {done ? ' ✓' : ''}
              </span>
            )
          })}
        </div>
      </div>

      <KycSection title="Document photos">
        <div className="space-y-3">
          <SlotCard
            title="Front of ID"
            subtitle={`${docLabel} · photo side with your face and name`}
            done={frontDone}
            active={guidePhase === 'front'}
            previewUrl={previews.front}
            existingUrl={existing.front}
            onCapture={() => openCamera('front')}
            onReplace={() => {
              onClear('front')
              openCamera('front')
            }}
          />
          {backNeeded && (
            <SlotCard
              title="Back of ID"
              subtitle="Barcode / MRZ side if present"
              done={backDone}
              active={guidePhase === 'back'}
              previewUrl={previews.back}
              existingUrl={existing.back}
              onCapture={() => openCamera('back')}
              onReplace={() => {
                onClear('back')
                openCamera('back')
              }}
              disabled={!frontDone}
            />
          )}
        </div>
        {errors.front || errors.back ? (
          <p className="text-xs text-red-500 mt-2" role="alert">
            {errors.front || errors.back}
          </p>
        ) : null}
      </KycSection>

      <KycSection title="Liveness selfie">
        <SlotCard
          title="Face verification"
          subtitle="Front camera opens automatically · look straight ahead"
          done={selfieDone}
          active={guidePhase === 'selfie'}
          previewUrl={previews.selfie}
          existingUrl={existing.selfie}
          onCapture={() => openCamera('selfie')}
          onReplace={() => {
            onClear('selfie')
            openCamera('selfie')
          }}
          disabled={!frontDone || (backNeeded && !backDone)}
        />
        {errors.selfie ? (
          <p className="text-xs text-red-500 mt-2" role="alert">
            {errors.selfie}
          </p>
        ) : null}
      </KycSection>

      {frontDone && backDone && selfieDone && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 font-medium">
          All photos captured. Continue to proof of address.
        </div>
      )}

      {cameraPhase && (
        <KycCameraCapture
          key={cameraPhase}
          title={camMeta.title}
          instruction={camMeta.instruction}
          facingMode={camMeta.facing}
          frameType={camMeta.frame}
          confirmLabel={camMeta.confirm}
          onCancel={() => {
            setUserDismissed(true)
            setChainOpen(false)
            setCameraPhase(null)
          }}
          onConfirm={async (file) => handleCaptured(cameraPhase, file)}
        />
      )}
    </div>
  )
}
