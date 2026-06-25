import React, { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { getMaterialKeys, getMaterialName } from '../utils/materialConfig'

interface MaterialDropdownProps {
  visible?: boolean
}

/**
 * MaterialDropdown - shows material selector on hover (400ms delay)
 * Only on page 4 (gizmo-only variant)
 */
export function MaterialDropdown({ visible = true }: MaterialDropdownProps) {
  const { selectedMaterial, setSelectedMaterial } = useStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [isOverDropdown, setIsOverDropdown] = useState(false)
  const [showTimeout, setShowTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [hideTimeout, setHideTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [dropdownPos, setDropdownPos] = useState<[number, number, number]>([0, 2, 0])
  
  const materialKeys = getMaterialKeys()
  
  // Handle pointer enter - show after 400ms
  const handlePointerEnter = (e: any) => {
    if (!visible) return
    e.stopPropagation()
    
    if (e.point) {
      setDropdownPos([e.point.x, e.point.y, e.point.z])
    }
    
    const timeout = setTimeout(() => {
      setShowDropdown(true)
    }, 400)
    setShowTimeout(timeout)
  }
  
  // Handle pointer leave - hide after 800ms (if not over dropdown)
  const handlePointerLeave = () => {
    if (showTimeout) {
      clearTimeout(showTimeout)
      setShowTimeout(null)
    }
    
    if (!isOverDropdown) {
      const timeout = setTimeout(() => {
        setShowDropdown(false)
      }, 800)
      setHideTimeout(timeout)
    }
  }
  
  // Mouse enters dropdown - cancel hide
  const handleDropdownMouseEnter = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      setHideTimeout(null)
    }
    if (showTimeout) {
      clearTimeout(showTimeout)
      setShowTimeout(null)
    }
    setIsOverDropdown(true)
  }
  
  // Mouse leaves dropdown - schedule hide after 800ms
  const handleDropdownMouseLeave = () => {
    setIsOverDropdown(false)
    const timeout = setTimeout(() => {
      setShowDropdown(false)
    }, 800)
    setHideTimeout(timeout)
  }
  
  // Handle material selection
  const handleMaterialChange = (material: string) => {
    setSelectedMaterial(material)
    setShowDropdown(false)
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      setHideTimeout(null)
    }
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (showTimeout) clearTimeout(showTimeout)
      if (hideTimeout) clearTimeout(hideTimeout)
    }
  }, [showTimeout, hideTimeout])
  
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
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          <div className="flex flex-col items-start">
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