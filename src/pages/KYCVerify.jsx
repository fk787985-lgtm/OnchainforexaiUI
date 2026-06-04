import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SelfieCapture from '../components/SelfieCapture'
import VideoVerification from '../components/VideoVerification'
import {
  getMyKyc,
  getKycSettings,
  submitKycStep1,
  submitKycStep2,
  submitKycStep3
} from '../api/modules/kycApi'
import KycWizardProgress from '../modules/kyc/components/KycWizardProgress'
import KycStepPersonalInfo from '../modules/kyc/components/KycStepPersonalInfo'
import KycStepDocumentUpload from '../modules/kyc/components/KycStepDocumentUpload'
import KycStepSelfie from '../modules/kyc/components/KycStepSelfie'
import KycStepLiveness from '../modules/kyc/components/KycStepLiveness'
import KycStepReviewSubmit from '../modules/kyc/components/KycStepReviewSubmit'

const DOC_OPTIONS = [
  { value: 'passport', label: 'Passport', requiresBack: false },
  { value: 'national_id', label: 'National ID', requiresBack: true },
  { value: 'drivers_license', label: "Driver's License", requiresBack: true }
]

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const FILE_TYPE_ERROR = 'Only images (JPEG, PNG), PDF, and video files are allowed'
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/heic',
  'image/heif',
  'application/pdf'
])
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'pdf', 'jfif', 'heic', 'heif'])

const getFileExtension = (fileName) => {
  const parts = String(fileName || '').toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() : ''
}

const isAllowedDocumentFile = (file) => {
  if (!file) return false
  const mime = String(file.type || '').toLowerCase()
  const extension = getFileExtension(file.name)
  return ALLOWED_DOCUMENT_MIME_TYPES.has(mime) || ALLOWED_DOCUMENT_EXTENSIONS.has(extension)
}

const MAX_IMAGE_WIDTH = 1280
const MAX_IMAGE_HEIGHT = 1280
const IMAGE_QUALITY = 0.78
const MAX_TOTAL_UPLOAD_BYTES = 8 * 1024 * 1024
const KYC_DRAFT_STORAGE_KEY = 'kyc_wizard_draft_v3'

const loadImageElement = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file)
  const image = new Image()
  image.onload = () => {
    URL.revokeObjectURL(objectUrl)
    resolve(image)
  }
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    reject(new Error('Failed to read image'))
  }
  image.src = objectUrl
})

