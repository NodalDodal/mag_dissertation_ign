import React, { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { getMaterialKeys, getMaterialName } from '../utils/materialConfig'

interface MaterialDropdownProps {
  visible?: boolean
}

/**
 * MaterialDropdown - shows material selector on hover (500ms delay)
 * Appears near model when hovering
 * Only visible on page 4 (gizmo-only variant)
 */
export function MaterialDropdown({ visible = true }: MaterialDropdownProps) {
  const { selectedMaterial, setSelectedMaterial } = useStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [dropdownPos, setDropdownPos] = useState<[number, number, number]>([0, 2, 0])
  
  const materialKeys = getMaterialKeys()
  
  // Handle pointer enter on detection area
  const handlePointerEnter = (e: any) => {
    if (!visible) return
    e.stopPropagation()
    
    if (e.point) {
      setDropdownPos([e.point.x, e.point.y, e.point.z])
    }
    
    const timeout = setTimeout(() => {
      setShowDropdown(true)
    }, 500)
    setHoverTimeout(timeout)
  }
  
  const handlePointerLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    const hideTimeout = setTimeout(() => {
      setShowDropdown(false)
    }, 800)
    setHoverTimeout(hideTimeout)
  }
  
  const handleMaterialChange = (material: string) => {
    setSelectedMaterial(material)
    setShowDropdown(false)
  }
  
  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout)
    }
  }, [hoverTimeout])
  
  if (!visible) return null
  
  return (
    <>
      {/* Invisible detection mesh */}
      <mesh
        position={[0, 0, 0]}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        visible={false}
      >
        <boxGeometry args={[4, 4, 4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Material dropdown */}
      {showDropdown && (
        <Html
          position={[dropdownPos[0] + 1.5, dropdownPos[1] + 1, dropdownPos[2]]}
          center
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
          }}
        >
          <div 
            className="flex flex-col items-start"
            onMouseEnter={() => {
              if (hoverTimeout) {
                clearTimeout(hoverTimeout)
                setHoverTimeout(null)
              }
            }}
            onMouseLeave={() => {
              const timeout = setTimeout(() => {
                setShowDropdown(false)
              }, 800)
              setHoverTimeout(timeout)
            }}
          >
            <div className="px-3 py-2 bg-slate-800/95 rounded-lg border border-amber-600 shadow-xl min-w-36">
              <select
                value={selectedMaterial}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="w-full bg-slate-900/70 rounded-lg px-3 py-2 text-slate-200 
                          border border-transparent focus:border-amber-500/50 
                          cursor-pointer text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {materialKeys.map((key) => (
                  <option key={key} value={key}>
                    {getMaterialName(key)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Html>
      )}
    </>
  )
}
