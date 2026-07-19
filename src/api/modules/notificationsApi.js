import api from '../../utils/axios'

export const getNotifications = async (params = {}) => {
  try {
    const qs = new URLSearchParams(params).toString()
    const response = await api.get(`/api/notifications${qs ? `?${qs}` : ''}`)
    return response.data
  } catch {
    const response = await api.get('/api/auth/notifications')
    return response.data
  }
}

export const markNotificationRead = async (notificationId) => {
  try {
    const response = await api.put(
      `/api/notifications/${encodeURIComponent(notificationId)}/read`
    )
    return response.data
  } catch {
    const response = await api.put(
      `/api/auth/notifications/${encodeURIComponent(notificationId)}/read`
    )
    return response.data
  }
}

export const markAllNotificationsRead = async () => {
  try {
    const response = await api.put('/api/notifications/read-all')
    return response.data
  } catch {
    const response = await api.put('/api/auth/notifications/read-all')
    return response.data
  }
}

export const getUnreadCount = async () => {
  const response = await api.get('/api/notifications/unread-count')
  return response.data
}

export const archiveNotification = async (notificationId) => {
  const response = await api.put(
    `/api/notifications/${encodeURIComponent(notificationId)}/archive`
  )
  return response.data
}

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(
    `/api/notifications/${encodeURIComponent(notificationId)}`
  )
  return response.data
}
