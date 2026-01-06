// Gold price API - Real-time prices matching TradingView
import { getGoldPrice as getGoldFromMetals } from './metalsApi.js'

export const getGoldPrice = async () => {
  // Use the metals API which has real-time fetching with multiple sources
  return await getGoldFromMetals()
}
