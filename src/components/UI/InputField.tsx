import React from 'react'

interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

/**
 * Modern glass-styled input field component
 */
export const InputField: React.FC<InputFieldProps> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300 tracking-wide">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900/70 rounded-xl px-4 py-3 text-slate-200 
                   border border-transparent
                   placeholder-slate-500
                   focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                   transition-all duration-200
                   hover:border-slate-600/50"
      />
    </div>
  )
}
