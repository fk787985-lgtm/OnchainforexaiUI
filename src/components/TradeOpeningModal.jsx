import { useState, useEffect } from 'react'

export default function TradeOpeningModal({ trade, onClose }) {
  const [timeRemaining, setTimeRemaining] = useState(trade.timer)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!trade) return

    const interval = setInterval(() => {
      const now = new Date()
      const end = new Date(trade.endTime)
      const remaining = Math.max(0, Math.floor((end - now) / 1000))
      
      setTimeRemaining(remaining)
      const elapsed = trade.timer - remaining
      const progressPercent = (elapsed / trade.timer) * 100
      setProgress(progressPercent)

      if (remaining <= 0) {
        clearInterval(interval)
        onClose()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [trade, onClose])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    const centiseconds = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`
  }

  const circumference = 2 * Math.PI * 50 // radius = 50
  const strokeDashoffset = circumference - (progress / 100) * circumference

  if (!trade) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg"
        onClick={onClose}
      />
      
      {/* Modal Card - Dark/Light Theme */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-teal-600 dark:text-teal-400 font-semibold text-base">
              {trade.symbol ? `${trade.symbol} Contract` : 'Trade Contract'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-red-500 dark:text-red-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-white dark:bg-gray-900">
          {/* Date and Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 text-xs">
              {new Date().toLocaleString()}
            </span>
            <div className="flex items-center space-x-1.5 text-yellow-600 dark:text-yellow-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-xs">{timeRemaining}s Running</span>
            </div>
          </div>

          {/* Circular Timer */}
          <div className="flex justify-center">
            <div className="relative w-40 h-40">
              <svg className="transform -rotate-90 w-40 h-40">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-green-500 dark:text-green-400 transition-all duration-100"
                />
              </svg>
              {/* Time Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                    {timeRemaining}s
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Info */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700 dark:text-white font-medium">Amount (USDT)</span>
              </div>
              <span className="text-green-600 dark:text-green-400 font-bold text-lg">{trade.amount}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-gray-700 dark:text-white font-medium">Price</span>
              </div>
              <span className="text-gray-900 dark:text-white font-semibold">{formatPrice(trade.entryPrice)}</span>
            </div>
          </div>

          {/* Trade Details */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Open:</span>
              <span className="text-gray-900 dark:text-white font-semibold">{formatPrice(trade.entryPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Close:</span>
              <span className="text-gray-400 dark:text-gray-500">---</span>
            </div>
          </div>

          {/* Buy/Sell Button */}
          <button className={`w-full font-semibold py-3 rounded-lg transition ${
            trade.side === 'buy'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}>
            {trade.side === 'buy' ? 'Buy' : 'Sell'}
          </button>
        </div>

        {/* Bottom Timer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end">
          <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono font-semibold text-sm">
              {formatTime(timeRemaining)}
            </span>
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
