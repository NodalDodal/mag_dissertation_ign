import React, { useEffect, useState, useMemo, Suspense, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

import { Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarDivider, SidebarFooter } from '../components/Sidebar'
import { ControlRenderer } from '../components/ControlRenderer'
import { GizmoControls } from '../components/GizmoControls'
import { ModalSystem } from '../components/ModalSystem'
import { SelectionBox } from '../components/SelectionBox'
import { useStore } from '../store/useStore'
import { getVariantByPage, needsSidebar, getControlDescription, type VariantConfig } from '../utils/variantGenerator'
import { getSidebarPosition } from '../utils/sidebarPosition'
import { analytics } from '../utils/analytics'

// Zone config interface (threshold=0, direction=positive)
interface ZoneConfigUI {
  id: string
  axis: 'x' | 'y' | 'z'
  direction: 'positive' | 'negative'
  threshold: number
  offset: number
  enabled: boolean
}

interface SceneProps {
  xThreshold: number
  yThreshold: number
  zThreshold: number
  offsetPosX: number
  offsetPosY: number
  offsetPosZ: number
  zones?: ZoneConfigUI[]
}

function isVertexSelected(
  x: number, y: number, z: number,
  thresholdX: number, thresholdY: number, thresholdZ: number
): boolean {
  return x > thresholdX && y > thresholdY && z > thresholdZ
}

function applyOffset(
  position: THREE.BufferAttribute,
  index: number,
  originalX: number, originalY: number, originalZ: number,
  offsetX: number, offsetY: number, offsetZ: number
): void {
  position.setXYZ(index, originalX + offsetX, originalY + offsetY, originalZ + offsetZ)
}

// Apply zone-based selection and transformation
// Each zone selects vertices independently based on axis threshold
// Returns combined set of selected vertex indices
function getZoneSelectedVertices(
  originalPositions: THREE.Vector3[],
  zones: ZoneConfigUI[]
): Set<number> {
  const selected = new Set<number>()
  
  for (let i = 0; i < originalPositions.length; i++) {
    const pos = originalPositions[i]
    
    // Check each enabled zone
    for (const zone of zones) {
      if (!zone.enabled) continue
      
      let axisValue: number
      switch (zone.axis) {
        case 'x': axisValue = pos.x; break
        case 'y': axisValue = pos.y; break
        case 'z': axisValue = pos.z; break
      }
      
      let shouldSelect: boolean
      if (zone.direction === 'positive') {
        shouldSelect = axisValue > zone.threshold
      } else {
        shouldSelect = axisValue < zone.threshold
      }
      
      if (shouldSelect) {
        selected.add(i)
        break // Once selected by any zone, no need to check others
      }
    }
  }
  
  return selected
}

// Apply zone transformations to geometry
function applyZoneTransform(
  posAttr: THREE.BufferAttribute,
  originalPositions: THREE.Vector3[],
  selectedVertices: Set<number>,
  zones: ZoneConfigUI[]
): void {
  for (let i = 0; i < posAttr.count; i++) {
    if (!selectedVertices.has(i)) continue
    
    const original = originalPositions[i]
    if (!original) continue
    
    // Find all zones that this vertex belongs to
    // and apply their offsets (can be multiple)
    let offsetX = 0, offsetY = 0, offsetZ = 0
    
    for (const zone of zones) {
      if (!zone.enabled) continue
      
      // Check if still in zone (using original position)
      let axisValue: number
      switch (zone.axis) {
        case 'x': axisValue = original.x; break
        case 'y': axisValue = original.y; break
        case 'z': axisValue = original.z; break
      }
      
      let belongsToZone: boolean
      if (zone.direction === 'positive') {
        belongsToZone = axisValue > zone.threshold
      } else {
        belongsToZone = axisValue < zone.threshold
      }
      
      if (belongsToZone) {
        // Add this zone's offset to cumulative offset
        switch (zone.axis) {
          case 'x': offsetX += zone.offset; break
          case 'y': offsetY += zone.offset; break
          case 'z': offsetZ += zone.offset; break
        }
      }
    }
    
    // Apply cumulative offset
    posAttr.setXYZ(i, original.x + offsetX, original.y + offsetY, original.z + offsetZ)
  }
}

/**
 * GLTF Model with proper texture and geometry handling
 */
function GLTFModel({ 
  xThreshold, yThreshold, zThreshold, 
  offsetPosX, offsetPosY, offsetPosZ,
  zones = []
}: SceneProps) {
  const { scene } = useGLTF('/test3.gltf')
  
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [modelGeometry, setModelGeometry] = useState<THREE.BufferGeometry | null>(null)
  
  // Process scene on load - fix textures and normalize geometry
  useEffect(() => {
    // Fix textures for proper color space
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        // Handle both single material and material arrays
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        
        materials.forEach((mat: THREE.Material) => {
          if (mat && 'map' in mat && (mat as THREE.MeshStandardMaterial).map) {
            const map = (mat as THREE.MeshStandardMaterial).map
            if (map) {
              // Fix texture color space to SRGB
              map.colorSpace = THREE.SRGBColorSpace
              map.needsUpdate = true
            }
          }
          // Mark material for update
          ;(mat as THREE.MeshStandardMaterial).needsUpdate = true
        })
      }
      
      // Normalize geometry
      if (child instanceof THREE.Mesh) {
        child.updateWorldMatrix(true, false)
        const worldMatrix = child.matrixWorld.clone()
        child.geometry.applyMatrix4(worldMatrix)
        child.position.set(0, 0, 0)
        child.rotation.set(0, 0, 0)
        child.scale.set(1, 1, 1)
        child.updateMatrix()
        child.updateMatrixWorld()
      }
    })
  }, [scene])

  // Store original positions and geometry reference
  const originalPositions = useMemo(() => {
    const positions: THREE.Vector3[] = []
    let geometryRef: THREE.BufferGeometry | null = null
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry
        if (!geometryRef) geometryRef = geometry
        
        const posAttr = geometry.attributes.position
        if (posAttr) {
          for (let i = 0; i < posAttr.count; i++) {
            const v = new THREE.Vector3()
            v.fromBufferAttribute(posAttr, i)
            positions.push(v.clone())
          }
        }
      }
    })
    
    if (geometryRef) {
      setModelGeometry(geometryRef)
    }
    
    return positions
  }, [scene])

  // Check if any zones are enabled
  const hasActiveZones = zones.length > 0 && zones.some(z => z.enabled)

  // Apply deformation - now includes zone-based transformation
  useEffect(() => {
    if (originalPositions.length === 0) return

    const selected: number[] = []
    let vertexIndex = 0

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry
        const posAttr = geometry.attributes.position
        
        if (!posAttr) return
        
        // If we have active zones, use zone-based selection and transform
        const enabledZones = zones.filter(z => z.enabled)
        
        if (hasActiveZones) {
          // Reset to original positions first
          for (let i = 0; i < posAttr.count; i++) {
            const orig = originalPositions[vertexIndex + i]
            if (orig) {
              posAttr.setXYZ(i, orig.x, orig.y, orig.z)
            }
          }
          
          // Get zone-selected vertices
          const zoneSelected = getZoneSelectedVertices(originalPositions, enabledZones)
          
          // Apply zone transformations
          applyZoneTransform(posAttr, originalPositions, zoneSelected, enabledZones)
          
          // Add to selected indices for visualization
          zoneSelected.forEach(idx => selected.push(idx))
        } else {
          // Use original threshold-based selection
          for (let i = 0; i < posAttr.count; i++, vertexIndex++) {
            const original = originalPositions[vertexIndex]
            if (!original) continue
            
            if (isVertexSelected(original.x, original.y, original.z, xThreshold, yThreshold, zThreshold)) {
              selected.push(vertexIndex)
              applyOffset(posAttr, i, original.x, original.y, original.z, offsetPosX, offsetPosY, offsetPosZ)
            } else {
              posAttr.setXYZ(i, original.x, original.y, original.z)
            }
          }
        }
        
        posAttr.needsUpdate = true
        geometry.computeVertexNormals()
      }
    })

    setSelectedIndices(selected)
  }, [scene, originalPositions, xThreshold, yThreshold, zThreshold, offsetPosX, offsetPosY, offsetPosZ, zones, hasActiveZones])

  return (
    <group>
      <primitive object={scene} />
      {modelGeometry && selectedIndices.length > 0 && (
        <SelectionBox geometry={modelGeometry} selectedIndices={selectedIndices} />
      )}
      <axesHelper args={[2]} />
    </group>
  )
}

