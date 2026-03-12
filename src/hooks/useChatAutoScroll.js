import { useCallback, useEffect, useRef } from 'react'

export default function useChatAutoScroll(messages, containerRef, threshold = 120) {
  const shouldAutoScrollRef = useRef(true)

  const isNearBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    return distanceFromBottom <= threshold
  }, [containerRef, threshold])

  const handleScroll = useCallback(() => {
    shouldAutoScrollRef.current = isNearBottom()
  }, [isNearBottom])

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const container = containerRef.current
    if (!container) return
    container.scrollTo({
      top: container.scrollHeight,
      behavior
    })
  }, [containerRef])

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom('smooth')
    }
  }, [messages, scrollToBottom])

  return {
    handleScroll,
    scrollToBottom,
    isNearBottom
  }
}
