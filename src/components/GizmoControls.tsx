import React, { useRef, useCallback, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { useOrbitControls } from './OrbitControlsContext'

interface GizmoArrowProps {
  axis: 'x' | 'y' | 'z'
  basePosition: [number, number, number]
}

const ARROW_COLORS: Record<string, string> = {
  x: '#ef4444',
  y: '#22c55e',
  z: '#3b82f6',
}

const ARROW_ROTATIONS: Record<string, [number, number, number]> = {
  x: [0, 0, -Math.PI / 2],
  y: [0, 0, 0],
  z: [Math.PI / 2, 0, 0],
}

interface DragState {
  isDragging: boolean
  startPoint: THREE.Vector3
  initialOffset: number
  plane: THREE.Plane
}

/**
 * Single Gizmo Arrow - interactive draggable handle
 */
function GizmoArrow({ axis, basePosition }: GizmoArrowProps) {
  const groupRef = useRef<THREE.Group>(null)
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startPoint: new THREE.Vector3(),
    initialOffset: 0,
    plane: new THREE.Plane(),
  })
  
  const { camera, gl, raycaster } = useThree()
  const { setOffset, xOffset, yOffset, zOffset } = useStore()
  const { setIsDragging } = useOrbitControls()
  
  // Get current offset for this axis
  const getAxisOffset = useCallback(() => {
    switch (axis) {
      case 'x': return xOffset
      case 'y': return yOffset
      case 'z': return zOffset
    }
  }, [axis, xOffset, yOffset, zOffset])
  
  // Visual position based on offset
  const visualPosition: [number, number, number] = [
    basePosition[0] + (axis === 'x' ? getAxisOffset() : 0),
    basePosition[1] + (axis === 'y' ? getAxisOffset() : 0),
    basePosition[2] + (axis === 'z' ? getAxisOffset() : 0),
  ]
  
  // Update mesh position on each frame
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...visualPosition)
    }
  })

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation?.()
    
    // Notify context that dragging started - this will disable OrbitControls
    setIsDragging(true)
    
    dragStateRef.current.isDragging = true
    if (e.point) {
      dragStateRef.current.startPoint.copy(e.point)
    }
    dragStateRef.current.initialOffset = getAxisOffset()
    
    // Create drag plane perpendicular to axis
    const normal = new THREE.Vector3()
    switch (axis) {
      case 'x': normal.set(1, 0, 0); break
      case 'y': normal.set(0, 1, 0); break
      case 'z': normal.set(0, 0, 1); break
    }
    dragStateRef.current.plane.setFromNormalAndCoplanarPoint(normal, e.point || dragStateRef.current.startPoint)
    
    gl.domElement.style.cursor = 'grabbing'
    
    console.log(`[Gizmo] Drag started on ${axis} axis, initial offset: ${dragStateRef.current.initialOffset}`)
  }, [gl, axis, getAxisOffset, setIsDragging])

  const handlePointerUp = useCallback(() => {
    if (dragStateRef.current.isDragging) {
      dragStateRef.current.isDragging = false
      
      // Notify context that dragging ended - this will re-enable OrbitControls
      setIsDragging(false)
      
      gl.domElement.style.cursor = 'grab'
      
      const finalOffset = getAxisOffset()
      console.log(`[Gizmo] Drag ended on ${axis} axis, final offset: ${finalOffset}`)
    }
  }, [gl, axis, getAxisOffset, setIsDragging])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragStateRef.current.isDragging) return
    
    // Calculate mouse position in normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
    
    raycaster.setFromCamera(mouse, camera)
    
    // Find intersection with drag plane
    const intersection = new THREE.Vector3()
    if (raycaster.ray.intersectPlane(dragStateRef.current.plane, intersection)) {
      // Calculate new position along axis
      let newOffset = 0
      
      switch (axis) {
        case 'x':
          newOffset = intersection.x - basePosition[0]
          break
        case 'y':
          newOffset = intersection.y - basePosition[1]
          break
        case 'z':
          newOffset = intersection.z - basePosition[2]
          break
      }
      
      // Clamp to [-2, 2] range
      newOffset = Math.max(-2, Math.min(2, newOffset))
      
      // Apply offset to store
      setOffset(axis, newOffset)
      
      const delta = newOffset - dragStateRef.current.initialOffset
      console.log(`[Gizmo] ${axis} axis: delta=${delta.toFixed(3)}, new offset=${newOffset.toFixed(3)}`)
    }
  }, [gl, camera, raycaster, axis, basePosition, setOffset])

  // Global event listeners
  useEffect(() => {
    const onPointerUp = () => handlePointerUp()
    const onPointerMove = (e: PointerEvent) => handlePointerMove(e)
    
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    
    return () => {
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [handlePointerUp, handlePointerMove])

  return (
    <group ref={groupRef} position={visualPosition}>
      {/* Cone (arrow head) */}
      <mesh
        rotation={ARROW_ROTATIONS[axis]}
        onPointerDown={handlePointerDown}
        onPointerEnter={() => { gl.domElement.style.cursor = 'grab' }}
        onPointerLeave={() => { gl.domElement.style.cursor = 'auto' }}
      >
        <coneGeometry args={[0.08, 0.25, 16]} />
        <meshStandardMaterial color={ARROW_COLORS[axis]} />
      </mesh>
      
      {/* Shaft */}
      <mesh rotation={ARROW_ROTATIONS[axis]} position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.25, 16]} />
        <meshStandardMaterial color={ARROW_COLORS[axis]} />
      </mesh>
      
      {/* Base sphere */}
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={ARROW_COLORS[axis]} />
      </mesh>
    </group>
  )
}

/**
 * Gizmo Controls - Interactive 3D arrows for axis manipulation
 * Controls offsetX, offsetY, offsetZ in Zustand store
 * Vertices with X>0, Y>0, Z>0 will be shifted by these offsets
 */
export const GizmoControls: React.FC = () => {
  // Base positions for gizmo arrows
  const basePositions: Record<string, [number, number, number]> = {
    x: [1.5, 0, 0],
    y: [0, 1.5, 0],
    z: [0, 0, 1.5],
  }

  return (
    <group>
      <GizmoArrow axis="x" basePosition={basePositions.x} />
      <GizmoArrow axis="y" basePosition={basePositions.y} />
      <GizmoArrow axis="z" basePosition={basePositions.z} />
    </group>
  )
}
