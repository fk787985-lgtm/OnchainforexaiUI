const CACHE_KEY = 'clientNetworkMeta.v1'

const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

const writeCache = (meta) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(meta))
  } catch {
    // Ignore storage failures in private mode.
  }
}

const fetchWithTimeout = async (url, timeoutMs = 2500) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

const normalize = (data) => ({
  clientIp: data.ip || data.query || undefined,
  clientCity: data.city || undefined,
  clientCountry: data.country_name || data.country || undefined,
  clientRegion: data.region || data.regionName || undefined,
  clientIsp: data.org || data.isp || undefined,
  clientTimezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
  clientCountryCode: data.country_code || data.countryCode || undefined,
  clientLat: data.latitude ?? data.lat ?? undefined,
  clientLon: data.longitude ?? data.lon ?? undefined
})

export const getClientNetworkMeta = async () => {
  if (typeof window === 'undefined') return {}

  const cached = readCache()
  if (cached) return cached

  try {
    const first = await fetchWithTimeout('https://ipapi.co/json/')
    const normalized = normalize(first)
    writeCache(normalized)
    return normalized
  } catch {
    try {
      const second = await fetchWithTimeout('https://ipwho.is/')
      const normalized = normalize(second)
      writeCache(normalized)
      return normalized
    } catch {
      return {
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
      }
    }
  }
}
