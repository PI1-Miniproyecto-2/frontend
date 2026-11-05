
import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

function Input({ label, error, className = '', id, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="font-medium text-[#073B43]">
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>

      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-[#0B766E] focus-visible:ring-offset-2 ${className}`}
        {...props}
      />

      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
