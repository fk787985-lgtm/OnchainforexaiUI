export const formatRelativeDate = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

export const formatMessageTime = (date) => {
  const d = new Date(date)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  if (messageDate.getTime() === today.getTime()) {
    return `Today at ${timeStr}`
  }
  if (messageDate.getTime() === today.getTime() - 86400000) {
    return `Yesterday at ${timeStr}`
  }
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeStr}`
}

export const shouldShowDateSeparator = (currentMsg, prevMsg) => {
  if (!prevMsg) return true
  const currentDate = new Date(currentMsg.createdAt).toDateString()
  const prevDate = new Date(prevMsg.createdAt).toDateString()
  return currentDate !== prevDate
}
