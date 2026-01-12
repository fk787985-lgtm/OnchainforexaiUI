import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/axios'

const SiteSettingsContext = createContext()

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext)
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider')
  }
  return context
}

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    site: {
      name: 'XCrypto',
      logo: '',
      favicon: '',
      currency: 'USDT',
      signupBonus: 0,
      contact: {
        telegram: '',
        whatsapp: '',
        email: 'support@onchainbittles.online'
      },
      envValues: {},
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
    // Refresh settings every 5 minutes
    const interval = setInterval(fetchSettings, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings/public')
      if (response.data.success) {
        const fetchedSettings = response.data.settings
        setSettings({
          site: {
            name: fetchedSettings.site?.name || 'XCrypto',
            logo: fetchedSettings.site?.logo || '',
            favicon: fetchedSettings.site?.favicon || '',
            currency: fetchedSettings.site?.currency || 'USDT',
            signupBonus: fetchedSettings.site?.signupBonus || 0,
            contact: {
              telegram: fetchedSettings.site?.contact?.telegram || '',
              whatsapp: fetchedSettings.site?.contact?.whatsapp || '',
              email: fetchedSettings.site?.contact?.email || 'support@onchainbittles.online'
            },
            envValues: fetchedSettings.site?.envValues || (typeof fetchedSettings.site?.envValues === 'object' && !Array.isArray(fetchedSettings.site?.envValues) ? Object.fromEntries(Object.entries(fetchedSettings.site?.envValues)) : {}),
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
      console.error('Error fetching site settings:', error)
      // Use defaults if fetch fails
    } finally {
      setLoading(false)
    }
  }

  const refreshSettings = () => {
    fetchSettings()
  }

  // Expose refresh function globally for admin components
  useEffect(() => {
    window.refreshSiteSettings = refreshSettings
    return () => {
      delete window.refreshSiteSettings
    }
  }, [refreshSettings])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

