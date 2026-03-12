import Icon from './Icon'

export default function EmptyState({ title, description, icon = 'search' }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon name={icon} className="text-slate-500 dark:text-slate-400" />
      </div>
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {description ? <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p> : null}
    </div>
  )
}
