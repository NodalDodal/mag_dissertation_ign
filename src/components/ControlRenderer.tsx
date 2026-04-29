import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { analytics } from '../utils/analytics'

export type ControlType = 'inputs' | 'sliders' | 'mixed' | 'hybrid'

type ControlStyle = 'input' | 'slider'

interface ControlItem {
  id: string
  label: string
  sublabel?: string
  axis: 'x' | 'y' | 'z'
  type: 'threshold' | 'offset'
  controlStyle: ControlStyle
}

const STORAGE_KEY = 'variant3_layout'
const GT_SYMBOL = String.fromCharCode(62) // ">" character

/**
 * Generate random layout for mixed variant
 */
function generateRandomLayout(): ControlStyle {
  return Math.random() > 0.5 ? 'slider' : 'input'
}

/**
 * Get or create persistent layout for mixed variant
 */
function getMixedLayout(count: number): ControlStyle[] {
  if (typeof window === 'undefined') {
    return Array.from({ length: count }, generateRandomLayout)
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as ControlStyle[]
      if (Array.isArray(parsed) && parsed.length === count) {
        return parsed
      }
    }
  } catch {
    // Invalid stored data
  }
  
  const layout = Array.from({ length: count }, generateRandomLayout)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch {
    // Storage not available
  }
  
  return layout
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
      controlStyle: 'input',
    })
  })
  
  // Offset controls
  ;(['x', 'y', 'z'] as const).forEach((axis) => {
    items.push({
      id: `offset-${axis}`,
      label: `Offset ${axis.toUpperCase()}`,
      sublabel: `Position adjustment (zone)`,
      axis,
      type: 'offset',
      controlStyle: 'input',
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
  const min = -2
  const max = 2
  const step = 0.01

  const accentColor = item.axis === 'x' ? 'accent-blue-500' : item.axis === 'y' ? 'accent-green-500' : 'accent-purple-500'
  const valueColor = item.axis === 'x' ? 'text-blue-400' : item.axis === 'y' ? 'text-green-400' : 'text-purple-400'

  return (
    <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg border border-white/10">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 tracking-wide">{item.label}</label>
        <span className="text-xs text-slate-400">{item.axis.toUpperCase()}{GT_SYMBOL}0</span>
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

  useEffect(() => {
    setLocalValue(String(value))
  }, [value])

  const min = -2
  const max = 2

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

  // Generate control items
  const allItems = getControlItems().filter(item => {
    if (item.type === 'threshold' && !showThresholds) return false
    if (item.type === 'offset' && !showOffsets) return false
    return true
  })

  // Generate mixed layout ONCE using useMemo with empty deps
  const mixedLayout = useMemo<ControlStyle[] | null>(() => {
    if (variant !== 'mixed') return null
    return getMixedLayout(allItems.length)
  }, [variant, allItems.length])

  // Apply layout to items only once for mixed variant
  const items = useMemo<ControlItem[]>(() => {
    if (variant !== 'mixed' || !mixedLayout) return allItems
    
    // Apply saved layout to items
    return allItems.map((item, index) => ({
      ...item,
      controlStyle: mixedLayout[index] as ControlStyle
    }))
  }, [variant, allItems, mixedLayout])

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

    // For mixed variant, use item's controlStyle
    if (variant === 'mixed') {
      if (item.controlStyle === 'slider') {
        return <SliderControlComponent key={item.id} item={item} value={value} onChange={onChange} />
      } else {
        return <InputControl key={item.id} item={item} value={value} onChange={onChange} />
      }
    }

    // For other variants, use variant type
    switch (variant) {
      case 'inputs':
        return <InputControl key={item.id} item={item} value={value} onChange={onChange} />
      case 'sliders':
        return <SliderControlComponent key={item.id} item={item} value={value} onChange={onChange} />
      case 'hybrid':
        return <HybridControl key={item.id} item={item} value={value} onChange={onChange} />
      default:
        return <SliderControlComponent key={item.id} item={item} value={value} onChange={onChange} />
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
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
