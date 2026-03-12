import { useMemo } from 'react'
import { formatMarketPrice, getChangeMeta } from '../../../utils/formatters/marketFormatters'
import SkeletonBlock from '../../../components/common/SkeletonBlock'
import PageHeader from '../../../components/ui/PageHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Icon from '../../../components/ui/Icon'

export default function MarketListPage({
  title,
  subtitle,
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  loading,
  data,
  emptyLabel,
  rowLabel,
  onBack,
  getName,
  getSubLabel,
  getPrice,
  renderPrice,
  getChange,
  onRowClick
}) {
  const rows = useMemo(() => data || [], [data])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors pb-20">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 py-3 flex items-center space-x-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <Icon name="back" size="lg" />
          </button>
          <div className="flex-1 min-w-0"><PageHeader title={title} description={subtitle} /></div>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
          />
          <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <main className="px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="hidden sm:grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-600 dark:text-gray-400">
            <div>{rowLabel}</div>
            <div className="text-right">Last Price</div>
            <div className="text-right">24h Change%</div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="grid sm:grid-cols-3 gap-3">
                    <SkeletonBlock className="h-10 w-full" />
                    <SkeletonBlock className="h-10 w-full" />
                    <SkeletonBlock className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : rows.length > 0 ? (
              rows.map((item, index) => {
                const price = getPrice(item)
                const changeMeta = getChangeMeta(getChange(item))
                const subLabel = getSubLabel(item)
                return (
                  <button
                    key={item.id || item._id || item.symbol || item.pair || index}
                    onClick={() => onRowClick?.(item)}
                    className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <div className="grid sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                      <div>
                        <div className="font-semibold text-sm">{getName(item)}</div>
                        {subLabel ? <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subLabel}</div> : null}
                      </div>
                      <div className="sm:text-right">
                        <div className="font-semibold text-sm">
                          {renderPrice ? renderPrice(item) : `$${formatMarketPrice(price)}`}
                        </div>
                      </div>
                      <div className="sm:text-right text-sm">
                        {changeMeta ? (
                          <span className={changeMeta.isPositive ? 'text-green-500' : 'text-red-500'}>{changeMeta.label}</span>
                        ) : (
                          <span className="text-gray-500">--</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <EmptyState title={emptyLabel} description="Try a different filter or check back later." icon="market" />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
