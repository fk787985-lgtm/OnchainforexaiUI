import { useState, useEffect } from 'react'

export default function AnimatedPercentage({ 
  value, 
  isWin, 
  duration = 2000,
  className = '' 
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (value === undefined || value === null) return
    
    setIsAnimating(true)
    const startValue = 0
    const endValue = parseFloat(value) || 0
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (endValue - startValue) * easeOutCubic
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration])

  if (value === undefined || value === null) return null

  const sign = isWin ? '+' : '-'
  const colorClass = isWin 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400'

  return (
    <span className={`${colorClass} ${className} ${isAnimating ? 'font-bold' : ''}`}>
      {sign}{displayValue.toFixed(2)}%
    </span>
  )
}





