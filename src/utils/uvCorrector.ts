import * as THREE from 'three'

/**
 * UV Corrector Utility
 * 
 * Mimics Blender's "Correct Face Attributes" behavior:
 * When vertices are moved, UV coordinates are dynamically corrected to prevent texture stretching.
 * 
 * This is an approximation, not identical to Blender.
 * Works best on simple topology.
 * May produce artifacts on complex meshes.
 * Real solution would require re-unwrapping or triplanar shaders.
 */

interface UVCorrectorData {
  originalPositions: Float32Array
  originalUVs: Float32Array
  boundingSize: THREE.Vector3
}

/**
 * Create UV corrector data for a geometry
 */
export function createUVCorrectorData(geometry: THREE.BufferGeometry): UVCorrectorData | null {
  const posAttr = geometry.attributes.position
  const uvAttr = geometry.attributes.uv
  
  if (!posAttr || !uvAttr) {
    console.warn('UVCorrector: Missing position or UV attribute')
    return null
  }
  
  // Store original positions and UVs
  const originalPositions = new Float32Array(posAttr.array)
  const originalUVs = new Float32Array(uvAttr.array)
  
  // Compute bounding box for normalization
  geometry.computeBoundingBox()
  const boundingSize = new THREE.Vector3()
  geometry.boundingBox?.getSize(boundingSize)
  
  // Prevent near-zero sizes
  boundingSize.x = Math.max(boundingSize.x, 0.001)
  boundingSize.y = Math.max(boundingSize.y, 0.001)
  boundingSize.z = Math.max(boundingSize.z, 0.001)
  
  return { originalPositions, originalUVs, boundingSize }
}

/**
 * Correct UVs for modified vertices
 */
export function correctUVs(
  geometry: THREE.BufferGeometry,
  correctorData: UVCorrectorData,
  modifiedIndices: number[],
  strength: number = 0.5
): void {
  const posAttr = geometry.attributes.position
  const uvAttr = geometry.attributes.uv
  const indexAttr = geometry.index
  
  if (!posAttr || !uvAttr) return
  
  const positions = posAttr.array as Float32Array
  const uvs = uvAttr.array as Float32Array
  const { originalPositions, originalUVs, boundingSize } = correctorData
  
  const factor = strength * 0.1
  const affectedVertices = new Set<number>()
  
  if (indexAttr) {
    const indices = indexAttr.array as Uint16Array
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i]
      const b = indices[i + 1]
      const c = indices[i + 2]
      if (modifiedIndices.includes(a) || modifiedIndices.includes(b) || modifiedIndices.includes(c)) {
        affectedVertices.add(a)
        affectedVertices.add(b)
        affectedVertices.add(c)
      }
    }
  } else {
    modifiedIndices.forEach(idx => affectedVertices.add(idx))
  }
  
  for (const vIndex of affectedVertices) {
    if (vIndex >= posAttr.count) continue
    
    const origX = originalPositions[vIndex * 3]
    const origY = originalPositions[vIndex * 3 + 1]
    const origZ = originalPositions[vIndex * 3 + 2]
    
    const newX = positions[vIndex * 3]
    const newY = positions[vIndex * 3 + 1]
    const newZ = positions[vIndex * 3 + 2]
    
    const deltaX = newX - origX
    const deltaY = newY - origY
    const deltaZ = newZ - origZ
    
    const displacement = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ)
    if (displacement < 0.0001) continue
    
    const origU = originalUVs[vIndex * 2]
    const origV = originalUVs[vIndex * 2 + 1]
    
    const correctedU = origU + (deltaX / boundingSize.x) * factor
    const correctedV = origV + (deltaY / boundingSize.y) * factor
    
    uvs[vIndex * 2] = correctedU
    uvs[vIndex * 2 + 1] = correctedV
  }
  
  uvAttr.needsUpdate = true
}

/**
 * Reset UVs to original values
 */
export function resetUVs(
  geometry: THREE.BufferGeometry,
  correctorData: UVCorrectorData
): void {
  const uvAttr = geometry.attributes.uv
  if (!uvAttr || !correctorData) return
  
  const uvs = uvAttr.array as Float32Array
  const { originalUVs } = correctorData
  
  for (let i = 0; i < originalUVs.length; i++) {
    uvs[i] = originalUVs[i]
  }
  
  uvAttr.needsUpdate = true
}

/**
 * Apply UV correction to all meshes in a scene/object
 */
export function correctSceneUVs(
  sceneObject: THREE.Object3D,
  modifiedIndices: number[],
  strength: number = 0.5
): void {
  sceneObject.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geometry = child.geometry
      const data = child.userData.uvCorrectorData as UVCorrectorData | undefined
      if (data) {
        correctUVs(geometry, data, modifiedIndices, strength)
      }
    }
  })
}

/**
 * Reset all UVs in scene to original values
 */
export function resetSceneUVs(sceneObject: THREE.Object3D): void {
  sceneObject.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geometry = child.geometry
      const data = child.userData.uvCorrectorData as UVCorrectorData | undefined
      if (data) {
        resetUVs(geometry, data)
      }
    }
  })
}

/**
 * Initialize UV corrector data for all meshes in a scene/object
 */
export function initializeSceneUVs(sceneObject: THREE.Object3D): void {
  sceneObject.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      child.updateWorldMatrix(true, false)
      const worldMatrix = child.matrixWorld.clone()
      child.geometry.applyMatrix4(worldMatrix)
      child.position.set(0, 0, 0)
      child.rotation.set(0, 0, 0)
      child.scale.set(1, 1, 1)
      
      const data = createUVCorrectorData(child.geometry)
      if (data) {
        child.userData.uvCorrectorData = data
      }
    }
  })
}