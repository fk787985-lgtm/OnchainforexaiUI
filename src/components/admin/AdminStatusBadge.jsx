import Badge from '../ui/Badge'

const STATUS_MAP = {
  approved: 'completed',
  success: 'completed',
  under_review: 'pending'
}

export default function AdminStatusBadge({ status }) {
  const normalized = String(status || 'default').toLowerCase()
  const mapped = STATUS_MAP[normalized] || normalized
  const label = normalized.replace(/_/g, ' ')
  return <Badge label={label.charAt(0).toUpperCase() + label.slice(1)} status={mapped} />
}
