import React from 'react'

interface ToggleSwitchProps {
  label: string
  subtext?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/**
 * Modern glass-styled toggle switch component
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  subtext,
  checked,
  onChange
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-medium text-slate-300 tracking-wide cursor-pointer">
          {label}
        </label>
        {subtext && (
          <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative w-12 h-6 rounded-full transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-slate-800
          ${checked 
            ? 'bg-blue-500 shadow-lg shadow-blue-500/30' 
            : 'bg-slate-700 hover:bg-slate-600'
          }
        `}
      >
        <span
          className={`
            absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-lg
            transition-all duration-300 ease-out
            ${checked 
              ? 'left-[26px] bg-blue-100' 
              : 'left-0.5 bg-slate-200'
            }
          `}
        />
      </button>
    </div>
  )
}
