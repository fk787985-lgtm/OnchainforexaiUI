/**
 * Full-page document / selfie camera — Background Search DocumentCameraCapture style.
 * Shutter button, card/oval frame, retake / use photo.
 */
import useKycCamera from '../hooks/useKycCamera'

function CardFrameOverlay() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(20rem,88vw)] h-[min(12.5rem,52vw)]">
        <div className="absolute inset-0 border-4 border-white rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
      </div>
    </div>
  )
}

function OvalFrameOverlay() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(16rem,72vw)] h-[min(20rem,88vw)]">
        <div className="absolute inset-0 border-4 border-white rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
      </div>
    </div>
  )
}

export default function KycCameraCapture({
  title = 'Take photo',
  instruction = 'Position the document inside the frame',
  permissionText,
  facingMode = 'environment',
  frameType = 'card',
  confirmLabel = 'Use photo',
  onConfirm,
  onBack
}) {
  const {
    videoRef,
    phase,
    errorMessage,
    isReady,
    previewUrl,
    busy,
    capturedBlob,
    start,
    takePreview,
    retake
  } = useKycCamera({ facingMode, autoStart: true })

  const handleConfirm = async () => {
    const blob = capturedBlob.current
    if (!blob) return
    const file = new File(
      [blob],
      `${frameType === 'oval' ? 'selfie' : 'id'}-${Date.now()}.jpg`,
      { type: 'image/jpeg' }
    )
    await onConfirm?.(file)
  }

  const Frame = frameType === 'oval' ? OvalFrameOverlay : CardFrameOverlay

  return (
    <div className="fixed inset-0 z-[90] bg-black flex flex-col">
      {/* Top bar */}
      <header className="absolute top-0 inset-x-0 z-30 pt-[max(0.5rem,env(safe-area-inset-top))] px-3 pb-2 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between h-12">
          <button
            type="button"
            onClick={onBack}
            className="h-9 px-3 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
          >
            Back
          </button>
          <p className="text-sm font-semibold text-white">{title}</p>
          <div className="w-14" />
        </div>
      </header>

      <div className="relative flex-1 min-h-0">
        {/* Permission / starting */}
        {(phase === 'prompt' || phase === 'starting') && (
          <div className="absolute inset-0 z-20 flex items-center justify-center px-6 bg-[#0b1426]">
            <div className="max-w-sm w-full text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#1199fa]/15 border border-[#1199fa]/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#1199fa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {phase === 'starting' ? 'Starting camera…' : 'Allow camera access'}
              </h2>
              <p className="text-sm text-white/55 mb-6 leading-relaxed">
                {permissionText ||
                  'We need your camera to verify your identity. You only need to allow this once — later photos open automatically.'}
              </p>
              {phase === 'prompt' && (
                <button
                  type="button"
                  onClick={start}
                  className="w-full h-12 rounded-xl bg-[#1199fa] text-white text-sm font-semibold"
                >
                  Allow camera access
                </button>
              )}
              {phase === 'starting' && (
                <div className="w-10 h-10 mx-auto border-2 border-[#1199fa] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
        )}

        {(phase === 'denied' || phase === 'error') && (
          <div className="absolute inset-0 z-20 flex items-center justify-center px-6 bg-[#0b1426]">
            <div className="max-w-sm w-full text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-500/15 flex items-center justify-center">
                <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                {phase === 'denied' ? 'Camera permission needed' : 'Camera unavailable'}
              </h2>
              <p className="text-sm text-white/55 mb-6 leading-relaxed">{errorMessage}</p>
              <button
                type="button"
                onClick={start}
                className="w-full h-12 rounded-xl bg-[#1199fa] text-white text-sm font-semibold mb-2"
              >
                Try again
              </button>
              <button type="button" onClick={onBack} className="w-full h-11 text-sm text-white/50">
                Back
              </button>
            </div>
          </div>
        )}

        {/* Live view */}
        {(phase === 'live' || phase === 'starting') && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover z-0 ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />
            {phase === 'live' && isReady && (
              <>
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 bg-[#0b1426]/90 rounded-lg px-4 py-2 max-w-[90vw]">
                  <p className="text-white text-sm text-center">{instruction}</p>
                </div>
                <Frame />
              </>
            )}
          </>
        )}

        {/* Preview */}
        {phase === 'preview' && previewUrl && (
          <div className="absolute inset-0 z-10 pt-14 pb-28 bg-black flex flex-col">
            <div className="flex-1 relative overflow-hidden">
              <img
                src={previewUrl}
                alt="Captured"
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            </div>
            <p className="text-center text-sm text-white/60 py-3 px-4">
              Is this photo clear and readable?
            </p>
          </div>
        )}

        {/* Shutter — live */}
        {phase === 'live' && isReady && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30">
            <button
              type="button"
              onClick={() => takePreview().catch(() => {})}
              disabled={busy}
              aria-label="Take photo"
              className={`w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform ${
                busy ? 'opacity-50' : ''
              }`}
            >
              {busy ? (
                <div className="w-8 h-8 border-2 border-[#1199fa] border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-400" />
              )}
            </button>
          </div>
        )}

        {/* Preview actions */}
        {phase === 'preview' && (
          <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-8 pt-3 bg-gradient-to-t from-black via-black/90 to-transparent">
            <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={retake}
                className="h-12 rounded-xl border border-white/25 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="h-12 rounded-xl bg-[#1199fa] text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {confirmLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
