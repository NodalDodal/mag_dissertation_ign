import React, { useEffect, useState, useMemo, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

import { Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarFooter } from '../components/Sidebar'
import { ControlRenderer } from '../components/ControlRenderer'
import { GizmoControls } from '../components/GizmoControls'
import { GizmoDragController } from '../components/GizmoSystem'
import { ModalSystem } from '../components/ModalSystem'
import { SelectionBox } from '../components/SelectionBox'
import { OrbitControlsWrapper } from '../components/OrbitControlsContext'
import { useStore } from '../store/useStore'
import { getVariantByPage, needsSidebar, getControlDescription, type VariantConfig } from '../utils/variantGenerator'
import { getSidebarPosition } from '../utils/sidebarPosition'
import { analytics } from '../utils/analytics'
import { initializeSceneUVs, correctSceneUVs, resetSceneUVs } from '../utils/uvCorrector'

// Zone config interface
interface ZoneConfigUI {
  id: string
  axis: 'x' | 'y' | 'z'
  direction: 'positive' | 'negative'
  threshold: number
  offset: number
  enabled: boolean
}

const DEFAULT_ZONES: ZoneConfigUI[] = [
  { id: 'z_x', axis: 'x', direction: 'positive', threshold: 0, offset: 0, enabled: true },
  { id: 'z_y', axis: 'y', direction: 'positive', threshold: 0, offset: 0, enabled: true },
  { id: 'z_z', axis: 'z', direction: 'positive', threshold: 0, offset: 0, enabled: true },
]

interface SceneProps {
  zones?: ZoneConfigUI[]
}

function GLTFModel({ zones = [] }: SceneProps) {
  const { scene } = useGLTF('/test3.gltf')
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [modelGeometry, setModelGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [initialized, setInitialized] = useState(false)
  
  const { uvCorrectionStrength } = useStore()
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat: THREE.Material) => {
          if (mat && 'map' in mat && (mat as THREE.MeshStandardMaterial).map) {
            const map = (mat as THREE.MeshStandardMaterial).map
            if (map) {
              map.colorSpace = THREE.SRGBColorSpace
              map.needsUpdate = true
            }
          }
          ;(mat as THREE.MeshStandardMaterial).needsUpdate = true
        })
      }
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
    if (geometryRef) setModelGeometry(geometryRef)
    return positions
  }, [scene])

  // Initialize UV corrector data once when scene loads
  useEffect(() => {
    if (!initialized && scene) {
      initializeSceneUVs(scene)
      setInitialized(true)
      console.log('[UVCorrector] Initialized')
    }
  }, [scene, initialized])

  useEffect(() => {
    if (originalPositions.length === 0) return

    const selected: number[] = []

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry
        const posAttr = geometry.attributes.position
        if (!posAttr) return
        
        const enabledZones = zones.filter(z => z.enabled)
        const hasActiveZones = enabledZones.length > 0 && enabledZones.some(z => z.offset !== 0)
        
        if (hasActiveZones) {
          for (let i = 0; i < posAttr.count; i++) {
            const orig = originalPositions[i]
            if (orig) posAttr.setXYZ(i, orig.x, orig.y, orig.z)
          }
          
          const selectedSet = new Set<number>()
          for (let i = 0; i < originalPositions.length; i++) {
            const pos = originalPositions[i]
            for (const zone of enabledZones) {
              if (zone.offset === 0) continue
              let axisValue: number
              switch (zone.axis) {
                case 'x': axisValue = pos.x; break
                case 'y': axisValue = pos.y; break
                case 'z': axisValue = pos.z; break
              }
              const shouldSelect = zone.direction === 'positive' ? axisValue > zone.threshold : axisValue < zone.threshold
              if (shouldSelect) { selectedSet.add(i); break }
            }
          }
          
          for (const idx of selectedSet) {
            const orig = originalPositions[idx]
            if (!orig) continue
            let offsetX = 0, offsetY = 0, offsetZ = 0
            for (const zone of enabledZones) {
              if (zone.offset === 0) continue
              let axisValue: number
              switch (zone.axis) {
                case 'x': axisValue = orig.x; break
                case 'y': axisValue = orig.y; break
                case 'z': axisValue = orig.z; break
              }
              const belongsToZone = zone.direction === 'positive' ? axisValue > zone.threshold : axisValue < zone.threshold
              if (belongsToZone) {
                switch (zone.axis) {
                  case 'x': offsetX += zone.offset; break
                  case 'y': offsetY += zone.offset; break
                  case 'z': offsetZ += zone.offset; break
                }
              }
            }
            posAttr.setXYZ(idx, orig.x + offsetX, orig.y + offsetY, orig.z + offsetZ)
            selected.push(idx)
          }
          
          // Apply UV correction if enabled
          if (uvCorrectionStrength > 0 && selected.length > 0) {
            correctSceneUVs(scene, selected, uvCorrectionStrength)
          }
        } else {
          for (let i = 0; i < posAttr.count; i++) {
            const orig = originalPositions[i]
            if (orig) posAttr.setXYZ(i, orig.x, orig.y, orig.z)
          }
          // Reset UVs when no offsets
          if (initialized) {
            resetSceneUVs(scene)
          }
        }
        
        posAttr.needsUpdate = true
        geometry.computeVertexNormals()
      }
    })

    setSelectedIndices(selected)
  }, [scene, originalPositions, zones, uvCorrectionStrength, initialized])

  return (
    <group>
      <primitive object={scene} />
      {modelGeometry && selectedIndices.length > 0 && <SelectionBox geometry={modelGeometry} selectedIndices={selectedIndices} />}
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

function SceneContent({ showGizmos, zones }: SceneProps & { showGizmos: boolean }) {
  return (
    <OrbitControlsWrapper>
      <Environment preset="city" />
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <Suspense fallback={<Loader />}>
        <GLTFModel zones={zones} />
        {showGizmos && <GizmoControls />}
        <GizmoDragController />
      </Suspense>
      <gridHelper args={[10, 10, '#334155', '#1e293b']} position={[0, -2, 0]} />
    </OrbitControlsWrapper>
  )
}

function Scene3D({ showGizmos, zones }: SceneProps & { showGizmos: boolean }) {
  return (
    <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 50 }} 
        gl={{ antialias: true, alpha: true, outputColorSpace: THREE.SRGBColorSpace }} 
        className="w-full h-full" 
        shadows
      >
        <SceneContent showGizmos={showGizmos} zones={zones} />
      </Canvas>
    </div>
  )
}

