import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import VideoVerification from '../components/VideoVerification'
import SelfieCapture from '../components/SelfieCapture'

export default function KYCVerify() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [kycSettings, setKycSettings] = useState(null)
  const [existingKYC, setExistingKYC] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showVideoVerification, setShowVideoVerification] = useState(false)
  const [showSelfieCapture, setShowSelfieCapture] = useState(false)
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(null)

  // Step 1: Personal Information
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [nationality, setNationality] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Step 2: Address
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('')

  // Step 3: Documents - Dynamic
  const [documents, setDocuments] = useState({})
  const [selfie, setSelfie] = useState(null)
  const [verificationVideo, setVerificationVideo] = useState(null)

  useEffect(() => {
    fetchKYCSettings()
    fetchExistingKYC()
  }, [])

  const fetchKYCSettings = async () => {
    try {
      const response = await api.get('/api/kyc/settings')
      if (response.data.success) {
        setKycSettings(response.data.settings)
        // Initialize documents state
        if (response.data.settings.documents) {
          const docs = {}
          response.data.settings.documents.forEach(doc => {
            docs[doc.name] = null
          })
          setDocuments(docs)
        }
      }
    } catch (error) {
      console.error('Error fetching KYC settings:', error)
    }
  }

  const fetchExistingKYC = async () => {
    try {
      const response = await api.get('/api/kyc')
      if (response.data.success && response.data.kyc) {
        const kyc = response.data.kyc
        setExistingKYC(kyc)
        
        // Set step based on status
        if (kyc.status === 'pending' || kyc.status === 'under_review') {
          setStep(4) // Show under review page
        } else if (kyc.status === 'approved') {
          setStep(4) // Show approved page
        } else if (kyc.status === 'rejected') {
          // Allow resubmission - show form
          setStep(1)
        }
        
        // Pre-fill form with existing data (only if not approved)
        if (kyc.status !== 'approved') {
          setFirstName(kyc.firstName || '')
          setLastName(kyc.lastName || '')
          setDateOfBirth(kyc.dateOfBirth ? new Date(kyc.dateOfBirth).toISOString().split('T')[0] : '')
          setNationality(kyc.nationality || '')
          setPhoneNumber(kyc.phoneNumber || '')
          if (kyc.address) {
            setStreet(kyc.address.street || '')
            setCity(kyc.address.city || '')
            setState(kyc.address.state || '')
            setZipCode(kyc.address.zipCode || '')
            setCountry(kyc.address.country || '')
          }
        }
      }
    } catch (error) {
      console.error('Error fetching existing KYC:', error)
    }
  }

  const handleStep1 = async (e) => {
    e.preventDefault()
    if (!firstName || !lastName || !dateOfBirth || !nationality) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/kyc/step1', {
        firstName,
        lastName,
        dateOfBirth,
        nationality,
        phoneNumber
      })
      if (response.data.success) {
        toast.success('Personal information saved')
        setStep(2)
      }
    } catch (error) {
      console.error('Error saving step 1:', error)
      toast.error(error.response?.data?.message || 'Failed to save personal information')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    if (!street || !city || !country) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/kyc/step2', {
        street,
        city,
        state,
        zipCode,
        country
      })
      if (response.data.success) {
        toast.success('Address information saved')
        setStep(3)
      }
    } catch (error) {
      console.error('Error saving step 2:', error)
      toast.error(error.response?.data?.message || 'Failed to save address information')
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUpload = (docName, file) => {
    setDocuments({ ...documents, [docName]: file })
  }

  const handlePhotoCapture = (docName) => {
    setCurrentDocumentIndex(docName)
    setShowSelfieCapture(true)
  }

  const handleSelfieCaptured = (imageBlob) => {
    if (currentDocumentIndex) {
      handleDocumentUpload(currentDocumentIndex, imageBlob)
    } else {
      setSelfie(imageBlob)
    }
    setShowSelfieCapture(false)
    setCurrentDocumentIndex(null)
  }

  const handleVideoVerificationComplete = (videoBlob) => {
    setVerificationVideo(videoBlob)
    setShowVideoVerification(false)
  }

  const handleStep3 = async (e) => {
    e.preventDefault()
    
    // Allow resubmission only if rejected
    if (existingKYC && existingKYC.status === 'pending' || existingKYC.status === 'under_review') {
      toast.error('Your KYC verification is already pending review. Please wait for verification to complete before submitting again.')
      return
    }
    
    if (!kycSettings) {
      toast.error('KYC settings not loaded')
      return
    }

    // Validate required documents
    const missingDocs = []
    if (kycSettings.documents) {
      kycSettings.documents.forEach(doc => {
        if (doc.required) {
          // Check if document is provided via either upload or photo
          const hasDocument = documents[doc.name] !== null && documents[doc.name] !== undefined
          if (!hasDocument) {
            missingDocs.push(doc.name)
          }
        }
      })
    }

    if (kycSettings.requireSelfie && !selfie) {
      missingDocs.push('Selfie')
    }

    if (kycSettings.requireVideoVerification && !verificationVideo) {
      missingDocs.push('Video Verification')
    }

    if (missingDocs.length > 0) {
      toast.error(`Please complete: ${missingDocs.join(', ')}`)
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      
      // Add dynamic documents
      if (kycSettings.documents) {
        kycSettings.documents.forEach(doc => {
          if (documents[doc.name]) {
            formData.append(doc.name, documents[doc.name])
          }
        })
      }

      // Add selfie
      if (selfie) {
        formData.append('selfie', selfie)
      }

      // Add verification video
      if (verificationVideo) {
        formData.append('verificationVideo', verificationVideo)
      }

      const response = await api.post('/api/kyc/step3', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      if (response.data.success) {
        toast.success('KYC submission completed! Your documents are under review.')
        // Update existing KYC status
        setExistingKYC({ ...existingKYC, status: 'pending' })
        // Stay on the page to show under review message
        setStep(4) // New step for "under review"
      }
    } catch (error) {
      console.error('Error submitting KYC:', error)
      toast.error(error.response?.data?.message || 'Failed to submit documents')
    } finally {
      setLoading(false)
    }
  }

  const getDocumentKey = (docName) => {
    return docName.toLowerCase().replace(/\s+/g, '')
  }

  return (
    <>
      <style>{`
        /* Date input styling for dark mode */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
        input[type="date"]::-webkit-datetime-edit-text,
        input[type="date"]::-webkit-datetime-edit-month-field,
        input[type="date"]::-webkit-datetime-edit-day-field,
        input[type="date"]::-webkit-datetime-edit-year-field {
          color: white;
        }
        input[type="date"]::-webkit-datetime-edit-text:focus,
        input[type="date"]::-webkit-datetime-edit-month-field:focus,
        input[type="date"]::-webkit-datetime-edit-day-field:focus,
        input[type="date"]::-webkit-datetime-edit-year-field:focus {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
        }
        @media (prefers-color-scheme: dark) {
          input[type="date"]::-webkit-datetime-edit-text,
          input[type="date"]::-webkit-datetime-edit-month-field,
          input[type="date"]::-webkit-datetime-edit-day-field,
          input[type="date"]::-webkit-datetime-edit-year-field {
            color: white;
          }
        }
        .dark input[type="date"]::-webkit-datetime-edit-text,
        .dark input[type="date"]::-webkit-datetime-edit-month-field,
        .dark input[type="date"]::-webkit-datetime-edit-day-field,
        .dark input[type="date"]::-webkit-datetime-edit-year-field {
          color: white;
        }
      `}</style>
      <div className="min-h-screen bg-white dark:bg-gray-900 pb-20 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">KYC Verification</h1>
        </div>
      </header>

      {/* Status Banner */}
      {existingKYC && existingKYC.status && (
        <div className="px-4 pt-4">
          <div className={`rounded-lg p-4 mb-4 ${
            existingKYC.status === 'approved' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : existingKYC.status === 'rejected'
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-start">
              {existingKYC.status === 'approved' ? (
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : existingKYC.status === 'rejected' ? (
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <div>
                <h3 className={`text-sm font-semibold ${
                  existingKYC.status === 'approved'
                    ? 'text-green-800 dark:text-green-200'
                    : existingKYC.status === 'rejected'
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  KYC Status: {existingKYC.status.charAt(0).toUpperCase() + existingKYC.status.slice(1).replace('_', ' ')}
                </h3>
                <p className={`text-sm mt-1 ${
                  existingKYC.status === 'approved'
                    ? 'text-green-700 dark:text-green-300'
                    : existingKYC.status === 'rejected'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {existingKYC.status === 'approved' && 'Your KYC verification has been approved!'}
                  {existingKYC.status === 'rejected' && (
                    <>
                      Your KYC verification was rejected.
                      {existingKYC.rejectionReason && ` Reason: ${existingKYC.rejectionReason}`}
                    </>
                  )}
                  {(existingKYC.status === 'pending' || existingKYC.status === 'under_review') && 
                    'Your KYC verification is currently under review. Please wait for verification to complete before submitting new documents.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {step > s ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s
                  )}
                </div>
                <div className="mt-2 text-xs text-center text-gray-600 dark:text-gray-300">
                  {s === 1 && 'Personal Info'}
                  {s === 2 && 'Address'}
                  {s === 3 && 'Documents'}
                </div>
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step > s ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Information - Only show if not approved */}
        {step === 1 && (!existingKYC || existingKYC.status !== 'approved') && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Date of Birth *</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Nationality *</label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step 2: Address - Only show if not approved */}
        {step === 2 && (!existingKYC || existingKYC.status !== 'approved') && (
          <form onSubmit={handleStep2} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Street Address *</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">State/Province</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">ZIP/Postal Code</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Country *</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Documents - Show if not approved, not pending, or rejected (allow resubmission) */}
        {step === 3 && kycSettings && (!existingKYC || (existingKYC.status !== 'approved' && existingKYC.status !== 'pending' && existingKYC.status !== 'under_review')) && (
          <form onSubmit={handleStep3} className="space-y-4">
            {/* Show pending message if KYC is pending */}
            {existingKYC && (existingKYC.status === 'pending' || existingKYC.status === 'under_review') && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">KYC Verification Pending</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Your KYC verification is currently {existingKYC.status === 'pending' ? 'pending' : 'under review'}. 
                      Please wait for verification to complete before submitting new documents.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Documents */}
            {kycSettings.documents && kycSettings.documents.map((doc, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">
                  {doc.name} {doc.required && '*'}
                </label>
                <div className="space-y-2">
                  {/* Upload File Option */}
                  {doc.allowUpload && (
                    <div>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleDocumentUpload(doc.name, e.target.files[0])}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={existingKYC && (existingKYC.status === 'pending' || existingKYC.status === 'under_review')}
                        required={doc.required && !doc.usePhoto}
                      />
                      {documents[doc.name] && typeof documents[doc.name] === 'object' && documents[doc.name].name && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-700 dark:text-green-300">✓ {documents[doc.name].name} uploaded</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Photo Capture Option */}
                  {doc.usePhoto && (
                    <div>
                      {doc.allowUpload && (
                        <div className="text-xs text-gray-500 dark:text-gray-300 mb-2">OR</div>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePhotoCapture(doc.name)}
                        disabled={existingKYC && (existingKYC.status === 'pending' || existingKYC.status === 'under_review')}
                        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition mb-2"
                      >
                        📷 Take Photo
                      </button>
                      {documents[doc.name] && typeof documents[doc.name] !== 'object' && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-700 dark:text-green-300">✓ Photo captured</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* If neither option is enabled, show message */}
                  {!doc.allowUpload && !doc.usePhoto && (
                    <p className="text-xs text-gray-500 dark:text-gray-300 italic">
                      No upload method configured for this document
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Selfie */}
            {kycSettings.requireSelfie && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Selfie *</label>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDocumentIndex(null)
                    setShowSelfieCapture(true)
                  }}
                  disabled={existingKYC && (existingKYC.status === 'pending' || existingKYC.status === 'under_review')}
                  className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition mb-2"
                >
                  📷 Take Selfie
                </button>
                {selfie && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">✓ Selfie captured</p>
                  </div>
                )}
              </div>
            )}

            {/* Video Verification */}
            {kycSettings.requireVideoVerification && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Video Verification *</label>
                <p className="text-xs text-gray-500 dark:text-gray-300 mb-2">
                  Record a video following on-screen instructions (head movements, mouth, blink)
                </p>
                <button
                  type="button"
                  onClick={() => setShowVideoVerification(true)}
                  disabled={existingKYC && (existingKYC.status === 'pending' || existingKYC.status === 'under_review')}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition mb-2"
                >
                  🎥 Start Video Verification
                </button>
                {verificationVideo && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">✓ Video verification completed</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || (existingKYC && (existingKYC.status === 'pending' || existingKYC.status === 'under_review'))}
                className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Status Page (Under Review / Approved / Rejected) */}
        {step === 4 && existingKYC && (
          <div className="space-y-6">
            {existingKYC.status === 'approved' && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">KYC Verification Approved!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Congratulations! Your identity has been successfully verified. You now have full access to all platform features.
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">What you can do now:</h3>
                  <ul className="text-left space-y-2 text-green-700 dark:text-green-300">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Make deposits and withdrawals
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Access all trading features
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Enjoy enhanced account security
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {(existingKYC.status === 'pending' || existingKYC.status === 'under_review') && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-4">KYC Verification Under Review</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Thank you for submitting your KYC verification documents!
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">What happens next?</h3>
                  <ul className="text-left space-y-2 text-yellow-700 dark:text-yellow-300">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Our team is reviewing your documents
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      This process typically takes 24-48 hours
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      We will notify you via email once your verification is complete
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  You will receive an email notification once your verification status is updated.
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {existingKYC.status === 'rejected' && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">KYC Verification Rejected</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Unfortunately, your KYC verification could not be approved at this time.
                </p>
                {existingKYC.rejectionReason && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Rejection Reason:</h3>
                    <p className="text-red-700 dark:text-red-300">{existingKYC.rejectionReason}</p>
                  </div>
                )}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">What to do next:</h3>
                  <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Review the rejection reason provided above
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ensure all documents are clear and valid
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Resubmit your KYC verification
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setStep(1)
                    setExistingKYC(null) // Reset to allow resubmission
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Resubmit KYC
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Verification Modal */}
      {showVideoVerification && (
        <VideoVerification
          onComplete={handleVideoVerificationComplete}
          onCancel={() => setShowVideoVerification(false)}
        />
      )}

      {/* Selfie Capture Modal */}
      {showSelfieCapture && (
        <SelfieCapture
          onCapture={handleSelfieCaptured}
          onCancel={() => {
            setShowSelfieCapture(false)
            setCurrentDocumentIndex(null)
          }}
        />
      )}
    </div>
    </>
  )
}
