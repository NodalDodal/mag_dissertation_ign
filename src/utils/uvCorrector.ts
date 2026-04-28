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
export class UVCorrector {
  private mesh: THREE.Mesh
  private geometry: THREE.BufferGeometry
  private originalPositions: Float32Array | null = null
  private originalUVs: Float32Array | null = null
  private boundingBox: THREE.Box3 | null = null
  private boundingSize: THREE.Vector3 | null = null

  constructor(mesh: THREE.Mesh) {
    this.mesh = mesh
    this.geometry = mesh.geometry as THREE.BufferGeometry
    
    this.initializeOriginalState()
  }

  /**
   * Initialize and store original position and UV attributes
   */
  private initializeOriginalState(): void {
    const positionAttribute = this.geometry.attributes.position
    const uvAttribute = this.geometry.attributes.uv

    if (positionAttribute) {
      this.originalPositions = new Float32Array(positionAttribute.array)
    }

    if (uvAttribute) {
      this.originalUVs = new Float32Array(uvAttribute.array)
    }

    // Compute bounding box for normalization
    this.geometry.computeBoundingBox()
    this.boundingBox = this.geometry.boundingBox
    
    if (this.boundingBox) {
      this.boundingSize = new THREE.Vector3()
      this.boundingBox.getSize(this.boundingSize)
    }

    // Store in userData for reference
    this.mesh.userData.originalPositions = this.originalPositions
    this.mesh.userData.originalUVs = this.originalUVs
    this.mesh.userData.boundingSize = this.boundingSize
  }

  /**
   * Get the bounding box size for normalization
   */
  private getBoundingSize(): THREE.Vector3 {
    if (this.boundingSize) {
      return this.boundingSize
    }

    // Fallback: compute if not available
    this.geometry.computeBoundingBox()
    const size = new THREE.Vector3()
    this.geometry.boundingBox?.getSize(size)
    return size
  }

  /**
   * Correct UVs for modified vertices
   * 
   * @param modifiedIndices - Array of vertex indices that were modified
   * @param strength - UV correction strength (0-1)
   */
  correctUVs(modifiedIndices: number[], strength: number = 0.5): void {
    const positionAttribute = this.geometry.attributes.position
    const uvAttribute = this.geometry.attributes.uv

    if (!positionAttribute || !uvAttribute || !this.originalPositions || !this.originalUVs) {
      console.warn('UVCorrector: Missing position or UV attribute')
      return
    }

    const positions = positionAttribute.array as Float32Array
    const uvs = uvAttribute.array as Float32Array
    const boundingSize = this.getBoundingSize()

    // Prevent division by zero
    const sizeX = Math.max(boundingSize.x, 0.001)
    const sizeY = Math.max(boundingSize.y, 0.001)

    // Normalized UV correction using bounding box
    const factor = strength * 0.1

    // Process each modified vertex
    for (let i = 0; i < modifiedIndices.length; i++) {
      const index = modifiedIndices[i]
      if (index >= positionAttribute.count) continue

      // Get original position
      const origX = this.originalPositions[index * 3]
      const origY = this.originalPositions[index * 3 + 1]
      const origZ = this.originalPositions[index * 3 + 2]

      // Get new position
      const newX = positions[index * 3]
      const newY = positions[index * 3 + 1]
      const newZ = positions[index * 3 + 2]

      // Compute delta
      const deltaX = newX - origX
      const deltaY = newY - origY
      const deltaZ = newZ - origZ

      // Get original UV
      const origU = this.originalUVs[index * 2]
      const origV = this.originalUVs[index * 2 + 1]

      let correctedU = origU
      let correctedV = origV

      // Check if there's meaningful displacement
      if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001 || Math.abs(deltaZ) > 0.001) {
        // Normalize displacement by mesh size and apply factor
        correctedU = origU + (deltaX / sizeX) * factor
        correctedV = origV + (deltaY / sizeY) * factor
      }

      // Update UV
      uvs[index * 2] = correctedU
      uvs[index * 2 + 1] = correctedV
    }

    // Handle face consistency: update all vertices of affected triangles
    const indexAttribute = this.geometry.index
    if (indexAttribute) {
      this.correctFaceUVs(modifiedIndices, strength)
    }

    // Mark UV attribute for update
    uvAttribute.needsUpdate = true
  }

  /**
   * Correct UVs for all vertices of affected faces
   * This ensures no artifacts at face boundaries
   */
  private correctFaceUVs(modifiedIndices: number[], strength: number): void {
    const indexAttribute = this.geometry.index
    const uvAttribute = this.geometry.attributes.uv
    const positionAttribute = this.geometry.attributes.position

    if (!indexAttribute || !uvAttribute) return

    const indices = indexAttribute.array as Uint16Array
    const uvs = uvAttribute.array as Float32Array
    const boundingSize = this.getBoundingSize()
    const factor = strength * 0.1

    // Build a set of affected vertices
    const affectedVertices = new Set(modifiedIndices)

    // Find all vertices in triangles that contain modified vertices
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i]
      const b = indices[i + 1]
      const c = indices[i + 2]

      // If any vertex in triangle is affected, update all three
      if (affectedVertices.has(a) || affectedVertices.has(b) || affectedVertices.has(c)) {
        const faceVertices = [a, b, c]
        
        for (let j = 0; j < faceVertices.length; j++) {
          const vIndex = faceVertices[j]
          if (!positionAttribute || vIndex >= positionAttribute.count) continue

          // Get positions using original positions stored
          const origX = this.originalPositions?.[vIndex * 3] || 0
          const origY = this.originalPositions?.[vIndex * 3 + 1] || 0

          const newX = (this.geometry.attributes.position.array as Float32Array)[vIndex * 3] || 0
          const newY = (this.geometry.attributes.position.array as Float32Array)[vIndex * 3 + 1] || 0

          const deltaX = newX - origX
          const deltaY = newY - origY

          const origU = this.originalUVs?.[vIndex * 2] || 0
          const origV = this.originalUVs?.[vIndex * 2 + 1] || 0

          // Apply UV correction
          let correctedU = origU
          let correctedV = origV

          if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001) {
            correctedU = origU + (deltaX / boundingSize.x) * factor
            correctedV = origV + (deltaY / boundingSize.y) * factor
          }

          uvs[vIndex * 2] = correctedU
          uvs[vIndex * 2 + 1] = correctedV
        }
      }
    }
  }

  /**
   * Reset UVs to original values
   */
  resetUVs(): void {
    const uvAttribute = this.geometry.attributes.uv

    if (!uvAttribute || !this.originalUVs) return

    const uvs = uvAttribute.array as Float32Array

    // Copy original UVs back
    for (let i = 0; i < this.originalUVs.length; i++) {
      uvs[i] = this.originalUVs[i]
    }

    uvAttribute.needsUpdate = true
  }

  /**
   * Get original data for debugging
   */
  getOriginalData(): {
    originalPositions: Float32Array | null
    originalUVs: Float32Array | null
    boundingSize: THREE.Vector3 | null
  } {
    return {
      originalPositions: this.originalPositions,
      originalUVs: this.originalUVs,
      boundingSize: this.boundingSize
    }
  }
}

/**
 * Convenience function to correct UVs for a mesh
 */
export function correctUVs(
  mesh: THREE.Mesh,
  modifiedIndices: number[],
  strength: number = 0.5
): void {
  const corrector = new UVCorrector(mesh)
  corrector.correctUVs(modifiedIndices, strength)
}

/**
 * Reset UVs to original values
 */
export function resetUVs(mesh: THREE.Mesh): void {
  const corrector = new UVCorrector(mesh)
  corrector.resetUVs()
}