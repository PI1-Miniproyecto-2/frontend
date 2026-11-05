
import type { ReactNode } from 'react'

interface AlertProps {
  type?: 'success' | 'error' | 'info'
  children: ReactNode
}

function Alert({ type = 'info', children }: AlertProps) {
  const styles = {
    success: 'border-green-300 bg-green-50 text-green-900',
    error: 'border-red-300 bg-red-50 text-red-900',
    info: 'border-blue-300 bg-blue-50 text-blue-900',
  }

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`rounded-lg border p-4 ${styles[type]}`}
    >
      {children}
    </div>
  )
}

export default Alert
