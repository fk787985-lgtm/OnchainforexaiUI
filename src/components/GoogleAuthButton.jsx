import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../utils/axios'
import { getClientNetworkMeta } from '../utils/clientNetworkMeta'
import toast from 'react-hot-toast'

let gisScriptPromise = null

function loadGisScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (gisScriptPromise) return gisScriptPromise
  gisScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-gis]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Google script failed')))
      if (window.google?.accounts?.id) resolve()
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.dataset.googleGis = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(s)
  })
  return gisScriptPromise
}

/**
 * Continue with Google — customer Sign In/Up, or admin portal login.
 * @param {string} endpoint - API path (default customer; use /api/auth/admin/google for admin)
 * @param {boolean} adminMode - when true, skip profile-completion flow
 */
export default function GoogleAuthButton({
  onSuccess,
  onRequiresProfile,
  onError,
  label = 'Continue with Google',
  endpoint = '/api/auth/google',
  adminMode = false
}) {
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [clientId, setClientId] = useState('')
  const hostRef = useRef(null)
  const handlersRef = useRef({ onSuccess, onRequiresProfile, onError })
  handlersRef.current = { onSuccess, onRequiresProfile, onError }
  const endpointRef = useRef(endpoint)
  endpointRef.current = endpoint
  const adminModeRef = useRef(adminMode)
  adminModeRef.current = adminMode

  const handleCredential = useCallback(async (credential) => {
    if (!credential) {
      toast.error('Google sign-in was cancelled')
      return
    }
    setLoading(true)
    try {
      const networkMeta = await getClientNetworkMeta()
      // Never send a stale Bearer token on Google login (avoids confusing 401s / logout loops)
      const { data } = await api.post(
        endpointRef.current,
        {
          idToken: credential,
          ...networkMeta,
          clientLocale: navigator.language || undefined
        },
        {
          headers: { Authorization: undefined },
          skipAuth: true
        }
      )
      if (!data.success) {
        throw new Error(data.message || 'Google authentication failed')
      }
      localStorage.setItem('token', data.token)
      if (
        !adminModeRef.current &&
        (data.requiresProfile || data.user?.profileComplete === false)
      ) {
        handlersRef.current.onRequiresProfile?.(data)
      } else {
        handlersRef.current.onSuccess?.(data)
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google authentication failed'
      toast.error(msg)
      handlersRef.current.onError?.(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get('/api/auth/google/config', { skipAuth: true })
        if (cancelled) return
        // Prefer server client id; fall back to Vite env if API omits it
        const id =
          (data.success && data.enabled && data.clientId) ||
          import.meta.env.VITE_GOOGLE_CLIENT_ID ||
          ''
        if (id) {
          setClientId(String(id).trim())
          setEnabled(true)
        }
      } catch {
        const fallback = import.meta.env.VITE_GOOGLE_CLIENT_ID
        if (!cancelled && fallback) {
          setClientId(String(fallback).trim())
          setEnabled(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!enabled || !clientId || !hostRef.current) return undefined
    let cancelled = false

    ;(async () => {
      try {
        await loadGisScript()
        if (cancelled || !window.google?.accounts?.id || !hostRef.current) return

        // ux_mode popup + FedCM reduces COOP / postMessage issues in modern Chrome
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) handleCredential(response.credential)
            else toast.error('Google sign-in was cancelled')
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          // popup is default; FedCM helps when COOP would block legacy postMessage
          use_fedcm_for_prompt: true,
          itp_support: true
        })

        hostRef.current.innerHTML = ''
        const width = Math.min(Math.max(hostRef.current.offsetWidth || 320, 240), 400)
        window.google.accounts.id.renderButton(hostRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width
        })
      } catch (err) {
        console.error('Google button render failed:', err)
        if (!cancelled) setEnabled(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, clientId, handleCredential])

  if (!enabled) {
    return (
      <div className="w-full text-center text-xs text-slate-400 py-2">
        {/* Hidden when not configured — parent can still show email form */}
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      {loading && (
        <p className="text-center text-xs text-slate-500 animate-pulse">Signing in with Google…</p>
      )}
      <div
        ref={hostRef}
        className="w-full flex justify-center min-h-[44px] [&>div]:w-full [&>div]:flex [&>div]:justify-center"
        aria-label={label}
      />
    </div>
  )
}
