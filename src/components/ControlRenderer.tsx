import React, { useState, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { analytics } from '../utils/analytics'

export type ControlType = 'inputs' | 'sliders' | 'mixed' | 'hybrid'

interface ControlItem {
  id: string
  label: string
  sublabel?: string
  axis: 'x' | 'y' | 'z'
  type: 'threshold' | 'offset'
}

/**
 * Generate control items for thresholds and offsets
 */
function getControlItems(): ControlItem[] {
  const items: ControlItem[] = []
  
  // Threshold controls
  ;(['x', 'y', 'z'] as const).forEach((axis) => {
    items.push({
      id: `threshold-${axis}`,
      label: `${axis.toUpperCase()} Threshold`,
      sublabel: `Distance from origin along ${axis} axis`,
      axis,
      type: 'threshold',
    })
  })
  
  // Offset controls
  ;(['x', 'y', 'z'] as const).forEach((axis) => {
    items.push({
      id: `offset-${axis}`,
      label: `Offset ${axis.toUpperCase()}`,
      sublabel: `Position adjustment along ${axis} axis (X${'>'}0 zone)`,
      axis,
      type: 'offset',
    })
  })
  
  return items
}

/**
 * Text Input Control
 */
function InputControl({ item, value, onChange }: { item: ControlItem; value: number; onChange: (v: number) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0
    onChange(val)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300 tracking-wide">{item.label}</label>
      <input
        type="number"
        step={5}
        value={value}
        onChange={handleChange}
        className="w-full bg-slate-900/70 rounded-xl px-4 py-3 text-slate-200 
                   border border-transparent focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                   transition-all duration-200"
      />
    </div>
  )
}

/**
 * Slider Control
 */
function SliderControlComponent({ item, value, onChange }: { item: ControlItem; value: number; onChange: (v: number) => void }) {
  const min = item.type === 'offset' ? -2 : -2
  const max = item.type === 'offset' ? 2 : 2
  const step = item.type === 'offset' ? 0.01 : 0.05

  // Color based on axis
  const accentColor = item.axis === 'x' ? 'accent-blue-500' : item.axis === 'y' ? 'accent-green-500' : 'accent-purple-500'
  const valueColor = item.axis === 'x' ? 'text-blue-400' : item.axis === 'y' ? 'text-green-400' : 'text-purple-400'

  return (
    <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg border border-white/10">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 tracking-wide">{item.label}</label>
        <span className="text-xs text-slate-400">{item.axis.toUpperCase()}{' > '}0</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer ${accentColor}`}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}</span>
        <span className={`font-medium ${valueColor}`}>{value.toFixed(2)}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

/**
 * Hybrid Control (Slider + Input synced)
 */
function HybridControl({ item, value, onChange }: { item: ControlItem; value: number; onChange: (v: number) => void }) {
  const [localValue, setLocalValue] = useState(String(value))

  const handleSliderChange = (v: number) => {
    setLocalValue(String(v))
    onChange(v)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalValue(val)
    const num = parseFloat(val)
    if (!isNaN(num)) {
      onChange(num)
    }
  }

  const min = item.type === 'offset' ? -2 : -2
  const max = item.type === 'offset' ? 2 : 2

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 tracking-wide">{item.label}</label>
        <input
          type="number"
          step={5}
          value={localValue}
          onChange={handleInputChange}
          className="w-20 bg-slate-900/70 rounded-lg px-2 py-1 text-sm text-slate-200 text-right
                     border border-transparent focus:border-blue-500/50"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  )
}

interface ControlRendererProps {
  variant: ControlType
  showThresholds?: boolean
  showOffsets?: boolean
}

/**
 * Main Control Renderer - Renders controls based on variant
 */
export const ControlRenderer: React.FC<ControlRendererProps> = ({ 
  variant, 
  showThresholds = true,
  showOffsets = true 
}) => {
  const { 
    xThreshold, yThreshold, zThreshold,
    xOffset, yOffset, zOffset,
    setThreshold, setOffset,
  } = useStore()

  const items = getControlItems().filter(item => {
    if (item.type === 'threshold' && !showThresholds) return false
    if (item.type === 'offset' && !showOffsets) return false
    return true
  })

  // Shuffle for mixed variant
  const shuffledItems = variant === 'mixed' 
    ? [...items].sort(() => Math.random() - 0.5)
    : items

  const getValue = useCallback((item: ControlItem): number => {
    if (item.type === 'threshold') {
      switch (item.axis) {
        case 'x': return xThreshold
        case 'y': return yThreshold
        case 'z': return zThreshold
      }
    } else {
      switch (item.axis) {
        case 'x': return xOffset
        case 'y': return yOffset
        case 'z': return zOffset
      }
    }
  }, [xThreshold, yThreshold, zThreshold, xOffset, yOffset, zOffset])

  const handleChange = useCallback((item: ControlItem, value: number) => {
    if (item.type === 'threshold') {
      setThreshold(item.axis, value)
    } else {
      setOffset(item.axis, value)
    }
    analytics.trackControlChange(item.id, value)
  }, [setThreshold, setOffset])

  const renderControl = (item: ControlItem) => {
    const value = getValue(item)
    const onChange = (v: number) => handleChange(item, v)

    switch (variant) {
      case 'inputs':
        return <InputControl key={item.id} item={item} value={value} onChange={onChange} />
      case 'sliders':
        return <SliderControlComponent key={item.id} item={item} value={value} onChange={onChange} />
      case 'mixed':
        // Randomly choose between input and slider
        return Math.random() > 0.5 
          ? <SliderControlComponent key={item.id} item={item} value={value} onChange={onChange} />
          : <InputControl key={item.id} item={item} value={value} onChange={onChange} />
      case 'hybrid':
        return <HybridControl key={item.id} item={item} value={value} onChange={onChange} />
      default:
        return <SliderControlComponent key={item.id} item={item} value={value} onChange={onChange} />
    }
  }

  return (
    <div className="space-y-4">
      {shuffledItems.map((item) => (
        <div key={item.id}>
          {renderControl(item)}
          {item.sublabel && (
            <p className="text-xs text-slate-500 mt-1">{item.sublabel}</p>
          )}
        </div>
      ))}
    </div>
  )
}
