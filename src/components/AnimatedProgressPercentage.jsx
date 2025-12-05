import { useState, useEffect } from 'react'

/**
 * Animated percentage that progresses based on timer completion
 * Only for active/open trades
 */
export default function AnimatedProgressPercentage({ 
  targetPercent, // The final percentage (win or loss)
  progress, // 0-100, how much of the timer has elapsed
  isWin,
  className = '' 
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (targetPercent === undefined || targetPercent === null || progress === undefined) {
      setDisplayValue(0)
      return
    }
    
    // Calculate current percentage based on progress
    // If timer is 50% complete, show 50% of target percentage
    const currentTarget = (targetPercent * progress) / 100
    const targetValue = parseFloat(currentTarget) || 0
    
    // Animate to current target
    const startValue = displayValue
    const startTime = Date.now()
    const duration = 500 // Smooth animation duration
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const animProgress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - animProgress, 3)
      const currentValue = startValue + (targetValue - startValue) * easeOutCubic
      
      setDisplayValue(currentValue)
      
      if (animProgress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [targetPercent, progress])

  if (targetPercent === undefined || targetPercent === null) return null

  const sign = isWin ? '+' : '-'
  const colorClass = isWin 
    ? 'text-green-500 dark:text-green-400' 
    : 'text-red-500 dark:text-red-400'

  return (
    <span className={`${colorClass} ${className} font-bold`}>
      {sign}{displayValue.toFixed(2)}%
    </span>
  )
}





