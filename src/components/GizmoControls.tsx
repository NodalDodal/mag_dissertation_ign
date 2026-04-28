import React, { useRef, useState, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { analytics } from '../utils/analytics'

interface GizmoProps {
  axis: 'x' | 'y' | 'z'
  position: [number, number, number]
  onDrag: (axis: 'x' | 'y' | 'z', delta: number) => void
}

/**
 * Single Gizmo Arrow Component
 */
function GizmoArrow({ axis, position, onDrag }: GizmoProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isDragging, setIsDragging] = useState(false)
  const startPos = useRef(new THREE.Vector3())
  const { gl } = useThree()

  // Color based on axis
  const color = axis === 'x' ? '#ef4444' : axis === 'y' ? '#22c55e' : '#3b82f6'

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation()
    setIsDragging(true)
    startPos.current.copy(e.point)
    gl.domElement.style.cursor = 'grabbing'
  }, [gl])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    gl.domElement.style.cursor = 'grab'
  }, [gl])

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging) return
    
    const delta = (e.point.y - startPos.current.y) * 2
    onDrag(axis, delta)
    startPos.current.copy(e.point)
  }, [isDragging, onDrag, axis])

  // Calculate rotation based on axis
  const rotation: [number, number, number] = axis === 'x' 
    ? [0, 0, -Math.PI / 2] 
    : axis === 'y' 
      ? [0, 0, 0] 
      : [Math.PI / 2, 0, 0]

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        rotation={rotation}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <coneGeometry args={[0.1, 0.4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Arrow shaft */}
      <mesh rotation={rotation} position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

/**
 * Gizmo Controls - 3D arrows for X, Y, Z axis manipulation
 */
export const GizmoControls: React.FC = () => {
  const { xOffset, yOffset, zOffset, setOffset } = useStore()

  const handleXDrag = useCallback((_axis: 'x' | 'y' | 'z', delta: number) => {
    const newValue = Math.max(-2, Math.min(2, xOffset + delta))
    setOffset('x', newValue)
    analytics.trackControlChange('gizmo-x', newValue)
  }, [xOffset, setOffset])

  const handleYDrag = useCallback((_axis: 'x' | 'y' | 'z', delta: number) => {
    const newValue = Math.max(-2, Math.min(2, yOffset + delta))
    setOffset('y', newValue)
    analytics.trackControlChange('gizmo-y', newValue)
  }, [yOffset, setOffset])

  const handleZDrag = useCallback((_axis: 'x' | 'y' | 'z', delta: number) => {
    const newValue = Math.max(-2, Math.min(2, zOffset + delta))
    setOffset('z', newValue)
    analytics.trackControlChange('gizmo-z', newValue)
  }, [zOffset, setOffset])

  return (
    <group>
      {/* X Axis Arrow - positioned to the right */}
      <GizmoArrow axis="x" position={[1.5, 0, 0]} onDrag={handleXDrag} />
      
      {/* Y Axis Arrow - positioned at top */}
      <GizmoArrow axis="y" position={[0, 1.5, 0]} onDrag={handleYDrag} />
      
      {/* Z Axis Arrow - positioned in front */}
      <GizmoArrow axis="z" position={[0, 0, 1.5]} onDrag={handleZDrag} />
    </group>
  )
}