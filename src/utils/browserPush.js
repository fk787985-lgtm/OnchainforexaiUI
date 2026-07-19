/**
 * Browser Notification API helpers (native OS/browser push banners).
 * Works when permission is granted; shows even when tab is in background.
 */

const STORAGE_KEY = 'fx_push_permission_asked'

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const result = await Notification.requestPermission()
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    return result
  } catch {
    return 'denied'
  }
}

/** Soft-ask once after login (does not spam if already decided). */
export async function ensureNotificationPermissionOnce() {
  if (!isNotificationSupported()) return getNotificationPermission()
  if (Notification.permission !== 'default') return Notification.permission
  try {
    if (localStorage.getItem(STORAGE_KEY)) return 'default'
  } catch {
    /* ignore */
  }
  return requestNotificationPermission()
}

/**
 * Show a native system notification.
 * @returns {Notification|null}
 */
export function showBrowserPush({
  title,
  body,
  tag,
  icon,
  url,
  requireInteraction = false
} = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null
  }

  try {
    const n = new Notification(title || 'Notification', {
      body: body || '',
      tag: tag || `fx-${Date.now()}`,
      icon: icon || '/favicon.svg',
      badge: icon || '/favicon.svg',
      requireInteraction,
      silent: false
    })

    n.onclick = () => {
      try {
        window.focus()
        if (url) {
          // Prefer in-app navigation when possible
          if (url.startsWith('/')) {
            window.location.assign(url)
          } else {
            window.open(url, '_blank')
          }
        }
      } catch {
        /* ignore */
      }
      n.close()
    }

    // Auto-close after a while if not interactive
    if (!requireInteraction) {
      setTimeout(() => {
        try {
          n.close()
        } catch {
          /* ignore */
        }
      }, 8000)
    }

    return n
  } catch (err) {
    console.warn('[push] show failed', err)
    return null
  }
}

export function shouldShowPushForNewItem() {
  // Always show native push when granted (works in bg; still fine in fg as OS banners)
  return isNotificationSupported() && Notification.permission === 'granted'
}
