import React, { useRef, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { scaleToMm, mmToScale, clampScale, MIN_DISPLAY_MM, MAX_DISPLAY_MM } from '../utils/unitConversion'

interface DragState {
  isDragging: boolean
  activeAxis: 'x' | 'y' | 'z' | null
  startMouse: THREE.Vector2
  startOffsetScale: number
}

/**
 * GizmoDragController - handles arrow-based dragging using GLTF models
 * Uses mouse delta for smooth, continuous movement with proper mm conversion
 */
export function GizmoDragController() {
  const { scene, camera, raycaster, gl } = useThree()
  const { xOffset, yOffset, zOffset, setOffset } = useStore()
  
  const arrowsRef = useRef<{
    arrow_r: THREE.Object3D | null
    arrow_u: THREE.Object3D | null
    arrow_th: THREE.Object3D | null
  }>({ arrow_r: null, arrow_u: null, arrow_th: null })
  
  const dragState = useRef<DragState>({
    isDragging: false,
    activeAxis: null,
    startMouse: new THREE.Vector2(),
    startOffsetScale: 0,
  })
  
  const orbitControlsRef = useRef<any>(null)
  const initializedRef = useRef(false)
  
  // Constants for conversion
  const PIXELS_TO_MM = 2.5 // Sensitivity factor: pixels of mouse movement = mm
  
  // Find OrbitControls
  useEffect(() => {
    const findControls = () => {
      const state = (gl.domElement as any).__r3f?.root?.getState()
      if (state?.orbitControls) {
        orbitControlsRef.current = state.orbitControls
      }
    }
    findControls()
    const interval = setInterval(findControls, 1000)
    return () => clearInterval(interval)
  }, [gl])
  
  // Find arrow objects
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initializedRef.current) return
      
      let arrowR: THREE.Object3D | null = null
      let arrowU: THREE.Object3D | null = null
      let arrowTh: THREE.Object3D | null = null
      
      scene.traverse((obj) => {
        const name = obj.name.toLowerCase()
        if (name.includes('arrow')) {
          if (name.includes('r') && !arrowR) arrowR = obj
          else if ((name.includes('u') || name.includes('y')) && !arrowU) arrowU = obj
          else if ((name.includes('th') || name.includes('z')) && !arrowTh) arrowTh = obj
        }
      })
      
      if (!arrowR) arrowR = scene.getObjectByName('arrow_r') || null
      if (!arrowU) arrowU = (scene.getObjectByName('arrow_u') || scene.getObjectByName('arrow_y')) || null
      if (!arrowTh) arrowTh = (scene.getObjectByName('arrow_th') || scene.getObjectByName('arrow_z')) || null
      
      arrowsRef.current = { arrow_r: arrowR, arrow_u: arrowU, arrow_th: arrowTh }
      
      if (arrowR || arrowU || arrowTh) {
        initializedRef.current = true
        console.log('[Gizmo] Arrows found:', { arrowR: !!arrowR, arrowU: !!arrowU, arrowTh: !!arrowTh })
      }
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [scene])
  
  // Get axis from object
  const getAxisFromObject = useCallback((obj: THREE.Object3D): 'x' | 'y' | 'z' | null => {
    const { arrow_r, arrow_u, arrow_th } = arrowsRef.current
    
    let current: THREE.Object3D | null = obj
    while (current) {
      if (current === arrow_r) return 'x'
      if (current === arrow_u) return 'y'
      if (current === arrow_th) return 'z'
      current = current.parent
    }
    
    const name = obj.name.toLowerCase()
    if (name.includes('arrow_r') || (name.includes('arrow') && name.includes('r'))) return 'x'
    if (name.includes('arrow_u') || (name.includes('arrow') && name.includes('u'))) return 'y'
    if (name.includes('arrow_th') || (name.includes('arrow') && name.includes('th'))) return 'z'
    
    return null
  }, [])
  
  // Get current offset in mm for an axis
  const getOffsetMm = useCallback((axis: 'x' | 'y' | 'z'): number => {
    const scaleValue = axis === 'x' ? xOffset : axis === 'y' ? yOffset : zOffset
    return scaleToMm(scaleValue)
  }, [xOffset, yOffset, zOffset])
  
  // Convert screen delta to axis-aligned world delta in mm
  const screenDeltaToWorldDelta = useCallback((
    mouseDeltaX: number,
    mouseDeltaY: number,
    axis: 'x' | 'y' | 'z'
  ): number => {
    // Get camera vectors
    const cameraDir = new THREE.Vector3()
    camera.getWorldDirection(cameraDir)
    
    // Get camera right and up vectors
    const cameraRight = new THREE.Vector3()
    const cameraUp = new THREE.Vector3()
    cameraRight.crossVectors(cameraDir, camera.up).normalize()
    cameraUp.crossVectors(cameraRight, cameraDir).normalize()
    
    // Calculate screen movement vector in world space
    const screenMovement = new THREE.Vector3()
    screenMovement.addScaledVector(cameraRight, mouseDeltaX * PIXELS_TO_MM)
    screenMovement.addScaledVector(cameraUp, -mouseDeltaY * PIXELS_TO_MM) // Negative because screen Y is inverted
    
    // Project onto the gizmo axis
    const axisVec = new THREE.Vector3()
    switch (axis) {
      case 'x': axisVec.set(1, 0, 0); break
      case 'y': axisVec.set(0, 1, 0); break
      case 'z': axisVec.set(0, 0, 1); break
    }
    
    // Project screen movement onto the axis
    const projectedDelta = screenMovement.dot(axisVec)
    
    return projectedDelta
  }, [camera])
  
  // Global pointer down listener
  useEffect(() => {
    const canvas = gl.domElement
    
    const onPointerDown = (e: PointerEvent) => {
      if (!arrowsRef.current.arrow_r && !arrowsRef.current.arrow_u && !arrowsRef.current.arrow_th) return
      
      const rect = canvas.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      
      raycaster.setFromCamera(mouse, camera)
      
      const meshes: THREE.Mesh[] = []
      const addMeshes = (obj: THREE.Object3D | null) => {
        if (!obj) return
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshes.push(child)
          }
        })
      }
      addMeshes(arrowsRef.current.arrow_r)
      addMeshes(arrowsRef.current.arrow_u)
      addMeshes(arrowsRef.current.arrow_th)
      
      const intersects = raycaster.intersectObjects(meshes, true)
      
      if (intersects.length > 0) {
        const hit = intersects[0]
        const axis = getAxisFromObject(hit.object)
        
        if (axis) {
          if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = false
          }
          
          dragState.current.isDragging = true
          dragState.current.activeAxis = axis
          dragState.current.startMouse.set(e.clientX, e.clientY)
          dragState.current.startOffsetScale = axis === 'x' ? xOffset : axis === 'y' ? yOffset : zOffset
          
          canvas.style.cursor = 'grabbing'
          console.log(`[Gizmo] Drag started: ${axis}, initial mm: ${scaleToMm(dragState.current.startOffsetScale)}`)
        }
      }
    }
    
    canvas.addEventListener('pointerdown', onPointerDown)
    return () => canvas.removeEventListener('pointerdown', onPointerDown)
  }, [gl, camera, raycaster, getAxisFromObject, xOffset, yOffset, zOffset])
  
  // Handle pointer move
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragState.current.isDragging || !dragState.current.activeAxis) return
    
    const axis = dragState.current.activeAxis
    
    // Calculate mouse delta from start
    const mouseDeltaX = e.clientX - dragState.current.startMouse.x
    const mouseDeltaY = e.clientY - dragState.current.startMouse.y
    
    // Convert screen delta to world delta in mm
    const deltaMm = screenDeltaToWorldDelta(mouseDeltaX, mouseDeltaY, axis)
    
    // Get current offset in mm
    const startOffsetMm = scaleToMm(dragState.current.startOffsetScale)
    
    // Calculate new offset in mm
    let newOffsetMm = startOffsetMm + deltaMm
    
    // Clamp to limits (300-2000 mm)
    newOffsetMm = Math.max(MIN_DISPLAY_MM, Math.min(MAX_DISPLAY_MM, newOffsetMm))
    
    // Convert to scale and apply
    const newOffsetScale = mmToScale(newOffsetMm)
    const clampedScale = clampScale(newOffsetScale)
    
    setOffset(axis, clampedScale)
    
    // Debug log
    console.log(`[Gizmo] ${axis}: deltaMm=${deltaMm.toFixed(2)}, newOffsetMm=${newOffsetMm.toFixed(2)}, newScale=${clampedScale.toFixed(4)}`)
  }, [screenDeltaToWorldDelta, setOffset])
  
  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (!dragState.current.isDragging) return
    
    dragState.current.isDragging = false
    dragState.current.activeAxis = null
    
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true
    }
    
    gl.domElement.style.cursor = 'auto'
    
    console.log('[Gizmo] Drag ended')
  }, [gl])
  
  // Global event listeners
  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])
  
  // Update arrow positions based on mm values
  useFrame(() => {
    const { arrow_r, arrow_u, arrow_th } = arrowsRef.current
    if (!arrow_r && !arrow_u && !arrow_th) return
    
    // Convert scale offsets to mm, then to world position
    // Base position is 1.5, then add the mm-converted offset
    const xPos = 1.5 + scaleToMm(xOffset) / 1000 // Convert mm back to world units
    const yPos = 1.5 + scaleToMm(yOffset) / 1000
    const zPos = 1.5 + scaleToMm(zOffset) / 1000
    
    if (arrow_r) arrow_r.position.set(xPos, 0, 0)
    if (arrow_u) arrow_u.position.set(0, yPos, 0)
    if (arrow_th) arrow_th.position.set(0, 0, zPos)
  })
  
  return null
}
