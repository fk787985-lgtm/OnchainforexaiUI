import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import ToggleSwitch from './ToggleSwitch'

export default function KYCSettings() {
  const [settings, setSettings] = useState({
    documents: [
      { name: 'Task Document', required: false, allowUpload: true, usePhoto: false },
      { name: 'Driver License', required: true, allowUpload: true, usePhoto: false },
      { name: 'Live Selfie', required: true, allowUpload: false, usePhoto: true },
      { name: 'Passport', required: false, allowUpload: true, usePhoto: false },
      { name: 'National ID', required: true, allowUpload: true, usePhoto: false },
      { name: 'Proof of Address', required: true, allowUpload: true, usePhoto: false }
    ],
    requireVideoVerification: true,
    requireSelfie: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newDocumentName, setNewDocumentName] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/admin/settings')
      if (response.data.success && response.data.settings.kyc) {
        const kycSettings = response.data.settings.kyc
        // Convert old format to new format if needed
        if (kycSettings.documents && Array.isArray(kycSettings.documents)) {
          // Ensure all documents have allowUpload field
          const documentsWithUpload = kycSettings.documents.map(doc => ({
            ...doc,
            allowUpload: doc.allowUpload !== undefined ? doc.allowUpload : true
          }))
          setSettings({ ...kycSettings, documents: documentsWithUpload })
        } else {
          // Migrate old format to new format
          const documents = []
          if (kycSettings.requireTaskDocument !== undefined) {
            documents.push({ name: 'Task Document', required: kycSettings.requireTaskDocument, allowUpload: true, usePhoto: false })
          }
          if (kycSettings.requireDriverLicense !== undefined) {
            documents.push({ name: 'Driver License', required: kycSettings.requireDriverLicense, allowUpload: true, usePhoto: false })
          }
          if (kycSettings.requireLiveSelfie !== undefined) {
            documents.push({ name: 'Live Selfie', required: kycSettings.requireLiveSelfie, allowUpload: false, usePhoto: true })
          }
          if (kycSettings.requirePassport !== undefined) {
            documents.push({ name: 'Passport', required: kycSettings.requirePassport, allowUpload: true, usePhoto: false })
          }
          if (kycSettings.requireNationalId !== undefined) {
            documents.push({ name: 'National ID', required: kycSettings.requireNationalId, allowUpload: true, usePhoto: false })
          }
          if (kycSettings.requireProofOfAddress !== undefined) {
            documents.push({ name: 'Proof of Address', required: kycSettings.requireProofOfAddress, allowUpload: true, usePhoto: false })
          }
          setSettings({
            documents,
            requireVideoVerification: kycSettings.requireVideoVerification !== undefined ? kycSettings.requireVideoVerification : true,
            requireSelfie: kycSettings.requireSelfie !== undefined ? kycSettings.requireSelfie : true
          })
        }
      }
    } catch (error) {
      console.error('Error fetching KYC settings:', error)
      toast.error('Failed to fetch KYC settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await api.put('/api/admin/settings', { kyc: settings })
      if (response.data.success) {
        toast.success('KYC settings updated successfully')
      }
    } catch (error) {
      console.error('Error updating KYC settings:', error)
      toast.error('Failed to update KYC settings')
    } finally {
      setSaving(false)
    }
  }

  const handleAddDocument = () => {
    if (!newDocumentName.trim()) {
      toast.error('Please enter a document name')
      return
    }
    if (settings.documents.some(doc => doc.name.toLowerCase() === newDocumentName.trim().toLowerCase())) {
      toast.error('Document with this name already exists')
      return
    }
    setSettings({
      ...settings,
      documents: [...settings.documents, { name: newDocumentName.trim(), required: false, allowUpload: true, usePhoto: false }]
    })
    setNewDocumentName('')
  }

  const handleRemoveDocument = (index) => {
    const newDocuments = settings.documents.filter((_, i) => i !== index)
    setSettings({ ...settings, documents: newDocuments })
  }

  const handleUpdateDocument = (index, field, value) => {
    const newDocuments = [...settings.documents]
    newDocuments[index] = { ...newDocuments[index], [field]: value }
    setSettings({ ...settings, documents: newDocuments })
  }

  if (loading) {
    return <div className="text-center py-10">Loading...</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">KYC Document Requirements</h2>
      
      {/* Video Verification & Selfie Settings */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <label className="text-sm font-medium">Require Video Verification</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Users must record a video performing head movements, opening mouth, and blinking
            </p>
          </div>
          <ToggleSwitch
            enabled={settings.requireVideoVerification}
            onChange={(enabled) => setSettings({ ...settings, requireVideoVerification: enabled })}
          />
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <label className="text-sm font-medium">Require Selfie</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Users must take a live selfie
            </p>
          </div>
          <ToggleSwitch
            enabled={settings.requireSelfie}
            onChange={(enabled) => setSettings({ ...settings, requireSelfie: enabled })}
          />
        </div>
      </div>

      {/* Add New Document */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
        <h3 className="text-lg font-semibold mb-4">Add Custom Document</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newDocumentName}
            onChange={(e) => setNewDocumentName(e.target.value)}
            placeholder="Enter document name (e.g., Bank Statement)"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            onKeyPress={(e) => e.key === 'Enter' && handleAddDocument()}
          />
          <button
            onClick={handleAddDocument}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
          >
            Add Document
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold">Document Types</h3>
        {settings.documents.map((doc, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">{doc.name}</h4>
              </div>
              <button
                onClick={() => handleRemoveDocument(index)}
                className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                title="Remove document"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="text-sm font-medium">Required</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">User must provide this document</p>
                </div>
                <ToggleSwitch
                  enabled={doc.required}
                  onChange={(enabled) => handleUpdateDocument(index, 'required', enabled)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="text-sm font-medium">Allow Upload File</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    User can upload file
                  </p>
                </div>
                <ToggleSwitch
                  enabled={doc.allowUpload !== false}
                  onChange={(enabled) => handleUpdateDocument(index, 'allowUpload', enabled)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="text-sm font-medium">Use Photo Capture</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    User takes photo with camera
                  </p>
                </div>
                <ToggleSwitch
                  enabled={doc.usePhoto}
                  onChange={(enabled) => handleUpdateDocument(index, 'usePhoto', enabled)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
