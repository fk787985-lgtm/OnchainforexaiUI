import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function VideoVerification({ onComplete, onCancel }) {
  const [step, setStep] = useState(0)
  const [recording, setRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])

  const verificationSteps = [
    { action: 'Look straight ahead', icon: '👁️', duration: 2 },
    { action: 'Look up', icon: '⬆️', duration: 2 },
    { action: 'Look down', icon: '⬇️', duration: 2 },
    { action: 'Turn head left', icon: '⬅️', duration: 2 },
    { action: 'Turn head right', icon: '➡️', duration: 2 },
    { action: 'Open your mouth', icon: '😮', duration: 2 },
    { action: 'Blink your eyes', icon: '😊', duration: 2 }
  ]

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Failed to access camera. Please allow camera permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const startRecording = () => {
    if (!streamRef.current) {
      toast.error('Camera not available')
      return
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8'
      })
      mediaRecorderRef.current = mediaRecorder
      recordedChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        setRecordedVideo(blob)
        setRecording(false)
      }

      mediaRecorder.start()
      setRecording(true)
      startVerificationSequence()
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording')
    }
  }

  const startVerificationSequence = () => {
    setStep(0)
    let currentStep = 0

    const nextStep = () => {
      if (currentStep < verificationSteps.length) {
        setStep(currentStep)
        currentStep++
        setTimeout(nextStep, verificationSteps[currentStep - 1].duration * 1000)
      } else {
        stopRecording()
      }
    }

    nextStep()
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleRetake = () => {
    setRecordedVideo(null)
    setStep(0)
    setRecording(false)
    startRecording()
  }

  const handleConfirm = () => {
    if (recordedVideo) {
      onComplete(recordedVideo)
    }
  }

  const handleCancel = () => {
    stopCamera()
    onCancel()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Video Verification</h3>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {!recordedVideo ? (
            <>
              <div className="mb-6">
                <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {recording && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold">Recording</span>
                    </div>
                  )}
                </div>

                {recording && step < verificationSteps.length && (
                  <div className="text-center py-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-4xl mb-2">{verificationSteps[step].icon}</div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {verificationSteps[step].action}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Step {step + 1} of {verificationSteps.length}
                    </p>
                  </div>
                )}

                {!recording && (
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Please follow the instructions on screen. Make sure your face is clearly visible.
                    </p>
                    <button
                      onClick={startRecording}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                    >
                      Start Recording
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Instructions:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Make sure you're in a well-lit area</li>
                  <li>• Keep your face centered in the frame</li>
                  <li>• Follow the on-screen instructions</li>
                  <li>• Complete all movements clearly</li>
                </ul>
              </div>
            </>
          ) : (
            <div>
              <div className="mb-6">
                <video
                  src={URL.createObjectURL(recordedVideo)}
                  controls
                  className="w-full rounded-lg"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleRetake}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
                >
                  Retake
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



