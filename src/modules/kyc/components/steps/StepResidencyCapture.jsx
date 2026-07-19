import KycCameraCapture from '../KycCameraCapture'

/** Full-page PR card or passport photo */
export default function StepResidencyCapture({ form, onFile, onComplete, onBack }) {
  const isPr = form.residencyType === 'permanent_resident_card'
  const title = isPr ? 'Upload PR Card' : 'Upload Passport'
  const instruction = isPr
    ? 'Position your Permanent Resident (PR) Card inside the frame'
    : 'Position your Passport photo page inside the frame'

  return (
    <KycCameraCapture
      title={title}
      instruction={instruction}
      permissionText={
        isPr
          ? "You chose Permanent Resident (PR) Card. We'll photograph it with your camera."
          : "You chose Passport. We'll photograph the photo page with your camera."
      }
      facingMode="environment"
      frameType="card"
      confirmLabel="Use photo"
      onBack={onBack}
      onConfirm={async (file) => {
        onFile('passport', file)
        onComplete?.(file)
      }}
    />
  )
}
