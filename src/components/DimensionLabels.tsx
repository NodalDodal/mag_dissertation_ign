import React, { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { scaleToMm } from '../utils/unitConversion'

/**
 * Dimension Labels - floating measurements that move with the MODEL PARTS they relate to
 * zOffset label moves with the part controlled by zOffset (Z axis side)
 * yOffset label moves with the part controlled by yOffset (Y axis side)
 */
export function DimensionLabels() {
  const { zOffset, yOffset } = useStore()
  
  // Convert scale values to mm for display
  const zOffsetMm = useMemo(() => scaleToMm(zOffset), [zOffset])
  const yOffsetMm = useMemo(() => scaleToMm(yOffset), [yOffset])
  
  // yOffset label moves with zOffset - shifted up and further along Y axis
  const zLabelPos = useMemo(() => [0, 1.2, 2.0 + zOffset] as [number, number, number], [zOffset])
  
  // zOffset label moves with yOffset - shifted higher and along Z axis
  const yLabelPos = useMemo(() => [0, 2.0 + yOffset, 1.2] as [number, number, number], [yOffset])
  
  return (
    <group>
      {/* zOffset label (blue) - moves with Z axis part */}
      <Html
        position={zLabelPos}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div className="flex items-center">
          <div className="px-3 py-1 bg-slate-800/90 rounded-lg border border-blue-600 shadow-lg">
            <span className="text-blue-400 font-bold text-lg">{zOffsetMm} мм</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-400"></div>
        </div>
      </Html>
      
      {/* yOffset label (green) - moves with Y axis part */}
      <Html
        position={yLabelPos}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div className="flex flex-col items-center">
          <div className="px-3 py-1 bg-slate-800/90 rounded-lg border border-green-600 shadow-lg">
            <span className="text-green-400 font-bold text-lg">{yOffsetMm} мм</span>
          </div>
          <div className="w-0.5 h-6 bg-slate-400"></div>
        </div>
      </Html>
    </group>
  )
}
