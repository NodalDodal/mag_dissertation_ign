import * as THREE from 'three'

// Direction type
export type Direction = 'positive' | 'negative'

// Threshold config interface
export interface ThresholdConfig {
  x: number
  y: number
  z: number
}

// Direction config interface
export interface DirectionConfig {
  x: Direction
  y: Direction
  z: Direction
}

// Offset config interface
export interface OffsetConfig {
  x: number
  y: number
  z: number
}

// Default configs
export const DEFAULT_THRESHOLDS: ThresholdConfig = { x: 0, y: 0, z: 0 }
export const DEFAULT_DIRECTIONS: DirectionConfig = { x: 'positive', y: 'positive', z: 'positive' }
export const DEFAULT_OFFSETS: OffsetConfig = { x: 0, y: 0, z: 0 }

/**
 * Check if vertex is selected based on axis thresholds and directions
 * Uses LOCAL coordinates (original positions)
 */
export function isVertexSelected(
  x: number,
  y: number,
  z: number,
  thresholds: ThresholdConfig,
  directions: DirectionConfig
): boolean {
  const checkX = directions.x === 'positive' ? x > thresholds.x : x < thresholds.x
  const checkY = directions.y === 'positive' ? y > thresholds.y : y < thresholds.y
  const checkZ = directions.z === 'positive' ? z > thresholds.z : z < thresholds.z
  
  return checkX && checkY && checkZ
}

/**
 * Apply offsets to a vertex position
 */
export function applyVertexOffset(
  position: THREE.Vector3,
  offsets: OffsetConfig
): THREE.Vector3 {
  return new THREE.Vector3(
    position.x + offsets.x,
    position.y + offsets.y,
    position.z + offsets.z
  )
}

/**
 * Compute bounding box of selected vertices
 * Returns { min: Vector3, max: Vector3 }
 */
export function computeSelectionBoundingBox(
  positions: THREE.Vector3[],
  indices: number[]
): { min: THREE.Vector3; max: THREE.Vector3 } | null {
  if (indices.length === 0) return null
  
  const min = new THREE.Vector3(Infinity, Infinity, Infinity)
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity)
  
  for (const idx of indices) {
    const pos = positions[idx]
    if (!pos) continue
    
    min.x = Math.min(min.x, pos.x)
    min.y = Math.min(min.y, pos.y)
    min.z = Math.min(min.z, pos.z)
    
    max.x = Math.max(max.x, pos.x)
    max.y = Math.max(max.y, pos.y)
    max.z = Math.max(max.z, pos.z)
  }
  
  return { min, max }
}

/**
 * Get center of bounding box
 */
export function getBoundingBoxCenter(
  bounds: { min: THREE.Vector3; max: THREE.Vector3 }
): THREE.Vector3 {
  return new THREE.Vector3(
    (bounds.min.x + bounds.max.x) / 2,
    (bounds.min.y + bounds.max.y) / 2,
    (bounds.min.z + bounds.max.z) / 2
  )
}

/**
 * Get gizmo positions based on selected vertices bounding box
 */
export function getGizmoPositions(
  bounds: { min: THREE.Vector3; max: THREE.Vector3 }
): { x: THREE.Vector3; y: THREE.Vector3; z: THREE.Vector3 } {
  const center = getBoundingBoxCenter(bounds)
  
  return {
    // X gizmo: right side of bounding box
    x: new THREE.Vector3(bounds.max.x + 0.5, center.y, center.z),
    // Y gizmo: top of bounding box
    y: new THREE.Vector3(center.x, bounds.max.y + 0.5, center.z),
    // Z gizmo: front of bounding box
    z: new THREE.Vector3(center.x, center.y, bounds.max.z + 0.5)
  }
}