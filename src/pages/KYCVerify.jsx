import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getMyKyc,
  submitKycStep1,
  submitKycSsn,
  submitKycDocuments,
  submitKycIdentityDetails,
  sendKycOtp,
  verifyKycOtp
} from '../api/modules/kycApi'
import { emptyKycForm, getIdentityProfile, KYC_DRAFT_KEY } from '../modules/kyc/config/steps'
import {
  validateAddress,
  validateContact,
  validateDocuments,
  validateGovId,
  validatePersonal,
  validateProof,
  validateResidencyChoice,
  validateResidencyPhoto,
  validateSelfie,
  validateSinStep
} from '../modules/kyc/validation/kycValidation'
import KycShell from '../modules/kyc/components/KycShell'
import StepWelcome from '../modules/kyc/components/steps/StepWelcome'
import StepPersonal from '../modules/kyc/components/steps/StepPersonal'
import StepAddress from '../modules/kyc/components/steps/StepAddress'
import StepSin from '../modules/kyc/components/steps/StepSin'
import StepGovIdCapture from '../modules/kyc/components/steps/StepGovIdCapture'
import StepResidencyChoice from '../modules/kyc/components/steps/StepResidencyChoice'
import StepResidencyCapture from '../modules/kyc/components/steps/StepResidencyCapture'
import StepSelfieCapture from '../modules/kyc/components/steps/StepSelfieCapture'
import StepProofAddress from '../modules/kyc/components/steps/StepProofAddress'
import StepReview from '../modules/kyc/components/steps/StepReview'
import StepSubmission from '../modules/kyc/components/steps/StepSubmission'
import StepKycOtp from '../modules/kyc/components/steps/StepKycOtp'

function mapExistingUrls(kyc) {
  if (!kyc) return { front: '', back: '', selfie: '', passport: '', proof: '' }
  const docs = kyc.documents instanceof Map ? Object.fromEntries(kyc.documents) : kyc.documents || {}
  return {
    front: kyc.documentFront || docs.documentFront || docs.drivers_license || '',
    back: kyc.documentBack || docs.documentBack || docs.drivers_licenseBack || '',
    selfie: kyc.selfie || docs.liveSelfie || kyc.legacyDocuments?.liveSelfie || '',
    passport:
      docs.passport ||
      docs.permanent_resident_card ||
      kyc.legacyDocuments?.passport ||
      '',
    proof: docs.proofOfAddress || kyc.legacyDocuments?.proofOfAddress || ''
  }
}

