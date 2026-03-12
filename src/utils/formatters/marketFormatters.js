export const toNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

export const formatMarketPrice = (price) => {
  const numericPrice = toNumber(price)
  if (numericPrice === null || numericPrice === 0) return '0.00'
  if (numericPrice < 0.01) return numericPrice.toFixed(6)
  if (numericPrice < 1) return numericPrice.toFixed(4)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericPrice)
}

export const getChangeMeta = (change) => {
  const numericChange = toNumber(change)
  if (numericChange === null) return null
  return {
    value: numericChange,
    isPositive: numericChange >= 0,
    label: `${numericChange >= 0 ? '+' : ''}${numericChange.toFixed(2)}%`
  }
}

export const formatMarketCapBillions = (marketCap) => {
  const numericMarketCap = toNumber(marketCap)
  if (numericMarketCap === null) return '--'
  return `$${(numericMarketCap / 1e9).toFixed(2)}B`
}
