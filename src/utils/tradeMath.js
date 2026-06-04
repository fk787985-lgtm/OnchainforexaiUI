const toNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

export const getTradeDirectionLabel = (trade) => (trade?.side === 'buy' ? 'Long' : 'Short')

export const getTradeRoiPercent = (trade) => {
  if (!trade) return 0
  if (Number.isFinite(Number(trade.roiPercent))) return Number(trade.roiPercent)
  if (Number.isFinite(Number(trade.profitPercent)) && Number(trade.profitPercent) > 0) return Number(trade.profitPercent)
  if (Number.isFinite(Number(trade.lossPercent)) && Number(trade.lossPercent) > 0) return -Number(trade.lossPercent)

  const margin = toNumber(trade.marginUsed ?? trade.amount, 0)
  const netPnl = toNumber(trade.netProfit ?? trade.profit, 0)
  if (margin <= 0) return 0
  return (netPnl / margin) * 100
}

export const getTradeNetProfit = (trade) => toNumber(trade?.netProfit ?? trade?.profit, 0)

export const getTradeDurationSeconds = (trade) => {
  if (!trade) return 0
  if (Number.isFinite(Number(trade.durationSeconds))) return Math.max(0, Number(trade.durationSeconds))
  const start = new Date(trade.createdAt).getTime()
  const end = new Date(trade.closedAt || trade.createdAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0
  return Math.max(0, Math.floor((end - start) / 1000))
}

export const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(toNumber(seconds, 0)))
  const hrs = Math.floor(safeSeconds / 3600)
  const mins = Math.floor((safeSeconds % 3600) / 60)
  const secs = safeSeconds % 60
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

