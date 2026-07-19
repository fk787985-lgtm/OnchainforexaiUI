/** Shared status / priority styles for user Help Center + admin Support Desk */

export const TICKET_STATUS = {
  open: {
    label: 'Open',
    short: 'Open',
    cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700',
    dot: 'bg-slate-400'
  },
  in_progress: {
    label: 'In progress',
    short: 'Active',
    cls: 'bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200/70 dark:border-sky-900',
    dot: 'bg-sky-500'
  },
  resolved: {
    label: 'Resolved',
    short: 'Resolved',
    cls: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-900',
    dot: 'bg-emerald-500'
  },
  closed: {
    label: 'Closed',
    short: 'Closed',
    cls: 'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    dot: 'bg-slate-400'
  },
  archived: {
    label: 'Archived',
    short: 'Archived',
    cls: 'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    dot: 'bg-slate-400'
  }
}

export const TICKET_PRIORITY = {
  low: {
    label: 'Low',
    cls: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  },
  medium: {
    label: 'Medium',
    cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
  },
  high: {
    label: 'High',
    cls: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border-amber-200/80 dark:border-amber-900'
  },
  urgent: {
    label: 'Urgent',
    cls: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/80 dark:border-rose-900'
  }
}

export function isTicketLocked(status) {
  return ['closed', 'archived'].includes(status)
}

/** Categories for new tickets (subject prefix only — no API change) */
export const SUPPORT_TOPICS = [
  {
    id: 'deposit',
    label: 'Deposits',
    subject: 'Deposit inquiry',
    hint: 'Uncredited funds, network selection, confirmation delays'
  },
  {
    id: 'withdraw',
    label: 'Withdrawals',
    subject: 'Withdrawal inquiry',
    hint: 'Pending requests, failed transfers, fee questions'
  },
  {
    id: 'trade',
    label: 'Trading',
    subject: 'Trading inquiry',
    hint: 'Orders, positions, market access, settlement'
  },
  {
    id: 'kyc',
    label: 'Account & verification',
    subject: 'Account / verification inquiry',
    hint: 'KYC review, security, login access'
  },
  {
    id: 'transfer',
    label: 'Internal transfers',
    subject: 'Transfer inquiry',
    hint: 'Peer transfers and balance movements'
  },
  {
    id: 'other',
    label: 'Other',
    subject: 'Support request',
    hint: 'General platform questions'
  }
]
