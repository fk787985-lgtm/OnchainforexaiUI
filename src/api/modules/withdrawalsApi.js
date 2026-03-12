import api from '../../utils/axios'

export const getWithdrawalSettings = async () => {
  const response = await api.get('/api/withdrawals/settings')
  return response.data
}

export const createWithdrawal = async (payload) => {
  const response = await api.post('/api/withdrawals/create', payload)
  return response.data
}
