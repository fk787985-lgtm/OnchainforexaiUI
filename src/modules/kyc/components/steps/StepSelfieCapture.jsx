import KycCameraCapture from '../KycCameraCapture'

/** Full-page liveness selfie — auto-opens front camera */
export default function StepSelfieCapture({ onFile, onComplete, onBack }) {
  return (
    <KycCameraCapture
      title="Selfie"
      instruction="Align your face inside the oval"
      permissionText="We'll use your front camera for a quick selfie to match against your ID. Tap Allow when your browser asks."
      facingMode="user"
      frameType="oval"
      confirmLabel="Use photo"
      onBack={onBack}
      onConfirm={async (file) => {
        onFile('selfie', file)
        onComplete?.(file)
      }}
    />
  )
}
