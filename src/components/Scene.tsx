import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Suspense, useRef, useEffect, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { UVCorrector } from '../utils/uvCorrector'

interface SceneProps {
  xThreshold: number
  yThreshold: number
  zThreshold: number
  offsetPosX: number
  offsetPosY: number
  offsetPosZ: number
  uvCorrectionStrength: number
  refreshKey: number
}

/**
 * Helper: Check if vertex should be selected based on thresholds
 * Uses local space for stability
 */
function isVertexSelected(
  x: number,
  y: number,
  z: number,
  xThreshold: number,
  yThreshold: number,
  zThreshold: number
): boolean {
  // Use absolute distance from origin along each axis
  return (
    Math.abs(x) >= xThreshold &&
    Math.abs(y) >= yThreshold &&
    Math.abs(z) >= zThreshold
  )
}

/**
 * Helper: Apply offset to position
 */
function applyOffset(
  position: THREE.BufferAttribute,
  index: number,
  origX: number,
  origY: number,
  origZ: number,
  offsetX: number,
  offsetY: number,
  offsetZ: number
): void {
  position.setXYZ(
    index,
    origX + offsetX,
    origY + offsetY,
    origZ + offsetZ
  )
}

/**
 * GLTF Model component with multi-axis vertex manipulation and UV correction
 */
function GLTFModel({
  xThreshold,
  yThreshold,
  zThreshold,
  offsetPosX,
  offsetPosY,
  offsetPosZ,
  uvCorrectionStrength,
  refreshKey
}: SceneProps) {
  const { scene } = useGLTF('/test3.gltf')
  const meshRef = useRef<THREE.Group>(null)
  const uvCorrectorsRef = useRef<Map<THREE.Mesh, UVCorrector>>(new Map())
  
  // Store all original vertex positions
  const originalVertices = useMemo(() => {
    const vertices: THREE.Vector3[] = []
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry
        if (geometry && geometry.attributes.position) {
          const position = geometry.attributes.position as THREE.BufferAttribute
          for (let i = 0; i < position.count; i++) {
            const v = new THREE.Vector3()
            v.fromBufferAttribute(position, i)
            vertices.push(v)
          }
        }
      }
    })
    return vertices
  }, [scene])

  // Clone the scene to avoid modifying the original
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    return clone
  }, [scene])

  // Initialize UV correctors for each mesh
  useEffect(() => {
    if (!clonedScene) return

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const corrector = new UVCorrector(child)
        uvCorrectorsRef.current.set(child, corrector)
      }
    })
  }, [clonedScene])

  // Find modified vertex indices based on thresholds
  const findModifiedVertices = useCallback((
    positions: THREE.BufferAttribute,
    origVertices: THREE.Vector3[]
  ): number[] => {
    const modified: number[] = []
    
    for (let i = 0; i < positions.count && i < origVertices.length; i++) {
      const v = origVertices[i]
      if (isVertexSelected(v.x, v.y, v.z, xThreshold, yThreshold, zThreshold)) {
        modified.push(i)
      }
    }
    
    return modified
  }, [xThreshold, yThreshold, zThreshold])

  useEffect(() => {
    if (!clonedScene || originalVertices.length === 0) return

    // Traverse the cloned scene to modify meshes
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry
        
        if (geometry && geometry.attributes.position) {
          const position = geometry.attributes.position as THREE.BufferAttribute
          
          // Find which vertices should be modified
          const modifiedIndices = findModifiedVertices(position, originalVertices)
          
          // Apply multi-axis vertex modifications
          for (let i = 0; i < position.count && i < originalVertices.length; i++) {
            const original = originalVertices[i]
            
            if (isVertexSelected(original.x, original.y, original.z, xThreshold, yThreshold, zThreshold)) {
              applyOffset(
                position,
                i,
                original.x,
                original.y,
                original.z,
                offsetPosX,
                offsetPosY,
                offsetPosZ
              )
            } else {
              // Keep original position for non-matching vertices
              position.setXYZ(i, original.x, original.y, original.z)
            }
          }
          
          position.needsUpdate = true
          geometry.computeVertexNormals()

          // Apply UV correction if strength > 0
          if (uvCorrectionStrength > 0 && modifiedIndices.length > 0) {
            const corrector = uvCorrectorsRef.current.get(child)
            if (corrector) {
              corrector.correctUVs(modifiedIndices, uvCorrectionStrength)
            }
          }
        }
      }
    })
  }, [
    xThreshold, 
    yThreshold, 
    zThreshold,
    offsetPosX, 
    offsetPosY, 
    offsetPosZ, 
    uvCorrectionStrength, 
    refreshKey, 
    clonedScene, 
    originalVertices, 
    findModifiedVertices
  ])

  return <primitive ref={meshRef} object={clonedScene} />
}

// Preload the model
useGLTF.preload('/test3.gltf')

/**
 * Loading indicator component
 */
function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#60a5fa" wireframe />
    </mesh>
  )
}

/**
 * Main 3D scene component with lighting and camera setup
 */
export const Scene: React.FC<SceneProps> = ({
  xThreshold,
  yThreshold,
  zThreshold,
  offsetPosX,
  offsetPosY,
  offsetPosZ,
  uvCorrectionStrength,
  refreshKey
}) => {
  return (
    <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
        shadows
      >
        {/* Ambient light for overall illumination */}
        <ambientLight intensity={0.4} color="#a5b4fc" />
        
        {/* Main directional light */}
        <directionalLight
          position={[5, 5, 5]}
          intensity={2}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Secondary directional light for fill */}
        <directionalLight
          position={[-3, 3, -3]}
          intensity={0.6}
          color="#7dd3fc"
        />
        
        {/* Point light for accent */}
        <pointLight
          position={[0, 3, 0]}
          intensity={1}
          color="#38bdf8"
          distance={10}
        />
        
        {/* 3D Model with multi-axis vertex manipulation - wrapped in Suspense */}
        <Suspense fallback={<Loader />}>
          <GLTFModel 
            xThreshold={xThreshold}
            yThreshold={yThreshold}
            zThreshold={zThreshold}
            offsetPosX={offsetPosX}
            offsetPosY={offsetPosY}
            offsetPosZ={offsetPosZ}
            uvCorrectionStrength={uvCorrectionStrength}
            refreshKey={refreshKey} 
          />
        </Suspense>
        
        {/* Grid helper */}
        <gridHelper args={[10, 10, '#334155', '#1e293b']} position={[0, -2, 0]} />
        
        {/* Orbit controls for camera manipulation */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.5}
          minDistance={2}
          maxDistance={20}
          enablePan={true}
          panSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}