export const ExperimentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showModals] = useState(true)
  const [variant, setVariant] = useState<VariantConfig | null>(null)
  
  const { xOffset, yOffset, zOffset, logFinish } = useStore()

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

  const zoneConfigs: ZoneConfigUI[] = DEFAULT_ZONES.map(zone => {
    let offset = 0
    switch (zone.axis) {
      case 'x': offset = xOffset; break
      case 'y': offset = yOffset; break
      case 'z': offset = zOffset; break
    }
    return { ...zone, offset, enabled: offset !== 0 }
  })

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
      <Scene3D showGizmos={showGizmos} zones={zoneConfigs} />
      
      {hasSidebar && (
        <Sidebar position={variant.sidebarPosition}>
          <SidebarHeader title="3D Configurator" subtitle={getControlDescription(variant.controlType)} />
          <SidebarContent>
            <SidebarSection title="Zone Selection">
              <p className="text-xs text-slate-500 mb-4">Vertices with coordinates X 0, Y 0, Z 0 will be shifted</p>
              <ControlRenderer 
                variant={variant.controlType === 'gizmo' ? 'sliders' : variant.controlType} 
                showThresholds={false}
                showOffsets={true}
              />
            </SidebarSection>
          </SidebarContent>
          <SidebarFooter>
            <p className="text-xs text-slate-500 text-center">Drag to rotate - Scroll to zoom</p>
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