import { useState, useCallback } from 'react'

/**
 * Custom hook for managing 3D model control state
 * Handles controls for multi-axis model manipulation
 */
export const useModelControls = () => {
  // Transform controls
  const [scaleX, setScaleX] = useState<string>('1.0')
  const [scaleY, setScaleY] = useState<string>('1.0')
  const [offsetX, setOffsetX] = useState<string>('0.0')
  const [offsetY, setOffsetY] = useState<string>('0.0')
  
  // Threshold for vertex selection (distance from world origin along each axis)
  const [xThreshold, setXThreshold] = useState<number>(0)
  const [yThreshold, setYThreshold] = useState<number>(0)
  const [zThreshold, setZThreshold] = useState<number>(0)
  
  // Position offset (geometry deformation along each axis)
  const [offsetPosX, setOffsetPosX] = useState<number>(0)
  const [offsetPosY, setOffsetPosY] = useState<number>(0)
  const [offsetPosZ, setOffsetPosZ] = useState<number>(0)
  
  // UV correction strength (0-1)
  const [uvCorrectionStrength, setUVCorrectionStrength] = useState<number>(0.5)
  
  // Toggle controls
  const [testToggle, setTestToggle] = useState<boolean>(false)
  
  const [refreshKey, setRefreshKey] = useState<number>(0)

  const updateOffset = useCallback((
    axis: 'x' | 'y' | 'z', 
    value: number
  ) => {
    switch (axis) {
      case 'x':
        setOffsetPosX(value)
        break
      case 'y':
        setOffsetPosY(value)
        break
      case 'z':
        setOffsetPosZ(value)
        break
    }
    setRefreshKey(prev => prev + 1)
  }, [])

  const resetOffset = useCallback(() => {
    setScaleX('1.0')
    setScaleY('1.0')
    setOffsetX('0.0')
    setOffsetY('0.0')
    setXThreshold(0)
    setYThreshold(0)
    setZThreshold(0)
    setOffsetPosX(0)
    setOffsetPosY(0)
    setOffsetPosZ(0)
    setUVCorrectionStrength(0.5)
    setTestToggle(false)
    setRefreshKey(prev => prev + 1)
  }, [])

  return {
    // Transform values
    scaleX,
    setScaleX,
    scaleY,
    setScaleY,
    offsetX,
    setOffsetX,
    offsetY,
    setOffsetY,
    // Thresholds for vertex selection
    xThreshold,
    setXThreshold,
    yThreshold,
    setYThreshold,
    zThreshold,
    setZThreshold,
    // Position offsets
    offsetPosX,
    setOffsetPosX,
    offsetPosY,
    setOffsetPosY,
    offsetPosZ,
    setOffsetPosZ,
    // UV correction strength
    uvCorrectionStrength,
    setUVCorrectionStrength,
    // Toggle
    testToggle,
    setTestToggle,
    // Refresh
    refreshKey,
    // Combined update function
    updateOffset,
    resetOffset
  }
}

export type UseModelControlsReturn = ReturnType<typeof useModelControls>