import { useEffect } from 'react'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { API_URL } from '../utils/apiUrl.js'

export default function MetaTags() {
  const { settings } = useSiteSettings()

  useEffect(() => {
    const siteName = settings.site?.name || 'XCrypto'
    const seo = settings.site?.seo || {}
    const favicon = settings.site?.favicon

    // Update document title
    const metaTitle = seo.metaTitle || `${siteName} - Forex & Crypto Exchange`
    document.title = metaTitle

    // Update or create meta tags
    const updateMetaTag = (name, content, attribute = 'name') => {
      if (!content) return
      
      let element = document.querySelector(`meta[${attribute}="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // Update or create Open Graph tags
    const updateOGTag = (property, content) => {
      if (!content) return
      
      let element = document.querySelector(`meta[property="${property}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute('property', property)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // Update favicon
    if (favicon) {
      let faviconLink = document.querySelector("link[rel='icon']")
      if (!faviconLink) {
        faviconLink = document.createElement('link')
        faviconLink.setAttribute('rel', 'icon')
        document.head.appendChild(faviconLink)
      }
      faviconLink.setAttribute('href', favicon.startsWith('http') ? favicon : `${API_URL}${favicon}`)
    }

    // Update meta description
    updateMetaTag('description', seo.metaDescription || `Trade cryptocurrencies and forex on ${siteName}. Secure, fast, and reliable trading platform.`)

    // Update meta keywords
    updateMetaTag('keywords', seo.metaKeywords || 'crypto, forex, trading, exchange, bitcoin, ethereum')

    // Update Open Graph tags
    updateOGTag('og:title', seo.ogTitle || metaTitle)
    updateOGTag('og:description', seo.ogDescription || seo.metaDescription || `Trade cryptocurrencies and forex on ${siteName}`)
    updateOGTag('og:type', 'website')
    if (seo.ogImage) {
      updateOGTag('og:image', seo.ogImage.startsWith('http') ? seo.ogImage : `${API_URL}${seo.ogImage}`)
    } else if (settings.site?.logo) {
      updateOGTag('og:image', settings.site.logo?.startsWith('http') ? settings.site.logo : `${API_URL}${settings.site.logo}`)
    }
    updateOGTag('og:site_name', siteName)

    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', seo.ogTitle || metaTitle)
    updateMetaTag('twitter:description', seo.ogDescription || seo.metaDescription || `Trade cryptocurrencies and forex on ${siteName}`)
    if (seo.ogImage) {
      updateMetaTag('twitter:image', seo.ogImage.startsWith('http') ? seo.ogImage : `${API_URL}${seo.ogImage}`)
    } else if (settings.site?.logo) {
      updateMetaTag('twitter:image', settings.site.logo?.startsWith('http') ? settings.site.logo : `${API_URL}${settings.site.logo}`)
    }
  }, [settings])

  return null
}



