export default function ModalShell({
  title,
  icon,
  onClose,
  children,
  headerClassName = 'from-indigo-500 to-purple-600',
  maxWidthClassName = 'max-w-md',
  minHeightClassName = '',
  bodyClassName = '',
  overlayClassName = 'bg-black/60 dark:bg-black/80 backdrop-blur-lg'
}) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClassName}`}>
      <div className={`w-full ${maxWidthClassName} ${minHeightClassName} max-h-[90vh] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 flex flex-col overflow-hidden`}>
        <div className={`p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r ${headerClassName} rounded-t-2xl flex-shrink-0`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {icon}
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition text-white" aria-label="Close modal">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  )
}
