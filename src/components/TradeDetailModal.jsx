export default function TradeDetailModal({ trade, onClose }) {
  if (!trade) return null

  const isWin = trade.result === 'win'
  const profitLoss = trade.profit || 0
  const profitPercent = isWin ? (trade.profitPercent || 0) : (trade.lossPercent || 0)
  const isPending = trade.status === 'open' || trade.result === 'pending'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Card - Dark/Light Theme */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Order Detail</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </button>
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">EN</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
          {/* Profit/Loss at Top - Compact */}
          {!isPending && (
            <div className={`p-3 rounded-lg border ${
              isWin 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  {isWin ? (
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  )}
                  <span className={`text-xs font-semibold ${
                    isWin 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {isWin ? 'Profit' : 'Loss'}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  isWin 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {isWin ? 'WIN' : 'LOSS'}
                </span>
              </div>
              <div className={`text-xl font-bold mb-0.5 ${
                isWin 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {trade.profit >= 0 ? '+' : ''}{formatPrice(trade.profit)} USDT
              </div>
              <div className={`text-sm font-semibold ${
                isWin 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {isWin ? '+' : '-'}{profitPercent.toFixed(2)}%
              </div>
            </div>
          )}

          {/* Status Badge and Symbol */}
          <div className="flex items-center justify-between">
            {isPending && (
              <button className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                isPending 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                  : isWin 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
              }`}>
                {isPending ? 'PENDING' : isWin ? 'WIN' : 'LOSS'}
              </button>
            )}
            <div className="text-gray-900 dark:text-white font-semibold text-base">{trade.symbol} / USDT</div>
          </div>

          {/* Order Details - Compact Alignment */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Order No</div>
                <div className="text-[10px] text-gray-900 dark:text-white font-mono truncate">{trade._id?.slice(-16) || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Type</div>
                <div className={`text-xs font-semibold ${trade.side === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {trade.side === 'buy' ? 'LONG' : 'SHORT'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Trade Amount</div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">${formatPrice(trade.marginUsed || trade.amount)}</div>
                <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">USDT</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Leverage</div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">{trade.leverage}x</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Order Type</div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">Market</div>
              </div>
            </div>
          </div>

          {/* Trade Details Section - Compact */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-bold mb-3 uppercase text-xs tracking-wide">Price Details</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 border border-blue-200 dark:border-blue-800/30">
                <div className="flex items-center space-x-1.5 mb-1">
                  <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Entry</span>
                </div>
                <div className="text-sm font-bold text-blue-700 dark:text-blue-300">${formatPrice(trade.entryPrice)}</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2.5 border border-purple-200 dark:border-purple-800/30">
                <div className="flex items-center space-x-1.5 mb-1">
                  <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Exit</span>
                </div>
                <div className="text-sm font-bold text-purple-700 dark:text-purple-300">
                  {trade.exitPrice ? `$${formatPrice(trade.exitPrice)}` : '---'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
                <div className="flex items-center space-x-1.5 mb-0.5">
                  <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Date</span>
                </div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  {new Date(trade.closedAt || trade.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
                <div className="flex items-center space-x-1.5 mb-0.5">
                  <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Time</span>
                </div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  {new Date(trade.closedAt || trade.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function
function formatPrice(price) {
  if (!price) return '0.00'
  return parseFloat(price).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}
