import api from '../../utils/axios'

export const initiateCardBuy = async (payload) => {
  const response = await api.post('/api/buy/card-initiate', payload)
  return response.data
}

export const submitBuyOtp = async (payload) => {
  const response = await api.post('/api/buy/card-submit-otp', payload)
  return response.data
}

export const resendBuyOtp = async (payload) => {
  const response = await api.post('/api/buy/card-resend-otp', payload)
  return response.data
}

export const getBuyStatus = async (id) => {
  const response = await api.get(`/api/buy/status/${id}`)
  return response.data
}

export const getMyPurchases = async () => {
  const response = await api.get('/api/buy/my')
  return response.data
}
