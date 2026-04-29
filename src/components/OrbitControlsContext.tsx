import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'

interface OrbitControlsContextType {
  setIsDragging: (value: boolean) => void
}

const OrbitControlsContext = createContext<OrbitControlsContextType>({
  setIsDragging: () => {},
})

export function useOrbitControls() {
  return useContext(OrbitControlsContext)
}

/**
 * OrbitControls wrapper that manages enabling/disabling
 * Must be used INSIDE Canvas
 */
function OrbitControlsWrapper({ children }: { children: React.ReactNode }) {
  const controlsRef = useRef<OrbitControlsType>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { gl } = useThree()
  
  // Auto-disable controls when dragging changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !isDragging
    }
  }, [isDragging])
  
  // Cleanup cursor on unmount
  useEffect(() => {
    return () => {
      gl.domElement.style.cursor = 'auto'
    }
  }, [gl])

  return (
    <OrbitControlsContext.Provider value={{ setIsDragging }}>
      {children}
      <OrbitControls 
        ref={controlsRef as any}
        enableDamping 
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
        minDistance={2}
        maxDistance={20}
        enablePan={true}
        panSpeed={0.5}
      />
    </OrbitControlsContext.Provider>
  )
}

export { OrbitControlsWrapper }