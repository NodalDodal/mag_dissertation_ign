
import React, { useEffect, useState, useMemo, Suspense, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { useGLTF, Environment, useTexture } from '@react-three/drei'
import * as THREE from 'three'

import { Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarFooter } from '../components/Sidebar'
import { ControlRenderer } from '../components/ControlRenderer'
import { GizmoControls } from '../components/GizmoControls'
import { GizmoDragController } from '../components/GizmoSystem'
import { DimensionLabels } from '../components/DimensionLabels'
import { MaterialDropdown } from '../components/MaterialDropdown'
import { ModalSystem } from '../components/ModalSystem'
import { OrbitControlsWrapper } from '../components/OrbitControlsContext'
import { useStore } from '../store/useStore'
import { VARIANTS, needsSidebar, getControlDescription, type VariantConfig } from '../utils/variantGenerator'
import { analytics } from '../utils/analytics'
import { initializeSceneUVs, correctSceneUVs, resetSceneUVs } from '../utils/uvCorrector'
import { MATERIALS } from '../utils/materialConfig'

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
  isPage4?: boolean
}

function GLTFModel({ zones = [] }: SceneProps) {
  const { scene } = useGLTF('/test5.gltf')
  const sceneRef = useRef(scene)
  sceneRef.current = scene
  
  const [initialized, setInitialized] = useState(false)
  const { uvCorrectionStrength, selectedMaterial } = useStore()
  
  // Load textures for selected material
  const materialConfig = MATERIALS[selectedMaterial] || MATERIALS['dark-wood-stain']
  const texture = useTexture(materialConfig.map)
  
  useEffect(() => {
    scene.traverse((child) => {
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
    if (geometryRef && !initialized) {
      initializeSceneUVs(scene)
      setInitialized(true)
      console.log('[UVCorrector] Initialized')
    }
    return positions
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
          
          if (uvCorrectionStrength > 0 && selected.length > 0) {
            correctSceneUVs(scene, selected, uvCorrectionStrength)
          }
        } else {
          for (let i = 0; i < posAttr.count; i++) {
            const orig = originalPositions[i]
            if (orig) posAttr.setXYZ(i, orig.x, orig.y, orig.z)
          }
          if (initialized) {
            resetSceneUVs(scene)
          }
        }
        
        posAttr.needsUpdate = true
        geometry.computeVertexNormals()
      }
    })
  }, [scene, originalPositions, zones, uvCorrectionStrength, initialized])

  // Apply material texture
  useEffect(() => {
    if (!scene || !texture) return
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial
        mat.map = texture
        mat.map.colorSpace = THREE.SRGBColorSpace
        mat.needsUpdate = true
      }
    })
    console.log('[Material] Applied:', selectedMaterial, materialConfig.map)
  }, [scene, texture, selectedMaterial, materialConfig.map])

  return <primitive object={scene} />
}

useGLTF.preload('/test5.gltf')

function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#60a5fa" wireframe />
    </mesh>
  )
}

function SceneContent({ showGizmos, zones, isPage4 }: SceneProps & { showGizmos: boolean; isPage4?: boolean }) {
  return (
    <OrbitControlsWrapper>
      <Environment preset="city" />
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <Suspense fallback={<Loader />}>
        <GLTFModel zones={zones} />
        {showGizmos && <GizmoControls />}
        {showGizmos && <DimensionLabels />}
        {isPage4 && <MaterialDropdown visible={isPage4} />}
        <GizmoDragController />
      </Suspense>
      <gridHelper args={[10, 10, '#334155', '#1e293b']} position={[0, -2, 0]} />
    </OrbitControlsWrapper>
  )
}

function Scene3D({ showGizmos, zones, isPage4 }: SceneProps & { showGizmos: boolean }) {
  return (
    <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 50 }} 
        gl={{ antialias: true, alpha: true, outputColorSpace: THREE.SRGBColorSpace }} 
        className="w-full h-full" 
        shadows
      >
        <SceneContent showGizmos={showGizmos} zones={zones} isPage4={isPage4} />
      </Canvas>
    </div>
  )
}

const METRIKA_ID = 109414926
const TARGET_Z_OFFSET = 0.84
const TARGET_Y_OFFSET = 1.345
const TARGET_MATERIAL = 'dark-wood-stain'

