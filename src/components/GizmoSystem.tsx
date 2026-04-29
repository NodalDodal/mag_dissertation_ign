import React, { useRef, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

interface DragState {
  isDragging: boolean
  activeAxis: 'x' | 'y' | 'z' | null
  activeObject: THREE.Object3D | null
  dragPlane: THREE.Plane
  prevPoint: THREE.Vector3
}

/**
 * GizmoDragController - handles arrow-based dragging using GLTF models
 * Uses incremental delta for smooth, continuous movement
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
    activeObject: null,
    dragPlane: new THREE.Plane(),
    prevPoint: new THREE.Vector3(),
  })
  
  const orbitControlsRef = useRef<any>(null)
  const initializedRef = useRef(false)
  
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
          
          const { arrow_r, arrow_u, arrow_th } = arrowsRef.current
          dragState.current.activeObject = axis === 'x' ? arrow_r : axis === 'y' ? arrow_u : arrow_th
          
          const normal = new THREE.Vector3()
          switch (axis) {
            case 'x': normal.set(1, 0, 0); break
            case 'y': normal.set(0, 1, 0); break
            case 'z': normal.set(0, 0, 1); break
          }
          dragState.current.dragPlane.setFromNormalAndCoplanarPoint(normal, hit.point)
          dragState.current.prevPoint.copy(hit.point)
          
          canvas.style.cursor = 'grabbing'
          console.log(`[Gizmo] Drag started: ${axis}`)
        }
      }
    }
    
    canvas.addEventListener('pointerdown', onPointerDown)
    return () => canvas.removeEventListener('pointerdown', onPointerDown)
  }, [gl, camera, raycaster, getAxisFromObject])
  
  // Handle pointer move
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragState.current.isDragging) return
    
    const canvas = gl.domElement
    const rect = canvas.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
    
    raycaster.setFromCamera(mouse, camera)
    
    const currentPoint = new THREE.Vector3()
    if (!raycaster.ray.intersectPlane(dragState.current.dragPlane, currentPoint)) return
    
    const deltaVec = new THREE.Vector3().subVectors(currentPoint, dragState.current.prevPoint)
    
    const axis = dragState.current.activeAxis
    let delta = 0
    switch (axis) {
      case 'x': delta = deltaVec.x; break
      case 'y': delta = deltaVec.y; break
      case 'z': delta = deltaVec.z; break
    }
    
    if (axis) {
      const currentOffset = axis === 'x' ? xOffset : axis === 'y' ? yOffset : zOffset
      const newOffset = Math.max(-2, Math.min(2, currentOffset + delta))
      setOffset(axis, newOffset)
      
      console.log(`[Gizmo] ${axis}: delta=${delta.toFixed(4)}, newOffset=${newOffset.toFixed(4)}`)
    }
    
    dragState.current.prevPoint.copy(currentPoint)
  }, [gl, camera, raycaster, xOffset, yOffset, zOffset, setOffset])
  
  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (!dragState.current.isDragging) return
    
    dragState.current.isDragging = false
    dragState.current.activeAxis = null
    dragState.current.activeObject = null
    
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
  
  // Update arrow positions
  useFrame(() => {
    const { arrow_r, arrow_u, arrow_th } = arrowsRef.current
    if (!arrow_r && !arrow_u && !arrow_th) return
    
    if (arrow_r) arrow_r.position.set(1.5 + xOffset, 0, 0)
    if (arrow_u) arrow_u.position.set(0, 1.5 + yOffset, 0)
    if (arrow_th) arrow_th.position.set(0, 0, 1.5 + zOffset)
  })
  
  return null
}