import { useRef, useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface ModelProps {
  heightOffset: number
  refreshKey: number
}

// Hardcoded vertex indices for manipulation
const EDITABLE_VERTICES = [0, 1, 2, 3, 4, 5, 10, 15, 20, 25, 30]

/**
 * GLTF Model component with vertex manipulation support
 */
function GLTFModel({ heightOffset, refreshKey }: ModelProps) {
  const { scene } = useGLTF('/test3.gltf')
  const meshRef = useRef<THREE.Group>(null)
  
  // Store original vertex positions
  const originalPositions = useMemo(() => new Map<number, THREE.Vector3>(), [])
  
  // Clone the scene to avoid modifying the original
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    if (!clonedScene) return

    // Traverse the scene to find meshes
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry
        
        if (geometry && geometry.attributes.position) {
          const position = geometry.attributes.position as THREE.BufferAttribute
          
          // Store original positions if not already stored
          if (originalPositions.size === 0) {
            EDITABLE_VERTICES.forEach(index => {
              if (index < position.count) {
                const original = new THREE.Vector3()
                original.fromBufferAttribute(position, index)
                originalPositions.set(index, original)
              }
            })
          }
          
          // Apply vertex modifications based on heightOffset
          EDITABLE_VERTICES.forEach(index => {
            if (index < position.count) {
              const original = originalPositions.get(index)
              if (original) {
                position.setY(index, original.y + heightOffset)
              }
            }
          })
          
          position.needsUpdate = true
          geometry.computeVertexNormals()
        }
      }
    })
  }, [heightOffset, refreshKey, clonedScene, originalPositions])

  return <primitive ref={meshRef} object={clonedScene} />
}

// Preload the model
useGLTF.preload('/test3.gltf')

/**
 * Fallback component that renders a simple geometry when model loading fails
 */
function FallbackModel({ heightOffset }: { heightOffset: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const originalPositions = useMemo(() => {
    if (!meshRef.current) return new Map<number, THREE.Vector3>()
    const geometry = meshRef.current.geometry
    const positions = geometry.attributes.position
    const map = new Map<number, THREE.Vector3>()
    
    EDITABLE_VERTICES.forEach(index => {
      if (index < positions.count) {
        const original = new THREE.Vector3()
        original.fromBufferAttribute(positions, index)
        map.set(index, original)
      }
    })
    return map
  }, [])

  useEffect(() => {
    if (!meshRef.current) return
    const geometry = meshRef.current.geometry
    const position = geometry.attributes.position

    EDITABLE_VERTICES.forEach(index => {
      if (index < position.count) {
        const original = originalPositions.get(index)
        if (original) {
          position.setY(index, original.y + heightOffset)
        }
      }
    })

    position.needsUpdate = true
    geometry.computeVertexNormals()
  }, [heightOffset, originalPositions])

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#60a5fa" metalness={0.3} roughness={0.4} />
    </mesh>
  )
}

/**
 * Main Model component that exports either GLTF model or fallback
 * The actual model loading is handled by useGLTF which should be used within Suspense
 */
export const Model = GLTFModel
export { FallbackModel }
