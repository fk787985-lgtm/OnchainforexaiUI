import Icon from './Icon'

const ALERT_STYLES = {
  info: 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-300',
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
}

export default function Alert({ variant = 'info', message }) {
  const iconName = variant === 'error' || variant === 'warning' ? 'alert' : variant === 'success' ? 'check' : 'shield'
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${ALERT_STYLES[variant]}`}>
      <Icon name={iconName} size="sm" className="mt-0.5" />
      <span>{message}</span>
    </div>
  )
}
