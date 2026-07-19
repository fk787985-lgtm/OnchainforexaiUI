import { useNavigate } from 'react-router-dom'
import NotificationBell from '../notifications/NotificationBell'

/**
 * Compact top bar with notification center for authenticated exchange pages.
 */
export default function UserTopBar({
  title,
  right,
  showBack = false,
  onBack,
  className = ''
}) {
  const navigate = useNavigate()

  return (
    <div className={`h-12 px-4 flex items-center justify-between gap-2 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={onBack || (() => navigate(-1))}
            className="p-1.5 -ml-1.5 rounded-lg text-[var(--fx-color-text-muted)] hover:bg-[var(--fx-color-surface-muted)]"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {title ? (
          <h1 className="text-[16px] font-semibold tracking-tight text-[var(--fx-color-text)] truncate">
            {title}
          </h1>
        ) : null}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {right}
        <NotificationBell />
      </div>
    </div>
  )
}
