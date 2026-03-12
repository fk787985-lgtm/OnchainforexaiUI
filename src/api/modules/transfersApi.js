import api from '../../utils/axios'

export const searchTransferUsers = async (query) => {
  const response = await api.get(`/api/transfers/search?query=${encodeURIComponent(query)}`)
  return response.data
}

export const getRecentTransferRecipients = async () => {
  const response = await api.get('/api/transfers/recent-recipients')
  return response.data
}

export const createTransfer = async (payload) => {
  const response = await api.post('/api/transfers/create', payload)
  return response.data
}
