import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import { getImageUrl } from '../../utils/imageUrl.js'

export default function SiteSettings() {
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [settings, setSettings] = useState({
    site: {
      name: '',
      logo: '',
      favicon: '',
      currency: 'USDT',
      signupBonus: 0,
      envValues: {},
      contact: {
        telegram: '',
        whatsapp: '',
        email: ''
      },
      seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: ''
      }
    },
    transfer: {
      minAmount: 1,
      maxAmount: 5000
    }
  })
  const [envKey, setEnvKey] = useState('')
  const [envValue, setEnvValue] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/admin/settings')
      if (response.data.success) {
        const fetchedSettings = response.data.settings
        setSettings({
          site: {
            name: fetchedSettings.site?.name || 'XCrypto',
            logo: fetchedSettings.site?.logo || '',
            favicon: fetchedSettings.site?.favicon || '',
            currency: fetchedSettings.site?.currency || 'USDT',
            signupBonus: fetchedSettings.site?.signupBonus || 0,
            envValues: fetchedSettings.site?.envValues || (typeof fetchedSettings.site?.envValues === 'object' && !Array.isArray(fetchedSettings.site?.envValues) ? Object.fromEntries(Object.entries(fetchedSettings.site?.envValues)) : {}),
            contact: {
              telegram: fetchedSettings.site?.contact?.telegram || '',
              whatsapp: fetchedSettings.site?.contact?.whatsapp || '',
              email: fetchedSettings.site?.contact?.email || 'support@onchainbittles.online'
            },
            seo: {
              metaTitle: fetchedSettings.site?.seo?.metaTitle || '',
              metaDescription: fetchedSettings.site?.seo?.metaDescription || '',
              metaKeywords: fetchedSettings.site?.seo?.metaKeywords || '',
              ogTitle: fetchedSettings.site?.seo?.ogTitle || '',
              ogDescription: fetchedSettings.site?.seo?.ogDescription || '',
              ogImage: fetchedSettings.site?.seo?.ogImage || ''
            }
          },
          transfer: {
            minAmount: fetchedSettings.transfer?.minAmount || 1,
            maxAmount: fetchedSettings.transfer?.maxAmount || 5000
          }
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    }
  }

  const handleInputChange = (section, field, value) => {
    if (section === 'site' && field === 'contact') {
      // This will be handled separately
      return
    }
    if (section === 'site' && field === 'seo') {
      // This will be handled separately
      return
    }
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleSEOChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      site: {
        ...prev.site,
        seo: {
          ...prev.site.seo,
          [field]: value
        }
      }
    }))
  }

  const handleAddEnvValue = () => {
    if (!envKey.trim()) {
      toast.error('Please enter a key name')
      return
    }
    setSettings(prev => ({
      ...prev,
      site: {
        ...prev.site,
        envValues: {
          ...prev.site.envValues,
          [envKey.trim()]: envValue.trim()
        }
      }
    }))
    setEnvKey('')
    setEnvValue('')
  }

  const handleRemoveEnvValue = (key) => {
    setSettings(prev => {
      const newEnvValues = { ...prev.site.envValues }
      delete newEnvValues[key]
      return {
        ...prev,
        site: {
          ...prev.site,
          envValues: newEnvValues
        }
      }
    })
  }

  const handleUpdateEnvValue = (key, newValue) => {
    setSettings(prev => ({
      ...prev,
      site: {
        ...prev.site,
        envValues: {
          ...prev.site.envValues,
          [key]: newValue
        }
      }
    }))
  }

  const handleContactChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      site: {
        ...prev.site,
        contact: {
          ...prev.site.contact,
          [field]: value
        }
      }
    }))
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only images are allowed.')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await api.post('/api/admin/settings/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        setSettings(prev => ({
          ...prev,
          site: {
            ...prev.site,
            logo: response.data.logo
          }
        }))
        toast.success('Logo uploaded successfully')
        // Refresh site settings context if it exists
        if (window.refreshSiteSettings) {
          window.refreshSiteSettings()
        }
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error(error.response?.data?.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
      e.target.value = '' // Reset file input
    }
  }

  const handleFaviconUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PNG, ICO, or SVG files are allowed.')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    setUploadingFavicon(true)
    try {
      const formData = new FormData()
      formData.append('favicon', file)

      const response = await api.post('/api/admin/settings/favicon', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        setSettings(prev => ({
          ...prev,
          site: {
            ...prev.site,
            favicon: response.data.favicon
          }
        }))
        toast.success('Favicon uploaded successfully')
        // Refresh site settings context if it exists
        if (window.refreshSiteSettings) {
          window.refreshSiteSettings()
        }
      }
    } catch (error) {
      console.error('Error uploading favicon:', error)
      toast.error(error.response?.data?.message || 'Failed to upload favicon')
    } finally {
      setUploadingFavicon(false)
      e.target.value = '' // Reset file input
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await api.put('/api/admin/settings', {
        site: {
          ...settings.site,
          seo: settings.site.seo
        },
        transfer: settings.transfer
      })

      if (response.data.success) {
        toast.success('Settings saved successfully')
        // Refresh site settings context if it exists
        if (window.refreshSiteSettings) {
          window.refreshSiteSettings()
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Site Settings</h2>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {/* General Site Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">General Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Site Name</label>
            <input
              type="text"
              value={settings.site.name}
              onChange={(e) => handleInputChange('site', 'name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="Enter site name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Site Currency</label>
            <select
              value={settings.site.currency}
              onChange={(e) => handleInputChange('site', 'currency', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="USDT">USDT</option>
              <option value="USD">USD</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Signup Bonus</label>
            <input
              type="number"
              value={settings.site.signupBonus}
              onChange={(e) => handleInputChange('site', 'signupBonus', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Bonus amount given to new users upon signup
            </p>
          </div>

        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Environment Variables</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Manage environment variables that can be used throughout the application. These values are stored in the database and can be updated without modifying code.
        </p>
        
        {/* Add new env value */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <label className="block text-sm font-medium mb-3">Add New Environment Variable</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={envKey}
              onChange={(e) => setEnvKey(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="Key (e.g., API_KEY, BASE_URL)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddEnvValue()
                }
              }}
            />
            <input
              type="text"
              value={envValue}
              onChange={(e) => setEnvValue(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="Value"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddEnvValue()
                }
              }}
            />
            <button
              onClick={handleAddEnvValue}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition"
            >
              Add Variable
            </button>
          </div>
        </div>

        {/* Display existing env values */}
        {Object.keys(settings.site.envValues || {}).length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Current Environment Variables ({Object.keys(settings.site.envValues).length})
            </h4>
            {Object.entries(settings.site.envValues).map(([key, value]) => (
              <div
                key={key}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                      {key}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleUpdateEnvValue(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                      placeholder="Enter value"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveEnvValue(key)}
                    className="mt-6 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="Remove variable"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <p className="text-sm">No environment variables configured</p>
            <p className="text-xs mt-1">Add variables above to get started</p>
          </div>
        )}
      </div>

      {/* Logo Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Site Logo</h3>
        <div className="flex items-start gap-6">
          {settings.site.logo && (
            <div className="flex-shrink-0">
              <img
                src={getImageUrl(settings.site.logo)}
                alt="Site Logo"
                className="w-32 h-32 object-contain border border-gray-200 dark:border-gray-700 rounded-lg p-2"
              />
            </div>
          )}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Upload Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Recommended: PNG, SVG, or JPG. Max size: 5MB
            </p>
            {uploadingLogo && (
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">Uploading...</p>
            )}
          </div>
        </div>
      </div>

      {/* Favicon Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Site Favicon</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          The favicon appears in browser tabs and bookmarks. Recommended: 32x32 or 16x16 PNG, or ICO format.
        </p>
        <div className="flex items-start gap-6">
          {settings.site.favicon && (
            <div className="flex-shrink-0">
              <img
                src={settings.site.favicon.startsWith('http') ? settings.site.favicon : `${API_URL}${settings.site.favicon}`}
                alt="Site Favicon"
                className="w-16 h-16 object-contain border border-gray-200 dark:border-gray-700 rounded-lg p-2"
              />
            </div>
          )}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Upload Favicon</label>
            <input
              type="file"
              accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
              onChange={handleFaviconUpload}
              disabled={uploadingFavicon}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Recommended: PNG, ICO, or SVG. Max size: 2MB
            </p>
            {uploadingFavicon && (
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">Uploading...</p>
            )}
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configure meta tags and Open Graph settings for better search engine visibility and social media sharing.
        </p>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Meta Title</label>
            <input
              type="text"
              value={settings.site.seo.metaTitle}
              onChange={(e) => handleSEOChange('metaTitle', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="e.g., XCrypto - Forex & Crypto Exchange"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Appears in search engine results (recommended: 50-60 characters)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Meta Description</label>
            <textarea
              value={settings.site.seo.metaDescription}
              onChange={(e) => handleSEOChange('metaDescription', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="A brief description of your platform..."
              rows="3"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Appears in search engine results (recommended: 150-160 characters)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Meta Keywords</label>
            <input
              type="text"
              value={settings.site.seo.metaKeywords}
              onChange={(e) => handleSEOChange('metaKeywords', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="crypto, forex, trading, exchange"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Comma-separated keywords for search engines
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-md font-semibold mb-4">Open Graph (Social Media)</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">OG Title</label>
                <input
                  type="text"
                  value={settings.site.seo.ogTitle}
                  onChange={(e) => handleSEOChange('ogTitle', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="Title for social media shares"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">OG Description</label>
                <textarea
                  value={settings.site.seo.ogDescription}
                  onChange={(e) => handleSEOChange('ogDescription', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="Description for social media shares"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">OG Image URL</label>
                <input
                  type="url"
                  value={settings.site.seo.ogImage}
                  onChange={(e) => handleSEOChange('ogImage', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Image URL for social media shares (recommended: 1200x630px)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Transfer Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Transfer Amount</label>
            <input
              type="number"
              value={settings.transfer.minAmount}
              onChange={(e) => handleInputChange('transfer', 'minAmount', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Maximum Transfer Amount</label>
            <input
              type="number"
              value={settings.transfer.maxAmount}
              onChange={(e) => handleInputChange('transfer', 'maxAmount', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Telegram</label>
            <input
              type="text"
              value={settings.site.contact.telegram}
              onChange={(e) => handleContactChange('telegram', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="https://t.me/yourchannel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp</label>
            <input
              type="text"
              value={settings.site.contact.whatsapp}
              onChange={(e) => handleContactChange('whatsapp', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="https://wa.me/1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={settings.site.contact.email}
              onChange={(e) => handleContactChange('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="support@example.com"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

