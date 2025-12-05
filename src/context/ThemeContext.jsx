import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Initialize theme immediately on mount - default to dark
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      const initialTheme = savedTheme || 'dark' // Default to dark mode
      
      // Apply theme immediately to prevent flash
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(initialTheme)
      
      return initialTheme
    }
    return 'dark'
  })

  useEffect(() => {
    // Update document class and localStorage
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(theme)
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

