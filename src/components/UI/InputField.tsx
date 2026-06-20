import React from 'react'

interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  unit?: string // Optional unit suffix, e.g., "(мм)"
  displayMultiplier?: number // Optional multiplier for display (e.g., 1000 for mm)
  inputMin?: number // Min value constraint
  inputMax?: number // Max value constraint
  inputStep?: number // Step value
}

/**
 * Modern glass-styled input field component with optional mm conversion
 */
export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  unit,
  displayMultiplier,
  inputMin,
  inputMax,
  inputStep
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300 tracking-wide">
        {label}{unit && <span className="text-slate-400 ml-1">{unit}</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={inputMin}
        max={inputMax}
        step={inputStep}
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

/**
 * Parse mm input string to internal scale value
 * This is a helper that can be used by parent components
 */
export function parseMmInputToScale(valueMm: string, multiplier: number = 1000): number {
  const parsed = parseFloat(valueMm)
  if (isNaN(parsed)) return 0.3
  const scale = parsed / multiplier
  return Math.max(0.3, Math.min(2.0, scale))
}

/**
 * Convert internal scale value to mm display string
 */
export function scaleToMmDisplay(value: number, multiplier: number = 1000): string {
  return String(Math.round(value * multiplier))
}
