export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null

  return (
    <nav className="text-xs sm:text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span>/</span> : null}
            <span className={index === items.length - 1 ? 'text-slate-900 dark:text-slate-100 font-medium' : ''}>{item.label}</span>
          </li>
        ))}
      </ol>
    </nav>
  )
}
