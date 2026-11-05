
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
}

function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  const styles = {
    primary: 'bg-[#073B43] text-white hover:bg-[#0B4F55]',
    secondary: 'border border-[#073B43] text-[#073B43] hover:bg-[#E8F5F3]',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  return (
    <button
      className={`rounded-lg px-5 py-2.5 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0B766E] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
