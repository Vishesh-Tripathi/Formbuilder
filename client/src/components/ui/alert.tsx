import React from 'react'
import { cn } from '../../lib/utils'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning'
}

const Alert: React.FC<AlertProps> = ({ 
  className, 
  variant = 'default', 
  children,
  ...props 
}) => {
  const variants = {
    default: 'border-gray-200 bg-white text-gray-900',
    destructive: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-green-200 bg-green-50 text-green-900',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
  }

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-4',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  className, 
  children,
  ...props 
}) => {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Alert, AlertDescription }