function trackTaskSuccess(currentZOffset: number) {
  const isCorrect = currentZOffset === TARGET_Z_OFFSET

  if (typeof window !== 'undefined' && typeof window.ym === 'function') {
    window.ym(109414926, 'reachGoal', 'isCorrect', {
      zOffset: currentZOffset,
      targetValue: TARGET_Z_OFFSET,
      isCorrect
    })
  }

  console.log('[Metrika] isCorrect:', {
    zOffset: currentZOffset,
    targetValue: TARGET_Z_OFFSET,
    isCorrect
  })
}

function trackYTaskSuccess(currentYOffset: number) {
  const isCorrect = currentYOffset === TARGET_Y_OFFSET

  if (typeof window !== 'undefined' && typeof window.ym === 'function') {
    window.ym(109414926, 'reachGoal', 'yCorrect', {
      yOffset: currentYOffset,
      targetValue: TARGET_Y_OFFSET,
      isCorrect
    })
  }

  console.log('[Metrika] yCorrect:', {
    yOffset: currentYOffset,
    targetValue: TARGET_Y_OFFSET,
    isCorrect
  })
}

function trackMaterialTaskSuccess(currentMaterial: string) {
  const isCorrect = currentMaterial === TARGET_MATERIAL

  if (typeof window !== 'undefined' && typeof window.ym === 'function') {
    window.ym(109414926, 'reachGoal', 'isMatCorrect', {
      materialValue: currentMaterial,
      targetMaterial: TARGET_MATERIAL,
      isCorrect
    })
  }

  console.log('[Metrika] isMatCorrect:', {
    materialValue: currentMaterial,
    targetMaterial: TARGET_MATERIAL,
    isCorrect
  })
}

export const ExperimentPage: React.FC = () => {
  const navigate = useNavigate()
  const { id: routeId } = useParams()
  const [showModals] = useState(true)
  const [variant, setVariant] = useState<VariantConfig | null>(null)
  
  const { xOffset, yOffset, zOffset, selectedMaterial, logFinish } = useStore()

  useEffect(() => {
    trackYTaskSuccess(yOffset)
  }, [yOffset])

  useEffect(() => {
    trackMaterialTaskSuccess(selectedMaterial)
  }, [selectedMaterial])

  useEffect(() => {
    const currentPage = Number(routeId)
    const allowedPages = [1, 2, 3, 4, 5]

    if (!Number.isFinite(currentPage) || !allowedPages.includes(currentPage)) {
      navigate('/', { replace: true })
      return
    }

    const navEntry = performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined
    const isReload = navEntry?.type === 'reload' || (typeof performance !== 'undefined' && typeof performance.navigation !== 'undefined' && performance.navigation.type === 1)

    if (!isReload) return

    const otherPages = allowedPages.filter((p) => p !== currentPage)
    const nextPage = otherPages[Math.floor(Math.random() * otherPages.length)]
    navigate(`/variant/${nextPage}`, { replace: true })
  }, [])

  useEffect(() => {
    const page = Number(routeId)
    if (!Number.isFinite(page)) return

    const pageVariants = VARIANTS.filter((v) => v.page === page)
    const randomVariant = pageVariants[Math.floor(Math.random() * pageVariants.length)]

    if (randomVariant) {
      setVariant(randomVariant)
      analytics.trackSessionStart(randomVariant.id)
      
      if (typeof window !== 'undefined' && typeof window.ym === 'function') {
        window.ym(METRIKA_ID, 'params', { variant: randomVariant.id })
      }
    } else {
      navigate('/', { replace: true })
    }
  }, [routeId, navigate])

  const handleFinish = () => {
    trackTaskSuccess(zOffset)
    
    console.log('[Finish] yOffset:', yOffset, 'zOffset:', zOffset)
    logFinish()
    analytics.trackFinish()
    console.log(import.meta.env.VITE_YANDEX_METRIKA_ID)
    
    window.location.href = 'https://forms.yandex.ru/cloud/6a3d0d86068ff0b456f022a3'
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
  const isPage4 = variant.id === 'v4'

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden">
      <ModalSystem showModals={showModals} />
      <Scene3D showGizmos={showGizmos} zones={zoneConfigs} isPage4={isPage4} />
      
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