useGLTF.preload('/test3.gltf')

function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#60a5fa" wireframe />
    </mesh>
  )
}

function Scene3D({ xThreshold, yThreshold, zThreshold, offsetPosX, offsetPosY, offsetPosZ, showGizmos, zones }: SceneProps & { showGizmos: boolean }) {
  return (
    <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 50 }} 
        gl={{ antialias: true, alpha: true, outputColorSpace: THREE.SRGBColorSpace }} 
        className="w-full h-full" 
        shadows
      >
        <Environment preset="city" />
        <ambientLight intensity={0.4} color="#ffffff" />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        
        <Suspense fallback={<Loader />}>
          <GLTFModel 
            xThreshold={xThreshold} 
            yThreshold={yThreshold} 
            zThreshold={zThreshold} 
            offsetPosX={offsetPosX} 
            offsetPosY={offsetPosY} 
            offsetPosZ={offsetPosZ}
            zones={zones}
          />
          {showGizmos && <GizmoControls />}
        </Suspense>
        
        <gridHelper args={[10, 10, '#334155', '#1e293b']} position={[0, -2, 0]} />
        <OrbitControls enableDamping dampingFactor={0.05} rotateSpeed={0.5} zoomSpeed={0.5} minDistance={2} maxDistance={20} enablePan={true} panSpeed={0.5} />
      </Canvas>
    </div>
  )
}

