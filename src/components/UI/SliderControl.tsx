import React from 'react'

interface SliderControlProps {
  label: string
  sublabel?: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

/**
 * Modern glass-styled slider component
 */
export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  sublabel,
  value,
  min,
  max,
  step,
  onChange
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-slate-300 tracking-wide">
            {label}
          </label>
          {sublabel && (
            <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>
          )}
        </div>
        <span className="text-xs font-mono text-blue-400 bg-slate-700/50 px-2.5 py-1 rounded-lg border border-slate-600/30">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                   accent-blue-500 hover:accent-blue-400 
                   transition-all duration-200
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-blue-500
                   [&::-webkit-slider-thumb]:shadow-lg
                   [&::-webkit-slider-thumb]:shadow-blue-500/30
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:transition-all
                   [&::-webkit-slider-thumb]:duration-200
                   [&::-webkit-slider-thumb]:hover:scale-110
                   [&::-webkit-slider-thumb]:hover:bg-blue-400"
      />
      <div className="flex justify-between text-xs text-slate-500 font-mono">
        <span>{min.toFixed(1)}</span>
        <span>{(min + max) / 2}</span>
        <span>{max.toFixed(1)}</span>
      </div>
    </div>
  )
}
