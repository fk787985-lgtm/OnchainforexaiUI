import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import { API_URL } from '../../utils/apiUrl.js'

export default function KYCLogList() {
  const [kycs, setKycs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedKYC, setSelectedKYC] = useState(null)

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
    if (!reason) {
      reason = window.prompt('Enter rejection reason:')
      if (!reason) return
    }
    try {
      const response = await api.post(`/api/admin/kyc/${id}/reject`, { rejectionReason: reason })
      if (response.data.success) {
        toast.success('KYC rejected')
        fetchKYCs()
        setSelectedKYC(null)
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error)
      toast.error(error.response?.data?.message || 'Failed to reject KYC')
    }
  }

  if (loading) {
    return <div className="text-center py-10">Loading...</div>
  }

  const apiBaseUrl = API_URL

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
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
        <div className="overflow-x-auto">
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
                          onClick={() => setSelectedKYC(kyc)}
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
                              onClick={() => handleReject(kyc._id)}
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
      </div>

      {selectedKYC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">KYC Details</h3>
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
                <h4 className="font-semibold mb-2">User Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedKYC.firstName} {selectedKYC.lastName}</p>
                  <p><strong>Email:</strong> {selectedKYC.userId?.email || 'N/A'}</p>
                  <p><strong>DOB:</strong> {selectedKYC.dateOfBirth ? new Date(selectedKYC.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Nationality:</strong> {selectedKYC.nationality || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedKYC.phoneNumber || 'N/A'}</p>
                </div>
              </div>
              {selectedKYC.address && (
                <div>
                  <h4 className="font-semibold mb-2">Address</h4>
                  <div className="text-sm">
                    <p>{selectedKYC.address.street}</p>
                    <p>{selectedKYC.address.city}, {selectedKYC.address.state} {selectedKYC.address.zipCode}</p>
                    <p>{selectedKYC.address.country}</p>
                  </div>
                </div>
              )}
              <div>
                <h4 className="font-semibold mb-2">Documents</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedKYC.documents?.taskDocument && (
                    <a href={`${apiBaseUrl}${selectedKYC.documents.taskDocument}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      Task Document
                    </a>
                  )}
                  {selectedKYC.documents?.driverLicense && (
                    <a href={`${apiBaseUrl}${selectedKYC.documents.driverLicense}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      Driver License
                    </a>
                  )}
                  {selectedKYC.documents?.liveSelfie && (
                    <a href={`${apiBaseUrl}${selectedKYC.documents.liveSelfie}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      Live Selfie
                    </a>
                  )}
                  {selectedKYC.documents?.passport && (
                    <a href={`${apiBaseUrl}${selectedKYC.documents.passport}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      Passport
                    </a>
                  )}
                  {selectedKYC.documents?.nationalId && (
                    <a href={`${apiBaseUrl}${selectedKYC.documents.nationalId}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      National ID
                    </a>
                  )}
                  {selectedKYC.documents?.proofOfAddress && (
                    <a href={`${apiBaseUrl}${selectedKYC.documents.proofOfAddress}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      Proof of Address
                    </a>
                  )}
                </div>
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
                    onClick={() => handleReject(selectedKYC._id)}
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
    </div>
  )
}



