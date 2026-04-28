import * as THREE from 'three'

/**
 * Axis direction for vertex selection
 */
export type AxisDirection = 'x+' | 'x-' | 'y+' | 'y-' | 'z+' | 'z-'

/**
 * VertexSelector - Axis-based vertex selection for Three.js mesh editing
 * 
 * Selects vertices based on their position relative to axes (X, Y, Z).
 * Supports accumulative selection (set union) across multiple selections.
 */
export class VertexSelector {
  private geometry: THREE.BufferGeometry
  private selectedVertices: Set<number> = new Set()
  private positionAttribute: THREE.BufferAttribute | null = null

  constructor(geometry: THREE.BufferGeometry) {
    this.geometry = geometry
    this.positionAttribute = geometry.attributes.position as THREE.BufferAttribute | null
    
    if (!this.positionAttribute) {
      console.warn('VertexSelector: Geometry has no position attribute')
    }
  }

  /**
   * Select vertices along an axis direction
   * Uses accumulative selection (adds to existing selection)
   * 
   * @param direction - Axis direction: 'x+', 'x-', 'y+', 'y-', 'z+', 'z-'
   *                   x+ selects vertices where position.x > 0
   *                   x- selects vertices where position.x < 0
   */
  selectAxis(direction: AxisDirection): void {
    if (!this.positionAttribute) {
      console.warn('VertexSelector: No position attribute available')
      return
    }

    const positions = this.positionAttribute.array as Float32Array
    const vertexCount = this.positionAttribute.count

    // Determine which axis and comparison operator to use
    let axisIndex: number
    let isPositive: boolean

    switch (direction) {
      case 'x+':
        axisIndex = 0
        isPositive = true
        break
      case 'x-':
        axisIndex = 0
        isPositive = false
        break
      case 'y+':
        axisIndex = 1
        isPositive = true
        break
      case 'y-':
        axisIndex = 1
        isPositive = false
        break
      case 'z+':
        axisIndex = 2
        isPositive = true
        break
      case 'z-':
        axisIndex = 2
        isPositive = false
        break
      default:
        console.warn('VertexSelector: Invalid direction')
        return
    }

    // Iterate through all vertices and add matching indices to selection
    for (let i = 0; i < vertexCount; i++) {
      const vertexPosition = positions[i * 3 + axisIndex]
      
      // Select based on direction
      // x+ or y+ or z+ → select if position > 0
      // x- or y- or z- → select if position < 0
      const shouldSelect = isPositive 
        ? vertexPosition > 0 
        : vertexPosition < 0

      if (shouldSelect) {
        this.selectedVertices.add(i)  // Accumulate (set union)
      }
    }
  }

  /**
   * Clear the current selection
   */
  clearSelection(): void {
    this.selectedVertices.clear()
  }

  /**
   * Get the current selection as a Set of vertex indices
   * @returns Set<number> containing selected vertex indices
   */
  getSelection(): Set<number> {
    return new Set(this.selectedVertices)
  }

  /**
   * Get selection count (for UI display)
   */
  getSelectionCount(): number {
    return this.selectedVertices.size
  }

  /**
   * Check if a vertex is selected
   */
  isSelected(index: number): boolean {
    return this.selectedVertices.has(index)
  }

  /**
   * Apply transformation to selected vertices
   * @param transform - Function that takes position [x, y, z] and returns transformed position
   */
  applyTransformation(transform: (pos: [number, number, number]) => [number, number, number]): void {
    if (!this.positionAttribute) {
      console.warn('VertexSelector: No position attribute available')
      return
    }

    const positions = this.positionAttribute.array as Float32Array
    
    // Apply transformation to each selected vertex
    for (const vertexIndex of this.selectedVertices) {
      const x = positions[vertexIndex * 3]
      const y = positions[vertexIndex * 3 + 1]
      const z = positions[vertexIndex * 3 + 2]

      const [newX, newY, newZ] = transform([x, y, z])

      positions[vertexIndex * 3] = newX
      positions[vertexIndex * 3 + 1] = newY
      positions[vertexIndex * 3 + 2] = newZ
    }

    // Mark attribute for update
    this.positionAttribute.needsUpdate = true
    this.geometry.computeBoundingSphere()
  }

  /**
   * Translate selected vertices by delta
   * @param delta - Translation vector [x, y, z]
   */
  translate(delta: [number, number, number]): void {
    this.applyTransformation(([x, y, z]) => [
      x + delta[0],
      y + delta[1],
      z + delta[2]
    ])
  }

  /**
   * Update geometry reference (if geometry changes)
   */
  updateGeometry(geometry: THREE.BufferGeometry): void {
    this.geometry = geometry
    this.positionAttribute = geometry.attributes.position as THREE.BufferAttribute | null
  }
}

/**
 * Convenience function to create a VertexSelector
 */
export function createVertexSelector(geometry: THREE.BufferGeometry): VertexSelector {
  return new VertexSelector(geometry)
}