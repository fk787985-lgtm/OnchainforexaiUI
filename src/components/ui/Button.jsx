export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  ...props
}) {
  const variantClasses = {
    primary: 'fx-btn fx-btn-primary',
    secondary: 'fx-btn fx-btn-secondary',
    danger: 'fx-btn fx-btn-danger',
    ghost: 'fx-btn fx-btn-ghost'
  }

  const sizeClasses = {
    sm: 'fx-btn-sm',
    md: '',
    lg: 'fx-btn-lg'
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || ''} ${
        fullWidth ? 'fx-btn-block' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
