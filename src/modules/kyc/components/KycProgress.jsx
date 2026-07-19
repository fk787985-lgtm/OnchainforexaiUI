import { KYC_STEPS } from '../config/steps'

export default function KycProgress({ step }) {
  const trackSteps = KYC_STEPS.filter((s) => s.id !== 'submitted')
  const max = trackSteps.length
  const displayStep = Math.min(Math.max(step, 1), max)
  const percent = Math.round((displayStep / max) * 100)
  const current = KYC_STEPS.find((s) => s.number === displayStep)

  return (
    <div className="space-y-2" role="progressbar" aria-valuenow={displayStep} aria-valuemin={1} aria-valuemax={max}>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <span className="font-medium shrink-0">
          Step {displayStep} of {max}
        </span>
        <span className="truncate text-right text-[#1199fa] font-medium">{current?.label}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#1199fa] to-[#0b7dd4] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
