import { useCallback, useEffect, useRef, useState } from 'react'

const GRANTED_KEY = 'fx_kyc_camera_granted'

export function isKycCameraGranted() {
  try {
    return sessionStorage.getItem(GRANTED_KEY) === 'true'
  } catch {
    return false
  }
}

function markGranted() {
  try {
    sessionStorage.setItem(GRANTED_KEY, 'true')
  } catch {
    /* ignore */
  }
}

function waitReady(video, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now()
    const tick = () => {
      if (video.videoWidth > 0 && video.readyState >= 2) {
        resolve()
        return
      }
      if (Date.now() - t0 > timeoutMs) {
        reject(new Error('Camera took too long to start'))
        return
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
}

/**
 * Camera hook for KYC document + selfie capture.
 * Auto-starts when `autoStart` is true (or permission already granted).
 */
export default function useKycCamera({ facingMode = 'environment', autoStart = true } = {}) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const blobRef = useRef(null)
  const [phase, setPhase] = useState(() =>
    autoStart || isKycCameraGranted() ? 'starting' : 'prompt'
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [busy, setBusy] = useState(false)

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setIsReady(false)
  }, [])

  const start = useCallback(async () => {
    setErrorMessage('')
    setPhase('starting')
    setIsReady(false)
    stop()
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error('Camera not supported'), { name: 'NotSupportedError' })
      }
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        })
      }
      streamRef.current = stream
      markGranted()
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        videoRef.current.muted = true
        await videoRef.current.play().catch(() => {})
        await waitReady(videoRef.current)
      }
      setIsReady(true)
      setPhase('live')
    } catch (err) {
      const name = err?.name || ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPhase('denied')
        setErrorMessage('Camera access blocked. Allow camera permission and try again.')
      } else if (name === 'NotFoundError') {
        setPhase('error')
        setErrorMessage('No camera found on this device.')
      } else {
        setPhase('error')
        setErrorMessage(err?.message || 'Could not start camera.')
      }
    }
  }, [facingMode, stop])

  const takePreview = useCallback(async () => {
    const video = videoRef.current
    if (!video || !isReady) throw new Error('Camera not ready')
    setBusy(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext('2d')
      // Mirror selfie for natural look
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Capture failed'))),
          'image/jpeg',
          0.92
        )
      })
      blobRef.current = blob
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      stop()
      setPhase('preview')
      return blob
    } finally {
      setBusy(false)
    }
  }, [facingMode, isReady, previewUrl, stop])

  const retake = useCallback(async () => {
    blobRef.current = null
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    await start()
  }, [previewUrl, start])

  useEffect(() => {
    if (autoStart || isKycCameraGranted()) {
      start()
    }
    return () => {
      stop()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    videoRef,
    phase,
    errorMessage,
    isReady,
    previewUrl,
    busy,
    capturedBlob: blobRef,
    start,
    takePreview,
    retake,
    stop
  }
}
