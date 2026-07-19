import { useState, useEffect, useMemo } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import { getImageUrl } from '../../utils/imageUrl.js'
import SkeletonBlock from '../common/SkeletonBlock'

/** Build candidate image URLs (proxy + direct API) so previews load reliably in admin */
function buildImageCandidates(url) {
  if (!url) return []
  const list = []
  const push = (u) => {
    if (u && !list.includes(u)) list.push(u)
  }
  push(url)
  // If relative /uploads path, also try absolute local API
  if (url.startsWith('/')) {
    push(`http://localhost:5000${url}`)
    push(`http://127.0.0.1:5000${url}`)
  }
  // If production API URL is embedded, try relative for Vite proxy
  try {
    const u = new URL(url, window.location.origin)
    if (u.pathname.startsWith('/uploads')) {
      push(u.pathname + u.search)
      push(`http://localhost:5000${u.pathname}${u.search}`)
    }
  } catch {
    /* ignore */
  }
  return list
}

/**
 * Managed document box:
 * - Fixed frame so layout stays stable
 * - Clear loading → loaded states
 * - Full image (object-contain), click to enlarge
 */
function DocumentPreview({ doc, onOpenLightbox }) {
  const candidates = useMemo(() => buildImageCandidates(doc.url), [doc.url])
  const [srcIndex, setSrcIndex] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [loading, setLoading] = useState(doc.type === 'image' || doc.type === 'video')
  const [natural, setNatural] = useState({ w: 0, h: 0 })

  const currentSrc = candidates[srcIndex] || doc.url

  useEffect(() => {
    setSrcIndex(0)
    setImageFailed(false)
    setVideoFailed(false)
    setLoading(doc.type === 'image' || doc.type === 'video')
    setNatural({ w: 0, h: 0 })
  }, [doc.url, doc.type])

  // Preload to detect load/fail early
  useEffect(() => {
    if (doc.type !== 'image' || !currentSrc || imageFailed) return undefined
    let cancelled = false
    setLoading(true)
    const img = new window.Image()
    img.onload = () => {
      if (cancelled) return
      setNatural({ w: img.naturalWidth || 0, h: img.naturalHeight || 0 })
      setLoading(false)
      setImageFailed(false)
    }
    img.onerror = () => {
      if (cancelled) return
      if (srcIndex + 1 < candidates.length) {
        setSrcIndex((i) => i + 1)
      } else {
        setLoading(false)
        setImageFailed(true)
      }
    }
    img.src = currentSrc
    return () => {
      cancelled = true
    }
  }, [currentSrc, doc.type, srcIndex, candidates.length, imageFailed])

  if (doc.type === 'image') {
    return (
      <div className="rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-inner">
        {/* Status bar */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
              imageFailed
                ? 'text-red-600'
                : loading
                  ? 'text-amber-600'
                  : 'text-emerald-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                imageFailed
                  ? 'bg-red-500'
                  : loading
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500'
              }`}
            />
            {imageFailed ? 'Failed to load' : loading ? 'Loading image…' : 'Image loaded'}
          </span>
          {!loading && !imageFailed && natural.w > 0 && (
            <span className="text-[10px] text-slate-400 tabular-nums">
              {natural.w}×{natural.h}px
            </span>
          )}
        </div>

        {/* Managed image frame */}
        <button
          type="button"
          onClick={() => !imageFailed && onOpenLightbox?.({ ...doc, url: currentSrc })}
          disabled={imageFailed}
          className="relative block w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          title={imageFailed ? 'Image unavailable' : 'Click to enlarge'}
        >
          <div
            className="relative w-full flex items-center justify-center"
            style={{
              minHeight: 280,
              height: 340,
              backgroundImage:
                'linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0,0 8px,8px -8px,-8px 0'
            }}
          >
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/70 dark:bg-slate-900/70">
                <div className="w-10 h-10 border-[3px] border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Loading document image…
                </span>
              </div>
            )}

            {imageFailed ? (
              <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Could not display image</p>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-cyan-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open file in new tab
                </a>
              </div>
            ) : (
              <img
                src={currentSrc}
                alt={doc.label}
                loading="eager"
                decoding="async"
                className={`max-w-full max-h-[320px] w-auto h-auto object-contain drop-shadow-md transition-opacity duration-300 ${
                  loading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={(e) => {
                  setLoading(false)
                  setNatural({
                    w: e.currentTarget.naturalWidth || 0,
                    h: e.currentTarget.naturalHeight || 0
                  })
                }}
                onError={() => {
                  if (srcIndex + 1 < candidates.length) {
                    setSrcIndex((i) => i + 1)
                  } else {
                    setLoading(false)
                    setImageFailed(true)
                  }
                }}
              />
            )}

            {!loading && !imageFailed && (
              <span className="absolute bottom-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-900/75 text-white shadow opacity-90 group-hover:opacity-100">
                Click to enlarge
              </span>
            )}
          </div>
        </button>
      </div>
    )
  }

  if (doc.type === 'video') {
    return (
      <div className="rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-inner">
        {/* Status bar — same pattern as images */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
              videoFailed
                ? 'text-red-600'
                : loading
                  ? 'text-amber-600'
                  : 'text-emerald-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                videoFailed
                  ? 'bg-red-500'
                  : loading
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500'
              }`}
            />
            {videoFailed ? 'Failed to load' : loading ? 'Loading video…' : 'Video ready'}
          </span>
          {!loading && !videoFailed && (
            <span className="text-[10px] text-slate-400">Use controls to play</span>
          )}
        </div>

        {/* Managed video frame */}
        <div
          className="relative w-full flex items-center justify-center bg-black"
          style={{ minHeight: 280, height: 340 }}
        >
          {loading && !videoFailed && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70">
              <div className="w-10 h-10 border-[3px] border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-slate-200">Loading verification video…</span>
            </div>
          )}

          {videoFailed ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm font-medium text-slate-300">Could not display video</p>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-cyan-400 hover:underline"
              >
                Open video in new tab
              </a>
              {srcIndex + 1 < candidates.length && (
                <button
                  type="button"
                  className="text-xs text-amber-400 hover:underline"
                  onClick={() => {
                    setVideoFailed(false)
                    setLoading(true)
                    setSrcIndex((i) => i + 1)
                  }}
                >
                  Try alternate source
                </button>
              )}
            </div>
          ) : (
            <video
              key={currentSrc}
              src={currentSrc}
              controls
              playsInline
              preload="auto"
              className={`max-w-full max-h-[320px] w-full h-auto object-contain bg-black transition-opacity duration-300 ${
                loading ? 'opacity-40' : 'opacity-100'
              }`}
              onLoadedData={() => {
                setLoading(false)
                setVideoFailed(false)
              }}
              onCanPlay={() => {
                setLoading(false)
                setVideoFailed(false)
              }}
              onError={() => {
                if (srcIndex + 1 < candidates.length) {
                  setSrcIndex((i) => i + 1)
                  setLoading(true)
                } else {
                  setLoading(false)
                  setVideoFailed(true)
                }
              }}
            />
          )}

          {!loading && !videoFailed && (
            <button
              type="button"
              onClick={() => onOpenLightbox?.({ ...doc, url: currentSrc, type: 'video' })}
              className="absolute bottom-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-900/80 text-white shadow hover:bg-slate-800"
            >
              Fullscreen
            </button>
          )}
        </div>
      </div>
    )
  }

  if (doc.type === 'pdf') {
    return (
      <div className="rounded-xl border-2 border-slate-200 dark:border-slate-600 overflow-hidden space-y-0">
        <iframe
          src={doc.url}
          title={doc.label}
          className="w-full h-96 bg-white"
        />
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-cyan-600 hover:underline"
          >
            Open PDF in new tab
          </a>
        </div>
      </div>
    )
  }

  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-cyan-400 transition"
    >
      <span className="truncate font-medium">Open file</span>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </a>
  )
}

function ImageLightbox({ doc, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!doc) return null

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/92 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={doc.label}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-black/40">
        <p className="text-sm font-semibold text-white truncate">{doc.label}</p>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            Open original
          </a>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg bg-white text-slate-900 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
      <div
        className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center"
        onClick={onClose}
        style={{
          backgroundImage:
            'linear-gradient(45deg,#1e293b 25%,transparent 25%),linear-gradient(-45deg,#1e293b 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1e293b 75%),linear-gradient(-45deg,transparent 75%,#1e293b 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0,0 10px,10px -10px,-10px 0'
        }}
      >
        {doc.type === 'video' ? (
          <video
            src={doc.url}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-[calc(100vh-6rem)] w-auto rounded-lg shadow-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={doc.url}
            alt={doc.label}
            className="max-w-full max-h-[calc(100vh-6rem)] object-contain rounded-lg shadow-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  )
}

function isOtpPending(kyc) {
  return (
    kyc?.otpVerification?.status === 'submitted' && !kyc?.otpVerification?.verified
  )
}

export default function KYCLogList() {
  const [kycs, setKycs] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  // Default to OTP queue so admins land where user-entered codes appear
  const [statusFilter, setStatusFilter] = useState('otp_queue')
  const [selectedKYC, setSelectedKYC] = useState(null)
  const [rejectModal, setRejectModal] = useState({ open: false, id: null })
  const [rejectReason, setRejectReason] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [lightboxDoc, setLightboxDoc] = useState(null)

  useEffect(() => {
    fetchKYCs()
  }, [statusFilter])

  // Live poll OTP queue (same idea as buy OTP)
  useEffect(() => {
    if (statusFilter !== 'otp_queue' && statusFilter !== 'all') return undefined
    const t = setInterval(() => fetchKYCs({ silent: true }), 4000)
    return () => clearInterval(t)
  }, [statusFilter])

  const fetchKYCs = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const url =
        statusFilter === 'all' ? '/api/admin/kyc' : `/api/admin/kyc?status=${statusFilter}`
      const response = await api.get(url)
      if (response.data.success) {
        setKycs(response.data.kycs || [])
        if (response.data.counts) setCounts(response.data.counts)
      }
    } catch (error) {
      console.error('Error fetching KYC logs:', error)
      if (!silent) toast.error('Failed to fetch KYC logs')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const openKycDetail = async (kyc) => {
    try {
      const response = await api.get(`/api/admin/kyc/${kyc._id}`)
      if (response.data?.success && response.data.kyc) {
        setSelectedKYC(response.data.kyc)
        setReviewNotes(response.data.kyc.reviewNotes || '')
        return
      }
    } catch (error) {
      console.error('Error fetching KYC details:', error)
      toast.error('Failed to load complete KYC details')
    }
    setSelectedKYC(kyc)
  }

  const handleApprove = async (id) => {
    try {
      const response = await api.post(`/api/admin/kyc/${id}/approve`, {
        reviewNotes: reviewNotes || undefined
      })
      if (response.data.success) {
        toast.success('KYC approved successfully')
        fetchKYCs()
        setSelectedKYC(null)
        setReviewNotes('')
      }
    } catch (error) {
      console.error('Error approving KYC:', error)
      toast.error(error.response?.data?.message || 'Failed to approve KYC')
    }
  }

  const decideKycOtp = async (id, decision) => {
    try {
      const response = await api.post(`/api/admin/kyc/${id}/decide-otp`, {
        decision,
        note: reviewNotes || undefined
      })
      if (response.data.success) {
        toast.success(response.data.message || `OTP ${decision}`)
        setSelectedKYC(response.data.kyc)
        fetchKYCs()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP decision failed')
    }
  }

  const handleReject = async (id, reason) => {
    if (!reason?.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    try {
      const response = await api.post(`/api/admin/kyc/${id}/reject`, {
        rejectionReason: reason.trim(),
        reviewNotes: reviewNotes || undefined
      })
      if (response.data.success) {
        toast.success('KYC rejected')
        fetchKYCs()
        setSelectedKYC(null)
        setRejectModal({ open: false, id: null })
        setRejectReason('')
        setReviewNotes('')
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error)
      toast.error(error.response?.data?.message || 'Failed to reject KYC')
    }
  }

  const handleRequestResubmission = async (id) => {
    const note = window.prompt('Resubmission note for the user:')
    if (note === null) return
    try {
      const response = await api.post(`/api/admin/kyc/${id}/request-resubmission`, { note })
      if (response.data.success) {
        toast.success('Resubmission requested')
        fetchKYCs()
        setSelectedKYC(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request resubmission')
    }
  }

  const handleSaveNotes = async (id) => {
    try {
      const response = await api.post(`/api/admin/kyc/${id}/notes`, { reviewNotes })
      if (response.data.success) {
        toast.success('Notes saved')
        setSelectedKYC(response.data.kyc)
        fetchKYCs()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save notes')
    }
  }

  const openRejectModal = (id) => {
    setRejectModal({ open: true, id })
    setRejectReason('')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[...Array(5)].map((_, idx) => (
            <SkeletonBlock key={idx} className="h-9 w-20" />
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SkeletonBlock className="h-8 w-full" />
              <SkeletonBlock className="h-8 w-full" />
              <SkeletonBlock className="h-8 w-full" />
              <SkeletonBlock className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getDocumentUrl = (path) => {
    if (!path) return ''
    return getImageUrl(path)
  }

  const formatDocumentLabel = (key) => {
    if (!key) return 'Document'
    return key
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const getFileType = (path, label = '') => {
    if (!path) return 'file'
    const sanitizedPath = String(path).split('#')[0].split('?')[0]
    const extension = sanitizedPath.split('.').pop()?.toLowerCase() || ''
    const normalizedLabel = String(label || '').toLowerCase()

    if (normalizedLabel.includes('video')) return 'video'
    if (
      normalizedLabel.includes('selfie') ||
      normalizedLabel.includes('photo') ||
      normalizedLabel.includes('passport') ||
      normalizedLabel.includes('id') ||
      normalizedLabel.includes('license') ||
      normalizedLabel.includes('document') ||
      normalizedLabel.includes('front') ||
      normalizedLabel.includes('back')
    ) return 'image'

    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'jfif', 'heic', 'heif'].includes(extension)) return 'image'
    if (['mp4', 'webm', 'mov', 'm4v'].includes(extension)) return 'video'
    if (extension === 'pdf') return 'pdf'
    return 'file'
  }

  const getDocumentItems = (kyc) => {
    if (!kyc) return []
    const items = []
    const seen = new Set()

    const addItem = (label, path) => {
      if (!path) return
      const url = getDocumentUrl(path)
      if (!url || seen.has(url)) return
      seen.add(url)
      items.push({
        label,
        url,
        type: getFileType(path, label)
      })
    }

    if (kyc.documents instanceof Map) {
      kyc.documents.forEach((value, key) => {
        addItem(formatDocumentLabel(key), value)
      })
    } else if (Array.isArray(kyc.documents)) {
      kyc.documents.forEach((entry, idx) => {
        if (entry && typeof entry === 'object') {
          const key = entry.key || entry.name || `Document ${idx + 1}`
          const value = entry.value || entry.path || entry.url
          addItem(formatDocumentLabel(key), value)
        }
      })
    } else if (kyc.documents && typeof kyc.documents === 'object') {
      Object.entries(kyc.documents).forEach(([key, value]) => {
        addItem(formatDocumentLabel(key), value)
      })
    }

    if (kyc.legacyDocuments && typeof kyc.legacyDocuments === 'object') {
      Object.entries(kyc.legacyDocuments).forEach(([key, value]) => {
        addItem(formatDocumentLabel(key), value)
      })
    }

    // Backward compatibility for old KYC records that used top-level fields.
    ;['passport', 'nationalId', 'driverLicense', 'proofOfAddress', 'taskDocument', 'liveSelfie'].forEach((key) => {
      if (kyc[key]) {
        addItem(formatDocumentLabel(key), kyc[key])
      }
    })

    addItem('Document Front', kyc.documentFront)
    addItem('Document Back', kyc.documentBack)
    addItem('Selfie', kyc.selfie)
    addItem('Verification Video', kyc.verificationVideo)

    return items
  }

  const FILTERS = [
    { id: 'otp_queue', label: 'OTP queue' },
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'pending', label: 'Pending review' },
    { id: 'under_review', label: 'Under review' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' }
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
        <p className="font-semibold">Where to confirm KYC OTP</p>
        <p className="text-xs mt-1 text-amber-800 dark:text-amber-200/90">
          Open <strong>OTP queue</strong> below (or Telegram ✅/❌ buttons). User-entered codes show here
          while status is still draft. Full KYC Approve is separate — only after OTP is approved and the
          case is <strong>pending</strong>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              statusFilter === f.id
                ? f.id === 'otp_queue'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {f.label}
            {f.id === 'otp_queue' && counts.otp_queue != null ? ` (${counts.otp_queue})` : ''}
            {f.id === 'pending' && counts.pending != null ? ` (${counts.pending})` : ''}
            {f.id === 'draft' && counts.draft != null ? ` (${counts.draft})` : ''}
          </button>
        ))}
      </div>

      <div className="fx-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">OTP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Updated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {kycs.length > 0 ? (
                kycs.map((kyc) => {
                  const otpPending = isOtpPending(kyc)
                  return (
                    <tr
                      key={kyc._id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        otpPending ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm">
                            {kyc.userId?.fullName || kyc.userId?.email || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">{kyc.userId?.email || 'N/A'}</p>
                          {kyc.userId?.phone ? (
                            <p className="text-[11px] text-slate-400 font-mono">{kyc.userId.phone}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            kyc.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : kyc.status === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : kyc.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {kyc.status}
                        </span>
                        {otpPending ? (
                          <span className="ml-1 px-2 py-1 rounded text-xs font-semibold bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                            OTP wait
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {kyc.otpVerification?.userSubmittedCode ? (
                          <div>
                            <p className="font-mono font-bold tracking-widest text-amber-800 dark:text-amber-200">
                              {kyc.otpVerification.userSubmittedCode}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              exp {kyc.otpVerification.expectedCode || '—'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {kyc.otpVerification?.status || '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(
                          kyc.otpVerification?.submittedAt ||
                            kyc.submittedAt ||
                            kyc.updatedAt ||
                            kyc.createdAt
                        ).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => openKycDetail(kyc)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                          >
                            View
                          </button>
                          {otpPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => decideKycOtp(kyc._id, 'approved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                              >
                                Approve OTP
                              </button>
                              <button
                                type="button"
                                onClick={() => decideKycOtp(kyc._id, 'rejected')}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
                              >
                                Reject OTP
                              </button>
                            </>
                          )}
                          {kyc.status === 'pending' && !otpPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(kyc._id)}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
                              >
                                Approve KYC
                              </button>
                              <button
                                type="button"
                                onClick={() => openRejectModal(kyc._id)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500 text-sm">
                    {statusFilter === 'otp_queue'
                      ? 'No KYC OTPs waiting. When a user submits a code, it appears here (and in Telegram).'
                      : 'No KYC submissions found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {kycs.length > 0 ? (
            kycs.map((kyc) => {
              const otpPending = isOtpPending(kyc)
              return (
                <div
                  key={kyc._id}
                  className={`p-4 space-y-3 ${otpPending ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {kyc.userId?.fullName || kyc.userId?.email || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{kyc.userId?.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700">
                        {kyc.status}
                      </span>
                      {otpPending ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                          OTP wait
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {kyc.otpVerification?.userSubmittedCode ? (
                    <p className="font-mono font-bold tracking-widest text-amber-800 dark:text-amber-200">
                      Entered: {kyc.otpVerification.userSubmittedCode}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openKycDetail(kyc)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm"
                    >
                      View
                    </button>
                    {otpPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => decideKycOtp(kyc._id, 'approved')}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm"
                        >
                          Approve OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => decideKycOtp(kyc._id, 'rejected')}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-sm"
                        >
                          Reject OTP
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="px-6 py-8 text-center text-gray-500 text-sm">
              {statusFilter === 'otp_queue'
                ? 'No KYC OTPs waiting right now.'
                : 'No KYC submissions found'}
            </div>
          )}
        </div>
      </div>

      {selectedKYC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">KYC Details</h3>
                <button
                  onClick={() => setSelectedKYC(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {isOtpPending(selectedKYC) && (
                <div className="mt-3 rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 px-4 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase font-bold text-amber-700 dark:text-amber-300">
                        Confirm user OTP
                      </p>
                      <p className="font-mono text-2xl font-bold tracking-[0.3em] text-amber-900 dark:text-amber-100">
                        {selectedKYC.otpVerification?.userSubmittedCode || '—'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Expected:{' '}
                        <span className="font-mono font-semibold">
                          {selectedKYC.otpVerification?.expectedCode || '—'}
                        </span>
                        {selectedKYC.otpVerification?.expectedCode &&
                        selectedKYC.otpVerification?.userSubmittedCode
                          ? String(selectedKYC.otpVerification.expectedCode) ===
                            String(selectedKYC.otpVerification.userSubmittedCode)
                            ? ' · ✓ match'
                            : ' · ✗ no match'
                          : ''}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => decideKycOtp(selectedKYC._id, 'approved')}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow"
                      >
                        Approve OTP
                      </button>
                      <button
                        type="button"
                        onClick={() => decideKycOtp(selectedKYC._id, 'rejected')}
                        className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow"
                      >
                        Reject OTP
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">User Information</h4>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                  <p><strong>Name:</strong> {selectedKYC.fullName || `${selectedKYC.firstName || ''} ${selectedKYC.lastName || ''}`}</p>
                  <p><strong>Email:</strong> {selectedKYC.userId?.email || 'N/A'}</p>
                  <p><strong>DOB:</strong> {selectedKYC.dateOfBirth ? new Date(selectedKYC.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Gender:</strong> {selectedKYC.gender || 'N/A'}</p>
                  <p><strong>Nationality:</strong> {selectedKYC.nationality || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedKYC.phoneNumber || 'N/A'}</p>
                  <p><strong>Reference:</strong> <span className="font-mono text-xs">{selectedKYC.referenceNumber || '—'}</span></p>
                  <p><strong>Progress step:</strong> {selectedKYC.currentStep || '—'}</p>
                </div>
              </div>
              {selectedKYC.address && (
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Address</h4>
                  <div className="text-sm text-gray-700 dark:text-gray-200">
                    <p>{selectedKYC.address.street}</p>
                    <p>{selectedKYC.address.city}, {selectedKYC.address.state} {selectedKYC.address.zipCode}</p>
                    <p>{selectedKYC.address.country}</p>
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="font-semibold mb-1">SIN / SSN</p>
                  <p>Status: {selectedKYC.ssn?.status || '—'}</p>
                  <p>
                    Masked:{' '}
                    {selectedKYC.ssn?.masked ||
                      (selectedKYC.ssn?.last4 ? `***-**-${selectedKYC.ssn.last4}` : '—')}
                  </p>
                  <p className="mt-2">
                    <span className="text-slate-500 dark:text-slate-400">Full (plain): </span>
                    <span className="font-mono font-semibold tracking-wide text-slate-900 dark:text-white">
                      {selectedKYC.ssn?.fullEncrypted
                        ? String(selectedKYC.ssn.fullEncrypted).replace(
                            /^(\d{3})(\d{2})(\d{0,4})$/,
                            (_, a, b, c) => (c ? `${a}-${b}-${c}` : `${a}-${b}`)
                          )
                        : '—'}
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                  <p className="font-semibold">OTP review</p>
                  <p className="text-xs text-slate-500">Status: {selectedKYC.otpVerification?.status || '—'}</p>
                  <p className="text-xs text-slate-500">Sent to: {selectedKYC.otpVerification?.sentTo || '—'}</p>
                  <div
                    className={`rounded-xl border-2 px-3 py-3 text-center ${
                      selectedKYC.otpVerification?.userSubmittedCode
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                        : 'border-dashed border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    <p className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-300 mb-1">
                      User entered code
                    </p>
                    <p className="font-mono text-2xl font-bold tracking-[0.3em] text-amber-900 dark:text-amber-100">
                      {selectedKYC.otpVerification?.userSubmittedCode || '—'}
                    </p>
                  </div>
                  <p className="text-sm">
                    <span className="text-slate-500">Expected: </span>
                    <span className="font-mono font-semibold tracking-wider">
                      {selectedKYC.otpVerification?.expectedCode || '—'}
                    </span>
                  </p>
                  {selectedKYC.otpVerification?.expectedCode &&
                    selectedKYC.otpVerification?.userSubmittedCode && (
                      <p
                        className={`text-xs font-semibold ${
                          String(selectedKYC.otpVerification.expectedCode) ===
                          String(selectedKYC.otpVerification.userSubmittedCode)
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {String(selectedKYC.otpVerification.expectedCode) ===
                        String(selectedKYC.otpVerification.userSubmittedCode)
                          ? '✓ Codes match'
                          : '✗ Codes do not match'}
                      </p>
                    )}
                  {selectedKYC.otpVerification?.lastRejectedCode ? (
                    <p className="text-xs text-slate-500">
                      Last rejected:{' '}
                      <span className="font-mono">{selectedKYC.otpVerification.lastRejectedCode}</span>
                    </p>
                  ) : null}
                  {selectedKYC.otpVerification?.status === 'submitted' &&
                    !selectedKYC.otpVerification?.verified && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => decideKycOtp(selectedKYC._id, 'approved')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                        >
                          Approve OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => decideKycOtp(selectedKYC._id, 'rejected')}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
                        >
                          Reject OTP
                        </button>
                      </div>
                    )}
                </div>
              </div>
              {selectedKYC.identityDetails && (
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Identity / Compliance</h4>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                    <p><strong>Occupation:</strong> {selectedKYC.identityDetails.occupation || '—'}</p>
                    <p><strong>Employer:</strong> {selectedKYC.identityDetails.employer || '—'}</p>
                    <p><strong>Income:</strong> {selectedKYC.identityDetails.annualIncome || '—'}</p>
                    <p><strong>Source of funds:</strong> {selectedKYC.identityDetails.sourceOfFunds || '—'}</p>
                    <p><strong>Tax residency:</strong> {selectedKYC.identityDetails.taxResidency || '—'}</p>
                    <p><strong>Purpose:</strong> {selectedKYC.identityDetails.purposeOfAccount || '—'}</p>
                    <p><strong>PEP:</strong> {selectedKYC.identityDetails.isPep ? 'Yes' : 'No'}</p>
                    {selectedKYC.identityDetails.pepDetails && (
                      <p><strong>PEP details:</strong> {selectedKYC.identityDetails.pepDetails}</p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Documents {selectedKYC.documentType ? `(${selectedKYC.documentType})` : ''}
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {getDocumentItems(selectedKYC).length} file
                    {getDocumentItems(selectedKYC).length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Images and videos load inside fixed review boxes. Green = ready · click enlarge / fullscreen.
                </p>
                {getDocumentItems(selectedKYC).length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                    {getDocumentItems(selectedKYC).map((doc) => (
                      <div
                        key={`${doc.label}-${doc.url}`}
                        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                            {doc.label}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {(doc.type === 'image' || doc.type === 'video') && (
                              <button
                                type="button"
                                onClick={() => setLightboxDoc(doc)}
                                className="text-[11px] font-semibold px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 hover:bg-indigo-200"
                              >
                                {doc.type === 'video' ? 'Fullscreen' : 'Enlarge'}
                              </button>
                            )}
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold px-2 py-1 rounded-md bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 hover:bg-cyan-200"
                            >
                              Open
                            </a>
                          </div>
                        </div>
                        <div className="p-2.5">
                          <DocumentPreview doc={doc} onOpenLightbox={setLightboxDoc} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded.</p>
                )}
              </div>
              {selectedKYC.verificationHistory?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Verification history</h4>
                  <ul className="text-xs space-y-1 max-h-32 overflow-y-auto text-slate-600 dark:text-slate-300">
                    {selectedKYC.verificationHistory.slice().reverse().map((h, idx) => (
                      <li key={idx}>
                        {h.at ? new Date(h.at).toLocaleString() : ''} — {h.action}
                        {h.note ? `: ${h.note}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedKYC.rejectionReason && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    <strong>Rejection Reason:</strong> {selectedKYC.rejectionReason}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Review notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  rows={2}
                  value={reviewNotes || selectedKYC.reviewNotes || ''}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Internal review notes…"
                />
                <button
                  type="button"
                  onClick={() => handleSaveNotes(selectedKYC._id)}
                  className="mt-2 text-xs text-cyan-600 font-medium"
                >
                  Save notes
                </button>
              </div>
              {['pending', 'under_review', 'draft'].includes(selectedKYC.status) && (
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedKYC._id)}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openRejectModal(selectedKYC._id)}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleRequestResubmission(selectedKYC._id)}
                    className="flex-1 px-4 py-2.5 border border-amber-400 text-amber-700 dark:text-amber-300 rounded-lg font-semibold"
                  >
                    Request resubmission
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {rejectModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white">Reject KYC Submission</h4>
            </div>
            <div className="p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                placeholder="Enter clear rejection reason..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRejectModal({ open: false, id: null })
                    setRejectReason('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(rejectModal.id, rejectReason)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {lightboxDoc && (
        <ImageLightbox doc={lightboxDoc} onClose={() => setLightboxDoc(null)} />
      )}
    </div>
  )
}



