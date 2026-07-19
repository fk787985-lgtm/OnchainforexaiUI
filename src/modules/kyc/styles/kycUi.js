/** Premium KYC design tokens — inspired by Background Search, refined for Trading Platform */

export const kycInput =
  'w-full px-3.5 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60 transition-all'

export const kycSelect =
  'w-full px-3.5 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#1199fa] focus:ring-2 focus:ring-[#1199fa]/20 disabled:opacity-60 transition-all'

export const kycLabel =
  'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5'

export const kycHint = 'mt-1 text-xs text-slate-500 dark:text-slate-400'

export const kycError = 'mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-start gap-1'

export const kycCard =
  'rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 shadow-sm'

export const kycSection =
  'rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 p-4 sm:p-5 space-y-3.5'

export const kycSectionTitle =
  'text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-200/70 dark:border-slate-700/50'

export const kycBtnPrimary =
  'inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100'

export const kycBtnSecondary =
  'inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl font-semibold text-sm text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-teal-400/60 hover:bg-teal-50/50 dark:hover:bg-slate-800 transition-all disabled:opacity-50'

export const kycBtnGhost =
  'inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors disabled:opacity-50'

export const optionCard = (selected) =>
  `w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
    selected
      ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 shadow-sm shadow-teal-500/10'
      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-teal-400/50'
  }`

export const kycPageTitle =
  'text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight'

export const kycPageDesc = 'text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed'
