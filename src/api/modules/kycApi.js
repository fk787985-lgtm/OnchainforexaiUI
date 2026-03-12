import api from '../../utils/axios'

export const getKycSettings = async () => {
  const response = await api.get('/api/kyc/settings')
  return response.data
}

export const getMyKyc = async () => {
  const response = await api.get('/api/kyc')
  return response.data
}

export const getKycStatus = async () => {
  const response = await api.get('/api/kyc/status')
  return response.data
}

export const submitKycStep1 = async (payload) => {
  const response = await api.post('/api/kyc/step1', payload)
  return response.data
}

export const submitKycStep2 = async (payload) => {
  const response = await api.post('/api/kyc/step2', payload)
  return response.data
}

export const submitKycStep3 = async (formData) => {
  const response = await api.post('/api/kyc/step3', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}
