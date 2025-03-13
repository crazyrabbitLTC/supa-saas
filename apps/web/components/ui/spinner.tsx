/**
 * @file Spinner component
 * @version 1.0.0
 * 
 * A simple spinner component for loading states.
 */

import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }
  
  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", 
        sizeClasses[size], 
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
} 