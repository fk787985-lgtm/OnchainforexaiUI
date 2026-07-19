import { TICKET_STATUS, TICKET_PRIORITY } from './ticketStyles'

export function TicketStatusPill({ status, size = 'sm' }) {
  const s = TICKET_STATUS[status] || TICKET_STATUS.open
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium tracking-normal border ${pad} ${s.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function TicketPriorityPill({ priority, size = 'sm' }) {
  const p = TICKET_PRIORITY[priority] || TICKET_PRIORITY.medium
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
  return (
    <span className={`inline-flex items-center rounded-md font-medium tracking-normal border ${pad} ${p.cls}`}>
      {p.label}
    </span>
  )
}
