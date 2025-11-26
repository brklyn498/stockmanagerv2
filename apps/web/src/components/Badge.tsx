interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export default function Badge({
  children,
  variant = 'info',
  className = '',
}: BadgeProps) {
  const variantClasses = {
    success: 'neo-badge-success',
    warning: 'neo-badge-warning',
    danger: 'neo-badge-danger',
    info: 'neo-badge-info',
  }

  return (
    <span className={`${variantClasses[variant]} ${className}`}>{children}</span>
  )
}
