import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import { getImageUrl } from '../../utils/imageUrl.js'
import SkeletonBlock from '../common/SkeletonBlock'

function DocumentPreview({ doc }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)

  if (doc.type === 'image' && !imageFailed) {
    return (
      <img
        src={doc.url}
        alt={doc.label}
        loading="lazy"
        onError={() => setImageFailed(true)}
        className="w-full h-44 object-cover rounded-md border border-gray-200 dark:border-gray-700"
      />
    )
  }

  if (doc.type === 'video' && !videoFailed) {
    return (
      <video
        src={doc.url}
        controls
        preload="metadata"
        onError={() => setVideoFailed(true)}
        className="w-full h-44 object-cover rounded-md border border-gray-200 dark:border-gray-700"
      />
    )
  }

  if (doc.type === 'pdf') {
    return (
      <iframe
        src={doc.url}
        title={doc.label}
        className="w-full h-64 rounded-md border border-gray-200 dark:border-gray-700 bg-white"
      />
    )
  }

  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
    >
      <span className="truncate">Open file</span>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </a>
  )
}

export default function KYCLogList() {
  const [kycs, setKycs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedKYC, setSelectedKYC] = useState(null)
  const [rejectModal, setRejectModal] = useState({ open: false, id: null })
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchKYCs()
  }, [statusFilter])

  const fetchKYCs = async () => {
    try {
      setLoading(true)
      const url = statusFilter === 'all' ? '/api/admin/kyc' : `/api/admin/kyc?status=${statusFilter}`
      const response = await api.get(url)
      if (response.data.success) {
        setKycs(response.data.kycs)
      }
    } catch (error) {
      console.error('Error fetching KYC logs:', error)
      toast.error('Failed to fetch KYC logs')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      const response = await api.post(`/api/admin/kyc/${id}/approve`)
      if (response.data.success) {
        toast.success('KYC approved successfully')
        fetchKYCs()
        setSelectedKYC(null)
      }
    } catch (error) {
      console.error('Error approving KYC:', error)
      toast.error(error.response?.data?.message || 'Failed to approve KYC')
    }
  }

  const handleReject = async (id, reason) => {
    if (!reason?.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    try {
      const response = await api.post(`/api/admin/kyc/${id}/reject`, { rejectionReason: reason.trim() })
      if (response.data.success) {
        toast.success('KYC rejected')
        fetchKYCs()
        setSelectedKYC(null)
        setRejectModal({ open: false, id: null })
        setRejectReason('')
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error)
      toast.error(error.response?.data?.message || 'Failed to reject KYC')
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

    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'jfif'].includes(extension)) return 'image'
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

    addItem('Selfie', kyc.selfie)
    addItem('Verification Video', kyc.verificationVideo)

    return items
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'under_review', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {kycs.length > 0 ? (
                kycs.map((kyc) => (
                  <tr key={kyc._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{kyc.userId?.fullName || kyc.userId?.email || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{kyc.userId?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        kyc.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        kyc.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        kyc.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {kyc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(kyc.submittedAt || kyc.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              const response = await api.get(`/api/admin/kyc/${kyc._id}`)
                              if (response.data?.success && response.data.kyc) {
                                setSelectedKYC(response.data.kyc)
                                return
                              }
                            } catch (error) {
                              console.error('Error fetching KYC details:', error)
                              toast.error('Failed to load complete KYC details')
                            }
                            setSelectedKYC(kyc)
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                        >
                          View
                        </button>
                        {kyc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(kyc._id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(kyc._id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No KYC submissions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
          {kycs.length > 0 ? (
            kycs.map((kyc) => (
              <div key={kyc._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{kyc.userId?.fullName || kyc.userId?.email || 'N/A'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{kyc.userId?.email || 'N/A'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    kyc.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    kyc.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    kyc.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {kyc.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Submitted: {new Date(kyc.submittedAt || kyc.createdAt).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const response = await api.get(`/api/admin/kyc/${kyc._id}`)
                        if (response.data?.success && response.data.kyc) {
                          setSelectedKYC(response.data.kyc)
                          return
                        }
                      } catch (error) {
                        console.error('Error fetching KYC details:', error)
                        toast.error('Failed to load complete KYC details')
                      }
                      setSelectedKYC(kyc)
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                  >
                    View
                  </button>
                  {kyc.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(kyc._id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(kyc._id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">No KYC submissions found</div>
          )}
        </div>
      </div>

      {selectedKYC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">User Information</h4>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                  <p><strong>Name:</strong> {selectedKYC.firstName} {selectedKYC.lastName}</p>
                  <p><strong>Email:</strong> {selectedKYC.userId?.email || 'N/A'}</p>
                  <p><strong>DOB:</strong> {selectedKYC.dateOfBirth ? new Date(selectedKYC.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Nationality:</strong> {selectedKYC.nationality || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedKYC.phoneNumber || 'N/A'}</p>
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
              <div>
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Documents</h4>
                {getDocumentItems(selectedKYC).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {getDocumentItems(selectedKYC).map((doc) => (
                      <div key={doc.url} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">{doc.label}</p>
                        <DocumentPreview doc={doc} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded.</p>
                )}
              </div>
              {selectedKYC.rejectionReason && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    <strong>Rejection Reason:</strong> {selectedKYC.rejectionReason}
                  </p>
                </div>
              )}
              {selectedKYC.status === 'pending' && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedKYC._id)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openRejectModal(selectedKYC._id)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                  >
                    Reject
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
    </div>
  )
}



