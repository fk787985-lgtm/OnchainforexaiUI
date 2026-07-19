/**
 * On / Off segmented control (radio-style) for admin settings.
 * Clearer than a small switch on mobile.
 */
export default function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
  onLabel = 'On',
  offLabel = 'Off',
  size = 'md'
}) {
  const isOn = Boolean(enabled)
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
  const wrap = size === 'sm' ? 'p-0.5' : 'p-1'

  return (
    <div
      role="radiogroup"
      aria-label="Toggle"
      className={`inline-flex rounded-full bg-slate-200/90 dark:bg-slate-700/90 ${wrap} ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={!isOn}
        disabled={disabled}
        onClick={() => {
          if (isOn) onChange(false)
        }}
        className={`${pad} rounded-full font-semibold transition min-w-[3.25rem] ${
          !isOn
            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-slate-300/80 dark:ring-slate-600'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        {offLabel}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={isOn}
        disabled={disabled}
        onClick={() => {
          if (!isOn) onChange(true)
        }}
        className={`${pad} rounded-full font-semibold transition min-w-[3.25rem] ${
          isOn
            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        {onLabel}
      </button>
    </div>
  )
}
