import { useEffect, useRef, useState } from 'react'
import api from '../../utils/axios'

/**
 * Buy OTP entry — code is delivered to the user's phone by admin.
 * Never displays the OTP or previous codes on this page.
 */
export default function PaymentOtpPage({
  pending,
  onVerify,
  onResend,
  onCancel,
  onRejectedBackToEntry,
  onPaymentCompleted,
  loading,
  error,
  sentBanner,
  statusPath = '/api/buy/status'
}) {
  const length = 6
  const [digits, setDigits] = useState(Array(length).fill(''))
  const [seconds, setSeconds] = useState(pending?.otpExpiresInSec || 1800)
  const [phase, setPhase] = useState(() =>
    pending?.waitingForAdmin || pending?.status === 'otp_submitted' ? 'waiting' : 'entry'
  )
  const [localError, setLocalError] = useState(error || '')
  const [codeSentNotice, setCodeSentNotice] = useState(
    sentBanner || pending?.otpSentTo
      ? `A verification code was sent to ${pending?.otpSentTo || 'your phone'}`
      : ''
  )
  const inputs = useRef([])

  useEffect(() => {
    if (error) setLocalError(error)
  }, [error])

  useEffect(() => {
    if (phase === 'entry') {
      setDigits(Array(length).fill(''))
      setTimeout(() => inputs.current[0]?.focus(), 50)
    }
  }, [phase])

  useEffect(() => {
    if (seconds <= 0 || phase !== 'entry') return undefined
    const t = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [seconds, phase])

  // Poll status while waiting for admin / telegram decision
  useEffect(() => {
    if (phase !== 'waiting' || !pending?.id) return undefined
    let cancelled = false

    const tick = async () => {
      try {
        const { data } = await api.get(`${statusPath}/${pending.id}`)
        if (cancelled || !data?.transaction) return
        const d = data.transaction

        if (d.completed || d.status === 'completed' || d.status === 'otp_approved') {
          setPhase('completed')
          onPaymentCompleted?.(d)
          return
        }

        if (d.rejected || d.status === 'otp_rejected') {
          setPhase('entry')
          setLocalError('Incorrect code. Please try again.')
          setDigits(Array(length).fill(''))
          setCodeSentNotice(
            pending?.otpSentTo
              ? `Enter the code again, or resend a new code to ${pending.otpSentTo}`
              : 'Enter the code again, or resend a new code'
          )
          onRejectedBackToEntry?.({
            message: 'Incorrect code',
            status: 'otp_rejected'
          })
          return
        }

        if (d.status === 'awaiting_otp') {
          setPhase('entry')
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
  }, [phase, pending?.id, pending?.otpSentTo, onRejectedBackToEntry, onPaymentCompleted, statusPath])

  const code = digits.join('')
  const mins = Math.floor(Math.max(0, seconds) / 60)
  const secs = String(Math.max(0, seconds) % 60).padStart(2, '0')

  const setDigit = (index, value) => {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = v
    setDigits(next)
    if (localError) setLocalError('')
    if (v && index < length - 1) inputs.current[index + 1]?.focus()
  }

  const onKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter' && code.length === length) {
      submitCode()
    }
  }

  const onPaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!text) return
    const next = Array(length).fill('')
    text.split('').forEach((c, i) => {
      next[i] = c
    })
    setDigits(next)
    setLocalError('')
    inputs.current[Math.min(text.length, length - 1)]?.focus()
  }

  const submitCode = async () => {
    if (code.length !== length || loading) return
    setLocalError('')
    const ok = await onVerify(code)
    if (ok !== false) {
      setPhase('waiting')
    } else {
      setPhase('entry')
      setLocalError('Incorrect code. Please try again.')
      setDigits(Array(length).fill(''))
      setTimeout(() => inputs.current[0]?.focus(), 50)
    }
  }

  const handleResend = async () => {
    setLocalError('')
    const result = await onResend()
    if (!result) return
    setSeconds(result.otpExpiresInSec || pending?.otpExpiresInSec || 1800)
    setDigits(Array(length).fill(''))
    setPhase('entry')
    const to = result?.otpSentTo || pending?.otpSentTo || 'your phone'
    setCodeSentNotice(`A new verification code was sent to ${to}`)
    setTimeout(() => inputs.current[0]?.focus(), 80)
  }

  if (phase === 'completed') {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment confirmed</h1>
        <p className="text-slate-500 text-sm mb-6">Your cryptocurrency purchase has been completed.</p>
      </div>
    )
  }

  if (phase === 'waiting') {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 sm:p-8">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verifying your code</h1>
          <p className="text-slate-500 text-sm">
            We are reviewing your code. This page updates automatically.
          </p>
          {pending?.transactionId && (
            <p className="mt-4 text-xs text-slate-400 font-mono">{pending.transactionId}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 sm:p-8">
      <div className="text-center mb-4">
        <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Enter verification code</h1>
        <p className="text-sm text-slate-500 mt-1">
          We sent a 6-digit code to {pending?.otpSentTo || 'your phone'}
        </p>
      </div>

      {codeSentNotice && (
        <div className="mb-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-800 px-3 py-2 text-xs text-cyan-800 dark:text-cyan-200">
          {codeSentNotice}
        </div>
      )}

      <div className="flex justify-center gap-2 mb-4" onPaste={onPaste}>
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
            className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none"
          />
        ))}
      </div>

      {localError && (
        <p className="text-center text-sm text-red-600 mb-3">{localError}</p>
      )}

      <p className="text-center text-xs text-slate-500 mb-4">
        Code expires in {mins}:{secs}
      </p>

      <button
        type="button"
        disabled={code.length !== length || loading}
        onClick={submitCode}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white py-3.5 font-semibold disabled:opacity-50 mb-3"
      >
        {loading ? 'Submitting…' : 'Verify code'}
      </button>

      <div className="flex items-center justify-between text-sm mb-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="text-cyan-600 dark:text-cyan-400 font-medium hover:underline disabled:opacity-50"
        >
          Resend code
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-slate-500 hover:underline">
            Cancel
          </button>
        )}
      </div>

      {pending?.transactionId && (
        <p className="mt-3 text-center text-[11px] text-slate-400 font-mono">{pending.transactionId}</p>
      )}
    </div>
  )
}