// Simple axis offset config - for custom offset controls if needed
interface AxisOffset {
  axis: 'x' | 'y' | 'z'
  offset: number
}

export const ExperimentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showModals] = useState(true)
  const [variant, setVariant] = useState<VariantConfig | null>(null)
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left')
  
  // Zone state - moved to top before conditional returns
  const [zones, setZones] = useState<{id: string, axis: 'x'|'y'|'z', threshold: number, offset: number}[]>([
    {id: 'z1', axis: 'y', threshold: 0, offset: 0}
  ])
  
  const { xOffset, yOffset, zOffset, xThreshold, yThreshold, zThreshold, logFinish } = useStore()

  useEffect(() => {
    setSidebarPosition(getSidebarPosition())
  }, [])

  useEffect(() => {
    if (id) {
      const pageNum = parseInt(id, 10)
      const v = getVariantByPage(pageNum)
      if (v) {
        setVariant(v)
        analytics.trackSessionStart(v.id)
      } else {
        navigate('/')
      }
    }
  }, [id, navigate])

  const handleFinish = () => {
    logFinish()
    analytics.trackFinish()
  }

  // Handle adding new zone
  const addZone = useCallback(() => {
    const newId = `z${Date.now()}`
    setZones(prev => [...prev, {id: newId, axis: 'x', threshold: 0, offset: 0}])
  }, [])

  // Handle zone change - apply immediately
  const updateZone = useCallback((id: string, field: 'axis'|'threshold'|'offset', value: any) => {
    setZones(prev => prev.map(z => z.id === id ? {...z, [field]: value} : z))
  }, [])

  // Handle remove zone
  const removeZone = useCallback((id: string) => {
    setZones(prev => prev.filter(z => z.id !== id))
  }, [])

  // Convert zones to zone config for 3D scene
  const zoneConfigs = zones
    .filter(z => z.offset !== 0)
    .map(z => ({
      id: z.id,
      axis: z.axis,
      direction: 'positive' as const,
      threshold: z.threshold,
      offset: z.offset,
      enabled: true
    }))

  if (!variant) {
    return (
      <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  const hasSidebar = needsSidebar(variant)
  const showGizmos = variant.controlType === 'gizmo' || variant.controlType === 'hybrid'

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden">
      <ModalSystem showModals={showModals} />
      
      <Scene3D 
        xThreshold={0}
        yThreshold={0}
        zThreshold={0}
        offsetPosX={0}
        offsetPosY={0}
        offsetPosZ={0}
        showGizmos={showGizmos}
        zones={zoneConfigs}
      />
      
      {hasSidebar && (
        <Sidebar position={variant.sidebarPosition}>
          <SidebarHeader title="3D Configurator" subtitle={getControlDescription(variant.controlType)} />
          <SidebarContent>
            <SidebarSection title="Selection Zones">
              {zones.map((zone, idx) => (
                <div key={zone.id} className="p-3 bg-slate-700/30 rounded-lg mb-2 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400">Zone {idx + 1}</span>
                    <button onClick={() => removeZone(zone.id)} className="text-red-400 text-xs">✕</button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <select 
                      value={zone.axis}
                      onChange={(e) => updateZone(zone.id, 'axis', e.target.value)}
                      className="bg-slate-800 rounded px-2 py-1 text-xs"
                    >
                      <option value="x">X</option>
                      <option value="y">Y</option>
                      <option value="z">Z</option>
                    </select>
                    
                    <input
                      type="number"
                      step={0.1}
                      placeholder="Threshold"
                      value={zone.threshold}
                      onChange={(e) => updateZone(zone.id, 'threshold', parseFloat(e.target.value) || 0)}
                      className="bg-slate-800 rounded px-2 py-1 text-xs"
                    />
                    
                    <input
                      type="number"
                      step={0.1}
                      placeholder="Offset"
                      value={zone.offset}
                      onChange={(e) => updateZone(zone.id, 'offset', parseFloat(e.target.value) || 0)}
                      className="bg-slate-800 rounded px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addZone}
                className="w-full py-2 bg-blue-500/20 text-blue-400 text-sm rounded-lg border border-blue-500/30"
              >
                + Add Zone
              </button>
            </SidebarSection>
          </SidebarContent>
          <SidebarFooter>
            <p className="text-xs text-slate-500 text-center">Drag to rotate • Scroll to zoom</p>
          </SidebarFooter>
        </Sidebar>
      )}
      
      <button
        onClick={handleFinish}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 z-30"
      >
        Закончить
      </button>
    </div>
  )
}
