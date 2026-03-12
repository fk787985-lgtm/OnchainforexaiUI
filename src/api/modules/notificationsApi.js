import api from '../../utils/axios'

export const getNotifications = async () => {
  const response = await api.get('/api/auth/notifications')
  return response.data
}

export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/api/auth/notifications/${encodeURIComponent(notificationId)}/read`)
  return response.data
}

export const markAllNotificationsRead = async () => {
  const response = await api.put('/api/auth/notifications/read-all')
  return response.data
}