export function PurchaseConfirmedCard({ transaction, onDone }) {
  if (!transaction) return null
  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-8">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase successful</h1>
        <p className="text-sm text-slate-500 mt-1">Your asset balance has been updated.</p>
      </div>

      <dl className="space-y-3 text-sm">
        <Row label="Coin" value={`${transaction.coinName || ''} (${transaction.coinSymbol || ''})`} />
        <Row
          label="Amount purchased"
          value={`${Number(transaction.coinAmount || 0).toFixed(8)} ${transaction.coinSymbol || ''}`}
        />
        <Row
          label="Fiat amount"
          value={`$${Number(transaction.fiatAmount || 0).toFixed(2)} ${transaction.currency || 'USD'}`}
        />
        <Row label="Transaction ID" value={transaction.transactionId || transaction.id} mono />
        <Row
          label="Date & time"
          value={
            transaction.confirmedAt || transaction.createdAt
              ? new Date(transaction.confirmedAt || transaction.createdAt).toLocaleString()
              : '—'
          }
        />
        <Row label="Status" value="Completed" success />
      </dl>

      {onDone && (
        <button
          type="button"
          onClick={onDone}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white py-3.5 font-semibold"
        >
          Back to Assets
        </button>
      )}
    </div>
  )
}

function Row({ label, value, mono, success }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`text-right font-medium ${
          success
            ? 'text-emerald-600'
            : mono
              ? 'font-mono text-xs text-slate-700 dark:text-slate-200 break-all'
              : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
