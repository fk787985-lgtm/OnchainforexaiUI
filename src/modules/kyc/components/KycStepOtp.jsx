import { useEffect, useRef, useState } from 'react'

export default function KycStepOtp({
  otpSentTo,
  onSend,
  onVerify,
  onBack,
  loading,
  error,
  expiresInSec = 900
}) {
  const length = 6
  const [digits, setDigits] = useState(Array(length).fill(''))
  const [seconds, setSeconds] = useState(expiresInSec)
  const [sent, setSent] = useState(Boolean(otpSentTo))
  const inputs = useRef([])

  useEffect(() => {
    if (!sent) return undefined
    if (seconds <= 0) return undefined
    const t = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [seconds, sent])

  useEffect(() => {
    if (otpSentTo) setSent(true)
  }, [otpSentTo])

  const code = digits.join('')
  const mins = Math.floor(Math.max(0, seconds) / 60)
  const secs = String(Math.max(0, seconds) % 60).padStart(2, '0')

  const setDigit = (index, value) => {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = v
    setDigits(next)
    if (v && index < length - 1) inputs.current[index + 1]?.focus()
  }

  const handleSend = async () => {
    const result = await onSend()
    if (result !== false) {
      setSent(true)
      setSeconds(expiresInSec)
      setDigits(Array(length).fill(''))
      setTimeout(() => inputs.current[0]?.focus(), 50)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">OTP Verification</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Confirm your identity with a one-time code sent to your email.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4">
        {!sent ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send verification code'}
          </button>
        ) : (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Code sent to {otpSentTo || 'your email'}
            </p>
            <div className="flex justify-center gap-2">
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
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus()
                  }}
                  className="w-11 h-12 text-center text-lg font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 outline-none focus:border-cyan-500"
                />
              ))}
            </div>
            <p className="text-center text-xs text-slate-500">
              Expires in {mins}:{secs}
            </p>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <button
              type="button"
              disabled={code.length !== length || loading}
              onClick={() => onVerify(code)}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify & submit'}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="w-full text-sm text-cyan-600 dark:text-cyan-400 font-medium"
            >
              Resend code
            </button>
          </>
        )}
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold disabled:opacity-60"
          disabled={loading}
        >
          Back
        </button>
      )}
    </div>
  )
}
