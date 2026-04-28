import React, { useMemo } from 'react'
import * as THREE from 'three'

interface SelectionBoxProps {
  geometry: THREE.BufferGeometry
  selectedIndices: number[]
}

/**
 * SelectionBox Component
 * Renders a semi-transparent cube that represents the bounding box of selected vertices
 */
export const SelectionBox: React.FC<SelectionBoxProps> = ({ geometry, selectedIndices }) => {
  // Compute bounding box from selected vertices
  const boundingBox = useMemo(() => {
    if (selectedIndices.length === 0) {
      return null
    }

    const position = geometry.attributes.position
    if (!position) {
      return null
    }

    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

    // Loop through selected indices and compute min/max
    for (let i = 0; i < selectedIndices.length; i++) {
      const index = selectedIndices[i]
      if (index >= position.count) continue

      const x = position.getX(index)
      const y = position.getY(index)
      const z = position.getZ(index)

      if (x < minX) minX = x
      if (y < minY) minY = y
      if (z < minZ) minZ = z
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      if (z > maxZ) maxZ = z
    }

    // Check if we have valid bounds
    if (minX === Infinity || maxX === -Infinity) {
      return null
    }

    // Calculate size and center
    const sizeX = maxX - minX
    const sizeY = maxY - minY
    const sizeZ = maxZ - minZ
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const centerZ = (minZ + maxZ) / 2

    return {
      size: new THREE.Vector3(sizeX, sizeY, sizeZ),
      center: new THREE.Vector3(centerX, centerY, centerZ)
    }
  }, [geometry, selectedIndices])

  // Don't render if no selection
  if (!boundingBox) {
    return null
  }

  return (
    <group>
      {/* Main transparent box */}
      <mesh position={boundingBox.center}>
        <boxGeometry args={[boundingBox.size.x, boundingBox.size.y, boundingBox.size.z]} />
        <meshStandardMaterial
          color="#3b82f6"
          transparent
          opacity={0.15}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Wireframe edges for clarity */}
      <lineSegments position={boundingBox.center}>
        <edgesGeometry args={[new THREE.BoxGeometry(boundingBox.size.x, boundingBox.size.y, boundingBox.size.z)]} />
        <lineBasicMaterial color="#60a5fa" linewidth={1} />
      </lineSegments>
    </group>
  )
}