const compressImageFile = async (file, fallbackName = 'document.jpg') => {
  const mime = String(file?.type || '').toLowerCase()
  if (!mime.startsWith('image/')) return file
  if (mime.includes('gif')) return file
  const extension = getFileExtension(file?.name)
  const isHeicFamily = mime.includes('heic') || mime.includes('heif') || extension === 'heic' || extension === 'heif'

  try {
    const image = await loadImageElement(file)
    const ratio = Math.min(1, MAX_IMAGE_WIDTH / image.width, MAX_IMAGE_HEIGHT / image.height)
    const width = Math.max(1, Math.floor(image.width * ratio))
    const height = Math.max(1, Math.floor(image.height * ratio))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(image, 0, 0, width, height)

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY)
    })

    if (!blob) return file
    if (!isHeicFamily && blob.size >= file.size) return file

    const baseName = String(file.name || fallbackName).replace(/\.[^.]+$/, '')
    const newName = `${baseName || 'document'}-compressed.jpg`
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export default function KYCVerify() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [bootLoading, setBootLoading] = useState(true)
  const [showSelfieCapture, setShowSelfieCapture] = useState(false)
  const [showVideoCapture, setShowVideoCapture] = useState(false)

  const [kycSettings, setKycSettings] = useState(null)
  const [existingKYC, setExistingKYC] = useState(null)

  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    phoneNumber: ''
  })

  const [docType, setDocType] = useState('passport')
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [frontPreviewUrl, setFrontPreviewUrl] = useState('')
  const [backPreviewUrl, setBackPreviewUrl] = useState('')

  const [selfieFile, setSelfieFile] = useState(null)
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('')
  const [declarationChecked, setDeclarationChecked] = useState(false)
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false)
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState(null)
  const [isProcessingMedia, setIsProcessingMedia] = useState(false)

  const selectedDocMeta = useMemo(
    () => DOC_OPTIONS.find((item) => item.value === docType) || DOC_OPTIONS[0],
    [docType]
  )

  const isReadOnlyStatus = existingKYC && ['pending', 'under_review', 'approved'].includes(existingKYC.status)
  const personalInfoComplete = Boolean(
    personalInfo.fullName.trim() &&
    personalInfo.dateOfBirth &&
    personalInfo.nationality.trim() &&
    personalInfo.address.trim() &&
    personalInfo.phoneNumber.trim()
  )
  const documentStepComplete = Boolean(frontFile && (!selectedDocMeta.requiresBack || backFile))
  const selfieStepComplete = Boolean(selfieFile)
  const livenessStepComplete = Boolean(videoFile)
  const canSubmitReview = Boolean(
    personalInfoComplete &&
    documentStepComplete &&
    selfieStepComplete &&
    livenessStepComplete &&
    declarationChecked
  )

  useEffect(() => {
    const load = async () => {
      setBootLoading(true)
      try {
        let savedDraft = null
        try {
          const rawDraft = localStorage.getItem(KYC_DRAFT_STORAGE_KEY)
          savedDraft = rawDraft ? JSON.parse(rawDraft) : null
        } catch {
          savedDraft = null
        }

        const [settingsData, kycData] = await Promise.all([getKycSettings(), getMyKyc()])
        if (settingsData?.success) setKycSettings(settingsData.settings || null)

        if (kycData?.success && kycData.kyc) {
          const kyc = kycData.kyc
          setExistingKYC(kyc)
          if (['pending', 'under_review', 'approved'].includes(kyc.status)) {
            setStep(5)
            localStorage.removeItem(KYC_DRAFT_STORAGE_KEY)
          }

          if (kyc.status !== 'approved') {
            setPersonalInfo({
              fullName: [kyc.firstName, kyc.lastName].filter(Boolean).join(' ').trim(),
              dateOfBirth: kyc.dateOfBirth ? new Date(kyc.dateOfBirth).toISOString().split('T')[0] : '',
              nationality: kyc.nationality || '',
              address: [
                kyc.address?.street,
                kyc.address?.city,
                kyc.address?.state,
                kyc.address?.zipCode,
                kyc.address?.country
              ].filter(Boolean).join(', '),
              phoneNumber: kyc.phoneNumber || ''
            })
          }
        }

        const canRestoreDraft = !kycData?.kyc || ['rejected'].includes(kycData?.kyc?.status)
        if (savedDraft && canRestoreDraft) {
          if (savedDraft.personalInfo) {
            setPersonalInfo((prev) => ({ ...prev, ...savedDraft.personalInfo }))
          }
          if (savedDraft.docType && DOC_OPTIONS.some((option) => option.value === savedDraft.docType)) {
            setDocType(savedDraft.docType)
          }
          if (savedDraft.declarationChecked) {
            setDeclarationChecked(Boolean(savedDraft.declarationChecked))
          }
          if (Number.isInteger(savedDraft.step) && savedDraft.step >= 1 && savedDraft.step <= 5) {
            setStep(savedDraft.step)
          }
          if (savedDraft.savedAt) {
            setLastAutoSavedAt(savedDraft.savedAt)
          }
        }
      } catch (error) {
        console.error('Failed to initialize KYC flow:', error)
        toast.error('Failed to load KYC information')
      } finally {
        setBootLoading(false)
      }
    }

    load()
  }, [])

  const setPersonalField = (field, value) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }))
    if (declarationChecked) setDeclarationChecked(false)
  }

  const handleDocTypeChange = (nextDocType) => {
    setDocType(nextDocType)
    if (declarationChecked) setDeclarationChecked(false)
  }

  useEffect(() => {
    if (bootLoading || isReadOnlyStatus) return
    const draft = {
      step,
      docType,
      declarationChecked,
      personalInfo,
      mediaState: {
        hasFront: Boolean(frontFile),
        hasBack: Boolean(backFile),
        hasSelfie: Boolean(selfieFile),
        hasVideo: Boolean(videoFile)
      },
      savedAt: new Date().toISOString()
    }
    try {
      localStorage.setItem(KYC_DRAFT_STORAGE_KEY, JSON.stringify(draft))
      setLastAutoSavedAt(draft.savedAt)
    } catch {
      // Ignore localStorage write failures to avoid blocking the flow.
    }
  }, [
    step,
    docType,
    declarationChecked,
    personalInfo,
    frontFile,
    backFile,
    selfieFile,
    videoFile,
    bootLoading,
    isReadOnlyStatus
  ])

  useEffect(() => {
    if (bootLoading || isReadOnlyStatus) return
    const shouldSyncPersonalInfo = personalInfoComplete
    if (!shouldSyncPersonalInfo) return

    const timeoutId = setTimeout(async () => {
      try {
        const { firstName, lastName } = splitName(personalInfo.fullName)
        const address = splitAddress(personalInfo.address, personalInfo.nationality)
        await submitKycStep1({
        firstName,
        lastName,
          dateOfBirth: personalInfo.dateOfBirth,
          nationality: personalInfo.nationality,
          phoneNumber: personalInfo.phoneNumber
        })
        await submitKycStep2(address)
      } catch (error) {
        console.error('Silent autosave failed:', error)
      }
    }, 900)

    return () => clearTimeout(timeoutId)
  }, [personalInfo, personalInfoComplete, bootLoading, isReadOnlyStatus])

  const splitName = (fullName) => {
    const trimmed = fullName.trim()
    if (!trimmed) return { firstName: '', lastName: '' }
    const parts = trimmed.split(/\s+/)
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ') || parts[0]
    }
  }

  const splitAddress = (address, nationality) => {
    const parts = String(address || '').split(',').map((part) => part.trim()).filter(Boolean)
    const fallbackCountry = (nationality || '').trim() || 'N/A'

    if (!parts.length) {
      return {
        street: 'N/A',
        city: 'N/A',
        state: '',
        zipCode: '',
        country: fallbackCountry
      }
    }

    if (parts.length === 1) {
      return {
        street: parts[0],
        city: 'N/A',
        state: '',
        zipCode: '',
        country: fallbackCountry
      }
    }

    if (parts.length === 2) {
      return {
        street: parts[0],
        city: parts[1],
        state: '',
        zipCode: '',
        country: fallbackCountry
      }
    }

    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      zipCode: parts[3] || '',
      country: parts[4] || fallbackCountry
    }
  }

  const inferDocFieldNames = () => {
    const dynamicDocs = Array.isArray(kycSettings?.documents) ? kycSettings.documents : []
    const requiredDynamic = dynamicDocs.filter((doc) => doc.required)

    if (!requiredDynamic.length) {
      if (docType === 'passport') return { frontField: 'passport', backField: null }
      if (docType === 'national_id') return { frontField: 'nationalId', backField: 'nationalIdBack' }
      return { frontField: 'driverLicense', backField: 'driverLicenseBack' }
    }

    const keys = requiredDynamic.map((doc) => doc.name)
    const desired = normalize(docType)
    const frontMatch = keys.find((key) => {
      const k = normalize(key)
      const isTypeMatch = desired === 'passport'
        ? k.includes('passport')
        : desired === 'nationalid'
        ? (k.includes('national') || (k.includes('id') && !k.includes('driver')))
        : (k.includes('driver') || k.includes('license'))
      return isTypeMatch && !k.includes('back')
    }) || keys[0]

    const backMatch = keys.find((key) => {
      const k = normalize(key)
      return k.includes('back') && normalize(frontMatch) !== k
    }) || keys[1] || null

    return { frontField: frontMatch, backField: selectedDocMeta.requiresBack ? backMatch : null }
  }

  const appendKycDocuments = (formData) => {
    const dynamicDocs = Array.isArray(kycSettings?.documents) ? kycSettings.documents : []
    const configuredDocs = dynamicDocs.filter((doc) => doc?.name)

    if (!configuredDocs.length) {
      const { frontField, backField } = inferDocFieldNames()
      formData.append(frontField, frontFile, frontFile?.name || 'document-front.jpg')
      if (selectedDocMeta.requiresBack && backField && backFile) {
        formData.append(backField, backFile, backFile?.name || 'document-back.jpg')
      }
      return
    }

    const desired = normalize(docType)
    const matchScore = (docName) => {
      const key = normalize(docName)
      let score = 0

      if (desired === 'passport' && key.includes('passport')) score += 5
      if (desired === 'nationalid' && (key.includes('national') || (key.includes('id') && !key.includes('driver')))) score += 5
      if (desired === 'driverslicense' && (key.includes('driver') || key.includes('license'))) score += 5

      if (key.includes('front')) score += 2
      if (key.includes('back')) score -= 1

      return score
    }

    const sortedDocs = [...configuredDocs].sort((a, b) => matchScore(b.name) - matchScore(a.name))
    const frontTarget = sortedDocs.find((doc) => !normalize(doc.name).includes('back')) || sortedDocs[0]
    const backTarget = sortedDocs.find((doc) => normalize(doc.name).includes('back') && doc.name !== frontTarget?.name)

    // Always submit at least one configured document field name from platform settings.
    if (frontTarget && frontFile) {
      formData.append(frontTarget.name, frontFile, frontFile?.name || 'document-front.jpg')
    }

    if (selectedDocMeta.requiresBack && backFile) {
      if (backTarget) {
        formData.append(backTarget.name, backFile, backFile?.name || 'document-back.jpg')
      } else if (frontTarget && frontTarget.name !== backTarget?.name) {
        // Some admins configure only one doc field. Reuse it so at least one valid key is populated.
        formData.append(frontTarget.name, backFile, backFile?.name || 'document-back.jpg')
      }
    }

    // Safety fallback if nothing was appended for any reason.
    if (!frontTarget && frontFile) {
      const { frontField, backField } = inferDocFieldNames()
      formData.append(frontField, frontFile, frontFile?.name || 'document-front.jpg')
      if (selectedDocMeta.requiresBack && backField && backFile) {
        formData.append(backField, backFile, backFile?.name || 'document-back.jpg')
      }
    }

    // Always include canonical legacy keys to keep admin display stable across setting changes.
    if (docType === 'drivers_license') {
      if (frontFile) formData.append('driverLicense', frontFile, frontFile?.name || 'driver-license-front.jpg')
      if (backFile) formData.append('driverLicenseBack', backFile, backFile?.name || 'driver-license-back.jpg')
    } else if (docType === 'national_id') {
      if (frontFile) formData.append('nationalId', frontFile, frontFile?.name || 'national-id-front.jpg')
      if (backFile) formData.append('nationalIdBack', backFile, backFile?.name || 'national-id-back.jpg')
    } else if (docType === 'passport') {
      if (frontFile) formData.append('passport', frontFile, frontFile?.name || 'passport.jpg')
    }
  }

  const handleFrontUpload = async (file) => {
    if (!file) return
    if (!isAllowedDocumentFile(file)) {
      toast.error(FILE_TYPE_ERROR)
      return
    }
    setIsProcessingMedia(true)
    try {
      const optimizedFile = await compressImageFile(file, 'document-front.jpg')
      if (frontPreviewUrl) URL.revokeObjectURL(frontPreviewUrl)
      setFrontFile(optimizedFile)
      setFrontPreviewUrl(URL.createObjectURL(optimizedFile))
      if (declarationChecked) setDeclarationChecked(false)
    } finally {
      setIsProcessingMedia(false)
    }
  }

  const handleBackUpload = async (file) => {
    if (!file) return
    if (!isAllowedDocumentFile(file)) {
      toast.error(FILE_TYPE_ERROR)
      return
    }
    setIsProcessingMedia(true)
    try {
      const optimizedFile = await compressImageFile(file, 'document-back.jpg')
      if (backPreviewUrl) URL.revokeObjectURL(backPreviewUrl)
      setBackFile(optimizedFile)
      setBackPreviewUrl(URL.createObjectURL(optimizedFile))
      if (declarationChecked) setDeclarationChecked(false)
    } finally {
      setIsProcessingMedia(false)
    }
  }

  const handleSelfieCaptured = (blob) => {
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl)
    setSelfieFile(blob)
    setSelfiePreviewUrl(URL.createObjectURL(blob))
    setShowSelfieCapture(false)
    if (declarationChecked) setDeclarationChecked(false)
  }

  const handleVideoCaptured = (blob) => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    setVideoFile(blob)
    setVideoPreviewUrl(URL.createObjectURL(blob))
    setShowVideoCapture(false)
    if (declarationChecked) setDeclarationChecked(false)
  }

  const validateStep = (targetStep) => {
    if (targetStep === 2) {
      if (
        !personalInfo.fullName.trim() ||
        !personalInfo.dateOfBirth ||
        !personalInfo.nationality.trim() ||
        !personalInfo.address.trim() ||
        !personalInfo.phoneNumber.trim()
      ) {
        toast.error('Please complete all personal information fields')
        return false
      }
    }

    if (targetStep === 3) {
      if (!frontFile) {
        toast.error('Please upload document front side')
        return false
      }
      if (selectedDocMeta.requiresBack && !backFile) {
        toast.error('Please upload document back side')
        return false
      }
    }

    if (targetStep === 4 && !selfieFile) {
      toast.error('Please capture a selfie')
      return false
    }

    if (targetStep === 5 && !videoFile) {
      toast.error('Please record liveness video')
      return false
    }

    return true
  }

  const goNext = () => {
    const next = Math.min(5, step + 1)
    if (!validateStep(next)) return
    setStep(next)
  }

  const submitAll = async () => {
    if (loading) return
    if (!declarationChecked) {
      toast.error('Please confirm your declaration before submitting')
      return
    }
    
    if (isReadOnlyStatus) {
      toast.error('KYC is already under review or approved')
      return
    }

    if (!frontFile || (selectedDocMeta.requiresBack && !backFile) || !selfieFile || !videoFile) {
      toast.error('Please complete all steps before submission')
      return
    }
    if (isProcessingMedia) {
      toast.error('Please wait until files finish processing')
      return
    }

    const totalUploadBytes = [
      frontFile,
      selectedDocMeta.requiresBack ? backFile : null,
      selfieFile,
      videoFile
    ].filter(Boolean).reduce((sum, file) => sum + (file.size || 0), 0)

    if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
      toast.error('Uploads are too large. Use lower-size images/video and try again.')
      return
    }

    setLoading(true)
    try {
      const latest = await getMyKyc()
      if (latest?.success && latest?.kyc && ['pending', 'under_review', 'approved'].includes(latest.kyc.status)) {
        setExistingKYC(latest.kyc)
        toast.error('Your KYC is already pending review')
        return
      }

      const { firstName, lastName } = splitName(personalInfo.fullName)
      const address = splitAddress(personalInfo.address, personalInfo.nationality)

      const step1 = await submitKycStep1({
        firstName,
        lastName,
        dateOfBirth: personalInfo.dateOfBirth,
        nationality: personalInfo.nationality,
        phoneNumber: personalInfo.phoneNumber
      })
      if (!step1.success) throw new Error(step1.message || 'Step 1 failed')

      const step2 = await submitKycStep2(address)
      if (!step2.success) throw new Error(step2.message || 'Step 2 failed')

      const formData = new FormData()
      appendKycDocuments(formData)
      formData.append('selectedDocumentType', docType)
      formData.append('selfie', selfieFile, 'selfie.jpg')
      formData.append('verificationVideo', videoFile, 'verification-video.webm')

      const step3 = await submitKycStep3(formData)
      if (!step3.success) throw new Error(step3.message || 'Step 3 failed')

      toast.success('KYC submitted successfully. Your verification is under review.')
      localStorage.removeItem(KYC_DRAFT_STORAGE_KEY)
      setLastAutoSavedAt(null)
      setShowSubmitSuccess(true)
      setTimeout(() => {
        setShowSubmitSuccess(false)
        setExistingKYC((prev) => ({ ...(prev || {}), status: 'pending' }))
        setStep(5)
      }, 1700)
    } catch (error) {
      console.error('KYC submission error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to submit KYC')
    } finally {
      setLoading(false)
    }
  }

  if (bootLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 pb-20">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">KYC Verification</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Secure identity verification wizard
              {lastAutoSavedAt ? ` • Auto-saved ${new Date(lastAutoSavedAt).toLocaleTimeString()}` : ''}
            </p>
          </div>
          <div className="ml-auto hidden sm:block">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              Compliance Protected
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {!showSubmitSuccess && !isReadOnlyStatus ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Verify Your Identity</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete the steps below to unlock full account capabilities and improve account security.
                </p>
              </div>
        ) : null}

        {showSubmitSuccess ? (
          <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 p-8 text-center animate-pulse">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">Submission Successful</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your documents are being prepared for compliance review.</p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6">
          <KycWizardProgress step={step} />
        </div>
        {!showSubmitSuccess && !isReadOnlyStatus ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-sm font-semibold mb-2">Completion status</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${personalInfoComplete ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                Personal
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${documentStepComplete ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                Documents
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${selfieStepComplete ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                Selfie
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${livenessStepComplete ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                Liveness
              </span>
            </div>
        </div>
        ) : null}

        {!showSubmitSuccess && (
          existingKYC?.status === 'approved' ? (
            <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 p-6 text-center">
              <h2 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">Verification Approved</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Your identity has been verified successfully.</p>
              <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">Go to Dashboard</button>
            </div>
          ) : existingKYC && ['pending', 'under_review'].includes(existingKYC.status) ? (
            <div className="rounded-2xl border border-yellow-200 dark:border-yellow-800 bg-white dark:bg-gray-900 p-6 text-center">
              <h2 className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">Verification Under Review</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Your KYC has been submitted. Please wait for review completion.</p>
              <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold">Go to Dashboard</button>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6">
              {step === 1 ? (
                <KycStepPersonalInfo
                  form={personalInfo}
                  onChange={setPersonalField}
                  onNext={goNext}
                  loading={loading}
                  canProceed={personalInfoComplete}
                />
              ) : null}

              {step === 2 ? (
                <KycStepDocumentUpload
                  docType={docType}
                  onDocTypeChange={handleDocTypeChange}
                  frontFile={frontFile}
                  backFile={backFile}
                  frontPreviewUrl={frontPreviewUrl}
                  backPreviewUrl={backPreviewUrl}
                  onFrontUpload={handleFrontUpload}
                  onBackUpload={handleBackUpload}
                  onBack={() => setStep(1)}
                  onNext={goNext}
                  canProceed={documentStepComplete}
                />
              ) : null}

              {step === 3 ? (
                <KycStepSelfie
                  selfiePreviewUrl={selfiePreviewUrl}
                  onOpenCapture={() => setShowSelfieCapture(true)}
                  onBack={() => setStep(2)}
                  onNext={goNext}
                  canProceed={selfieStepComplete}
                />
              ) : null}

              {step === 4 ? (
                <KycStepLiveness
                  videoPreviewUrl={videoPreviewUrl}
                  onOpenRecorder={() => setShowVideoCapture(true)}
                  onBack={() => setStep(3)}
                  onNext={goNext}
                  canProceed={livenessStepComplete}
                />
              ) : null}

              {step === 5 ? (
                <KycStepReviewSubmit
                  personalInfo={personalInfo}
                  docTypeLabel={selectedDocMeta.label}
                  frontFile={frontFile}
                  backFile={backFile}
                  frontPreviewUrl={frontPreviewUrl}
                  backPreviewUrl={backPreviewUrl}
                  selfiePreviewUrl={selfiePreviewUrl}
                  videoPreviewUrl={videoPreviewUrl}
                  requiresBack={selectedDocMeta.requiresBack}
                  loading={loading}
                  canSubmit={canSubmitReview}
                  declarationChecked={declarationChecked}
                  onDeclarationChange={setDeclarationChecked}
                  onEditStep={setStep}
                  onBack={() => setStep(4)}
                  onSubmit={submitAll}
                />
              ) : null}
            </div>
          )
        )}
      </main>

      {showSelfieCapture ? (
        <SelfieCapture
          onCapture={handleSelfieCaptured}
          onCancel={() => setShowSelfieCapture(false)}
        />
      ) : null}

      {showVideoCapture ? (
        <VideoVerification
          onComplete={handleVideoCaptured}
          onCancel={() => setShowVideoCapture(false)}
        />
      ) : null}
    </div>
  )
}