export default function KYCVerify() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [bootLoading, setBootLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyKycForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [files, setFiles] = useState({
    front: null,
    back: null,
    selfie: null,
    passport: null,
    proof: null
  })
  const [previews, setPreviews] = useState({
    front: '',
    back: '',
    selfie: '',
    passport: '',
    proof: ''
  })
  const [existing, setExisting] = useState({
    front: '',
    back: '',
    selfie: '',
    passport: '',
    proof: ''
  })
  const [kycMeta, setKycMeta] = useState(null)
  const [completion, setCompletion] = useState(null)
  const [otpPage, setOtpPage] = useState(null)
  const [otpError, setOtpError] = useState('')

  const isReadOnly =
    kycMeta &&
    ['pending', 'under_review', 'approved'].includes(kycMeta.status) &&
    !kycMeta.resubmissionRequested

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const markTouched = (keys) => {
    setTouched((prev) => {
      const next = { ...prev }
      keys.forEach((k) => {
        next[k] = true
      })
      return next
    })
  }

  const handleFile = (key, file) => {
    setFiles((prev) => ({ ...prev, [key]: file }))
    if (file?.type?.startsWith('image/')) {
      setPreviews((prev) => {
        if (prev[key]) URL.revokeObjectURL(prev[key])
        return { ...prev, [key]: URL.createObjectURL(file) }
      })
    } else {
      setPreviews((prev) => ({ ...prev, [key]: '' }))
    }
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      delete next.file
      return next
    })
  }

  const clearFile = (key) => {
    setFiles((prev) => ({ ...prev, [key]: null }))
    setPreviews((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key])
      return { ...prev, [key]: '' }
    })
    setExisting((prev) => ({ ...prev, [key]: '' }))
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setBootLoading(true)
      try {
        let draft = null
        try {
          const raw = localStorage.getItem(KYC_DRAFT_KEY)
          draft = raw ? JSON.parse(raw) : null
        } catch {
          draft = null
        }

        const data = await getMyKyc()
        if (cancelled) return

        if (data?.success && data.kyc) {
          const kyc = data.kyc
          setKycMeta(kyc)
          setExisting(mapExistingUrls(kyc))

          if (
            ['approved', 'pending', 'under_review'].includes(kyc.status) &&
            !kyc.resubmissionRequested
          ) {
            setCompletion({
              status: kyc.status,
              referenceNumber: kyc.referenceNumber,
              expectedReviewHours: kyc.expectedReviewHours || 48
            })
            setStep(11)
            localStorage.removeItem(KYC_DRAFT_KEY)
            setBootLoading(false)
            return
          }

          setForm((prev) => ({
            ...prev,
            firstName: kyc.firstName || prev.firstName,
            lastName: kyc.lastName || prev.lastName,
            dateOfBirth: kyc.dateOfBirth
              ? (() => {
                  // Avoid UTC day-shift for calendar dates
                  const raw = String(kyc.dateOfBirth)
                  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
                  const d = new Date(kyc.dateOfBirth)
                  if (Number.isNaN(d.getTime())) return prev.dateOfBirth
                  const y = d.getFullYear()
                  const m = String(d.getMonth() + 1).padStart(2, '0')
                  const day = String(d.getDate()).padStart(2, '0')
                  return `${y}-${m}-${day}`
                })()
              : prev.dateOfBirth,
            gender: kyc.gender || prev.gender,
            nationality: kyc.nationality || prev.nationality,
            countryOfResidence: kyc.address?.country || prev.countryOfResidence,
            street: kyc.address?.street || prev.street,
            city: kyc.address?.city || prev.city,
            state: kyc.address?.state || prev.state,
            postalCode: kyc.address?.zipCode || prev.postalCode,
            phone: kyc.phoneNumber || prev.phone,
            documentType: kyc.documentType || prev.documentType,
            governmentIdType: kyc.documentType || prev.governmentIdType
          }))
        }

        if (draft?.form) setForm((prev) => ({ ...prev, ...draft.form }))
        if (Number.isInteger(draft?.step) && draft.step >= 1 && draft.step <= 10) {
          setStep(draft.step)
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load KYC')
      } finally {
        if (!cancelled) setBootLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const api = (await import('../utils/axios')).default
        const { data } = await api.get('/api/auth/me')
        if (data?.user?.email) {
          setForm((prev) => ({
            ...prev,
            email: prev.email || data.user.email,
            phone: prev.phone || data.user.phone || '',
            firstName:
              prev.firstName ||
              (data.user.fullName ? data.user.fullName.split(/\s+/)[0] : '') ||
              '',
            lastName:
              prev.lastName ||
              (data.user.fullName
                ? data.user.fullName.split(/\s+/).slice(1).join(' ')
                : '') ||
              ''
          }))
        }
      } catch {
        /* ignore */
      }
    })()
  }, [])

  useEffect(() => {
    if (bootLoading || isReadOnly || step >= 11) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          KYC_DRAFT_KEY,
          JSON.stringify({ step, form, savedAt: new Date().toISOString() })
        )
      } catch {
        /* ignore */
      }
    }, 400)
    return () => clearTimeout(t)
  }, [step, form, bootLoading, isReadOnly])

  const saveExit = () => {
    try {
      localStorage.setItem(
        KYC_DRAFT_KEY,
        JSON.stringify({ step, form, savedAt: new Date().toISOString() })
      )
      toast.success('Progress saved')
    } catch {
      /* ignore */
    }
    navigate('/dashboard')
  }

  const persistPersonalBlock = async () => {
    const street = [form.street, form.apartment].filter(Boolean).join(', ')
    return submitKycStep1({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      fullName: [form.firstName, form.middleName, form.lastName]
        .filter(Boolean)
        .map((s) => s.trim())
        .join(' '),
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      nationality: form.nationality,
      phoneNumber: form.phone,
      street,
      city: form.city,
      state: form.state,
      zipCode: form.postalCode,
      country: form.countryOfResidence
    })
  }

  const uploadAllDocuments = async () => {
    const profile = getIdentityProfile(form.countryOfResidence || form.nationality)
    const docType = form.documentType || profile.govIdType || 'drivers_license'
    const fd = new FormData()
    fd.append('documentType', docType)
    if (files.front) fd.append('front', files.front)
    if (files.back) fd.append('back', files.back)
    if (files.selfie) fd.append('selfie', files.selfie)
    if (files.passport) fd.append('passport', files.passport)
    return submitKycDocuments(fd)
  }

  const goNext = async () => {
    if (step === 1) {
      setStep(2)
      return
    }

    if (step === 2) {
      const e = { ...validatePersonal(form), ...validateContact(form) }
      setErrors(e)
      markTouched([
        'firstName',
        'lastName',
        'dateOfBirth',
        'gender',
        'nationality',
        'countryOfResidence',
        'email',
        'phone'
      ])
      if (Object.keys(e).length) {
        toast.error('Please fix the highlighted fields')
        return
      }
      setStep(3)
      return
    }

    // 3 — Address → save personal block → SIN (no separate contact page)
    if (step === 3) {
      const e = validateAddress(form)
      setErrors(e)
      markTouched(['street', 'city', 'state', 'postalCode'])
      if (Object.keys(e).length) {
        toast.error('Please complete your address')
        return
      }
      // Contact already collected on personal step
      const contactErr = validateContact(form)
      if (Object.keys(contactErr).length) {
        setErrors(contactErr)
        markTouched(['email', 'phone'])
        toast.error('Add email and phone on the personal step')
        setStep(2)
        return
      }
      setLoading(true)
      try {
        const data = await persistPersonalBlock()
        if (!data.success) throw new Error(data.message || 'Save failed')
        if (data.kyc) setKycMeta(data.kyc)
        setStep(4)
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Failed to save')
      } finally {
        setLoading(false)
      }
      return
    }

    // 4 — SIN / SSN
    if (step === 4) {
      const e = validateSinStep(form)
      setErrors(e)
      markTouched(['taxId', 'taxIdConfirm'])
      if (Object.keys(e).length) {
        toast.error(`Please complete your ${getIdentityProfile(form.countryOfResidence || form.nationality).shortLabel} correctly`)
        return
      }
      setLoading(true)
      try {
        await persistPersonalBlock().catch(() => null)
        const profile = getIdentityProfile(form.countryOfResidence || form.nationality)
        setField('documentType', '')
        setField('governmentIdType', '')
        setFiles((prev) => ({ ...prev, front: null, back: null }))
        setPreviews((prev) => {
          if (prev.front) URL.revokeObjectURL(prev.front)
          if (prev.back) URL.revokeObjectURL(prev.back)
          return { ...prev, front: '', back: '' }
        })

        const rawId = String(form.taxId || '')
        const rawConfirm = String(form.taxIdConfirm || '')
        const digits = (v) => v.replace(/\D/g, '')
        const compact = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '')

        const payload =
          profile.taxKey === 'ssn'
            ? {
                taxIdType: 'ssn',
                ssn: digits(rawId),
                ssnConfirm: digits(rawConfirm)
              }
            : profile.taxKey === 'sin'
              ? {
                  taxIdType: 'sin',
                  sin: digits(rawId),
                  sinConfirm: digits(rawConfirm)
                }
              : {
                  taxIdType: profile.taxKey || 'national_id',
                  nationalId: profile.digitsOnly ? digits(rawId) : compact(rawId),
                  nationalIdConfirm: profile.digitsOnly ? digits(rawConfirm) : compact(rawConfirm),
                  countryCode: form.countryOfResidence || form.nationality || ''
                }

        const data = await submitKycSsn(payload)
        if (!data.success) throw new Error(data.message || 'Failed')
        setStep(5)
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Failed to save')
      } finally {
        setLoading(false)
      }
      return
    }

    // 5 gov id camera · 6 residency choice · 7 residency photo · 8 selfie

    if (step === 9) {
      const e = validateProof({ file: files.proof, existing: existing.proof })
      setErrors(e)
      if (Object.keys(e).length) {
        toast.error('Upload proof of address')
        return
      }
      if (files.proof) {
        setLoading(true)
        try {
          const fd = new FormData()
          fd.append('mode', 'proof_of_address')
          fd.append('documentType', form.documentType || 'drivers_license')
          fd.append('proofOfAddress', files.proof)
          const data = await submitKycDocuments(fd)
          if (!data.success) throw new Error(data.message || 'Upload failed')
          if (data.kyc) {
            setKycMeta(data.kyc)
            setExisting(mapExistingUrls(data.kyc))
          }
          setStep(10)
        } catch (err) {
          toast.error(err.response?.data?.message || err.message || 'Upload failed')
        } finally {
          setLoading(false)
        }
      } else {
        setStep(10)
      }
      return
    }

    if (step === 10) {
      const profile = getIdentityProfile(form.countryOfResidence || form.nationality)
      const e = validateDocuments({
        documentType: form.documentType || profile.govIdType,
        frontFile: files.front,
        backFile: files.back,
        selfieFile: files.selfie,
        passportFile: files.passport,
        existing
      })
      if (Object.keys(e).length) {
        toast.error('Missing required documents — go back and complete photos')
        setErrors(e)
        return
      }

      setLoading(true)
      setOtpError('')
      try {
        if (files.front || files.back || files.selfie || files.passport) {
          const up = await uploadAllDocuments()
          if (!up.success) throw new Error(up.message || 'Upload failed')
          if (up.kyc) {
            setKycMeta(up.kyc)
            setExisting(mapExistingUrls(up.kyc))
          }
        }

        await submitKycIdentityDetails({
          occupation: 'Individual investor',
          sourceOfFunds: 'employment',
          taxResidency: form.countryOfResidence || form.nationality || 'US',
          purposeOfAccount: 'trading',
          additionalNotes: `email=${form.email}; residency=${form.residencyType}; poa=${form.poaType}`
        })

        const otpSend = await sendKycOtp()
        if (!otpSend.success) throw new Error(otpSend.message || 'Failed to start verification')

        // Full-page OTP — code sent to blended phone (never shown to user)
        setOtpPage({
          sentTo: otpSend.otpSentTo || 'your phone',
          otpExpiresInSec: otpSend.otpExpiresInSec || 900
        })
        setOtpError('')
        toast.success(otpSend.message || 'Verification code sent')
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Submission failed')
      } finally {
        setLoading(false)
      }
    }
  }

  const afterGovId = () => {
    setStep(6)
  }

  const afterResidencyPhoto = () => {
    setStep(8)
  }

  const afterSelfie = async (selfieFile) => {
    setLoading(true)
    try {
      const profile = getIdentityProfile(form.countryOfResidence || form.nationality)
      const docType = form.documentType || profile.govIdType || 'drivers_license'
      const fd = new FormData()
      fd.append('documentType', docType)
      if (files.front) fd.append('front', files.front)
      if (files.back) fd.append('back', files.back)
      if (selfieFile) fd.append('selfie', selfieFile)
      else if (files.selfie) fd.append('selfie', files.selfie)
      if (files.passport) fd.append('passport', files.passport)
      const data = await submitKycDocuments(fd)
      if (!data.success) throw new Error(data.message || 'Upload failed')
      if (data.kyc) {
        setKycMeta(data.kyc)
        setExisting(mapExistingUrls(data.kyc))
      }
      toast.success('Photos uploaded')
      setStep(9)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed')
      setStep(9)
    } finally {
      setLoading(false)
    }
  }

  const confirmOtp = async (code) => {
    const clean = String(code || '').replace(/\D/g, '')
    if (!clean || clean.length < 6) {
      setOtpError('Enter the 6-digit code')
      return false
    }
    setLoading(true)
    setOtpError('')
    try {
      const data = await verifyKycOtp({ otp: clean })
      if (!data.success) throw new Error(data.message || 'Submit failed')
      // Buy-style: waiting for admin unless already completed
      if (data.completed || data.kyc?.otpVerified) {
        localStorage.removeItem(KYC_DRAFT_KEY)
        setOtpPage(null)
        setCompletion({
          status: data.kyc?.status || 'pending',
          referenceNumber: data.referenceNumber || data.kyc?.referenceNumber,
          expectedReviewHours: data.expectedReviewHours || 48
        })
        setKycMeta(data.kyc || { status: 'pending' })
        setStep(11)
        toast.success('KYC submitted successfully')
      }
      return true
    } catch (err) {
      const payload = err.response?.data || {}
      const msg = payload.message || err.message || 'Could not submit code'
      // Auto-resend when session expired / missing
      if (payload.canResend || payload.code === 'OTP_EXPIRED' || payload.code === 'NO_SESSION') {
        try {
          const otpSend = await sendKycOtp()
          if (otpSend?.success) {
            setOtpPage({
              sentTo: otpSend.otpSentTo || 'your phone',
              otpExpiresInSec: otpSend.otpExpiresInSec || 1800
            })
            setOtpError('Previous code expired. A new code was sent — enter the new one.')
            toast.success(otpSend.message || 'New code sent')
            return false
          }
        } catch {
          /* fall through */
        }
      }
      setOtpError(msg)
      return false
    } finally {
      setLoading(false)
    }
  }

  const onKycOtpCompleted = (data) => {
    localStorage.removeItem(KYC_DRAFT_KEY)
    setOtpPage(null)
    setCompletion({
      status: data?.kyc?.status || data?.status || 'pending',
      referenceNumber: data?.referenceNumber || data?.kyc?.referenceNumber,
      expectedReviewHours: data?.expectedReviewHours || 48
    })
    setKycMeta(data?.kyc || { status: data?.status || 'pending' })
    setStep(11)
    toast.success('OTP approved — KYC submitted for review')
  }

  const onKycOtpRejected = () => {
    setOtpError('Incorrect code. Please try again.')
  }

  const resendKycOtpCode = async () => {
    try {
      const otpSend = await sendKycOtp()
      if (!otpSend.success) throw new Error(otpSend.message || 'Resend failed')
      setOtpPage((p) => ({
        sentTo: otpSend.otpSentTo || p?.sentTo || 'your phone',
        otpExpiresInSec: otpSend.otpExpiresInSec || p?.otpExpiresInSec || 900
      }))
      setOtpError('')
      toast.success(otpSend.message || 'New code sent')
      return otpSend
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Resend failed')
      return false
    }
  }

  const goBack = () => {
    if (step <= 1) {
      navigate(-1)
      return
    }
    if (step === 11) return
    setStep((s) => Math.max(1, s - 1))
    setErrors({})
  }

  const stepMeta = useMemo(() => {
    const idProfile = getIdentityProfile(form.countryOfResidence || form.nationality)
    const map = {
      1: {
        title: 'Verify your identity',
        description: 'A secure, guided process — usually under 10 minutes.'
      },
      2: {
        title: 'Personal information',
        description: 'Legal name, date of birth, email, and phone.'
      },
      3: {
        title: 'Residential address',
        description: 'Where you currently live — must match your proof of address.'
      },
      4: {
        title: idProfile.shortLabel || idProfile.taxLabel,
        description: `Enter your ${idProfile.shortLabel} for ${idProfile.countryName || 'your country'}.`
      },
      5: { title: '', description: '' },
      6: {
        title: 'PR or Passport',
        description: 'Choose the residency document you will photograph next.'
      },
      7: { title: '', description: '' },
      8: { title: '', description: '' },
      9: {
        title: 'Proof of address',
        description: 'A recent bill or statement showing your name and address.'
      },
      10: {
        title: 'Review & submit',
        description: 'Double-check your details before sending for review.'
      },
      11: { title: '', description: '' }
    }
    return map[step] || map[1]
  }, [step, form.countryOfResidence, form.nationality])

  if (bootLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 rounded-full border-2 border-[#1199fa] border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500">Loading verification…</p>
      </div>
    )
  }

  // Full-page OTP after review submit
  if (otpPage) {
    return (
      <StepKycOtp
        sentTo={otpPage.sentTo}
        expiresInSec={otpPage.otpExpiresInSec || 900}
        loading={loading}
        error={otpError}
        onVerify={confirmOtp}
        onResend={resendKycOtpCode}
        onCompleted={onKycOtpCompleted}
        onRejected={onKycOtpRejected}
        onBack={() => {
          setOtpPage(null)
          setOtpError('')
        }}
      />
    )
  }

  if (step === 11 || isReadOnly) {
    return (
      <KycShell step={11} hideProgress showNav={false} title="" onSaveExit={null}>
        <StepSubmission
          status={completion?.status || kycMeta?.status || 'pending'}
          referenceNumber={completion?.referenceNumber || kycMeta?.referenceNumber}
          expectedReviewHours={completion?.expectedReviewHours || 48}
          onDone={() => navigate('/dashboard')}
        />
      </KycShell>
    )
  }

  // Full-page camera steps (Background Search style)
  // 5 = gov ID · 7 = residency photo · 8 = selfie
  if (step === 5) {
    return (
      <StepGovIdCapture
        form={form}
        files={files}
        previews={previews}
        existing={existing}
        onChange={setField}
        onFile={handleFile}
        onBack={goBack}
        onComplete={afterGovId}
      />
    )
  }

  if (step === 7) {
    return (
      <StepResidencyCapture
        form={form}
        onFile={handleFile}
        onBack={goBack}
        onComplete={afterResidencyPhoto}
      />
    )
  }

  if (step === 8) {
    return (
      <StepSelfieCapture
        onFile={handleFile}
        onBack={goBack}
        onComplete={afterSelfie}
      />
    )
  }

  return (
    <KycShell
      step={step}
      title={stepMeta.title}
      description={stepMeta.description}
      onBack={goBack}
      onContinue={goNext}
      onSaveExit={saveExit}
      continueLabel={
        step === 1 ? 'Get started' : step === 10 ? 'Submit verification' : 'Continue'
      }
      loading={loading}
      continueDisabled={loading}
      showNav={step !== 6}
    >
      {kycMeta?.status === 'rejected' && step < 11 ? (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          Previous submission rejected
          {kycMeta.rejectionReason ? `: ${kycMeta.rejectionReason}` : '.'} Please update and resubmit.
        </div>
      ) : null}

      {step === 1 && <StepWelcome />}
      {step === 2 && (
        <StepPersonal form={form} errors={errors} onChange={setField} touched={touched} />
      )}
      {step === 3 && (
        <StepAddress form={form} errors={errors} onChange={setField} touched={touched} />
      )}
      {step === 4 && (
        <StepSin form={form} errors={errors} onChange={setField} touched={touched} />
      )}
      {step === 6 && (
        <StepResidencyChoice
          form={form}
          errors={errors}
          onChange={setField}
          touched={touched}
          onPicked={() => setStep(7)}
        />
      )}
      {step === 9 && (
        <StepProofAddress
          form={form}
          onChange={setField}
          file={files.proof}
          preview={previews.proof}
          existing={existing.proof}
          error={errors.file}
          onFile={(f) => handleFile('proof', f)}
          onClear={() => clearFile('proof')}
        />
      )}
      {step === 10 && (
        <StepReview
          form={form}
          files={files}
          existing={existing}
          onEdit={(s) => {
            setStep(s)
            setErrors({})
          }}
        />
      )}

    </KycShell>
  )
}
