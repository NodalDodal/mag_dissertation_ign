import { useState, useCallback } from 'react'
import { scaleToMm, mmToScale } from '../utils/unitConversion'

/**
 * Custom hook for managing 3D model control state
 * Handles controls for multi-axis model manipulation
 * 
 * Note: offsetX, offsetY, offsetPosX, offsetPosY, offsetPosZ store internal scale values
 * but are displayed to users as millimeters (scale * 1000)
 */
export const useModelControls = () => {
  // Transform controls (scale values, displayed as mm in UI)
  const [scaleX, setScaleX] = useState<string>('1.0')
  const [scaleY, setScaleY] = useState<string>('1.0')
  // Offset values - initialized to store defaults (in mm for display)
  // yOffset default = 1.0 (1000mm), zOffset default = 0.6 (600mm)
  const [offsetX, setOffsetX] = useState<string>('300') // Min = 300mm
  const [offsetY, setOffsetY] = useState<string>('1000') // 1000mm default (matches store yOffset)
  
  // Threshold for vertex selection (distance from world origin along each axis)
  const [xThreshold, setXThreshold] = useState<number>(0)
  const [yThreshold, setYThreshold] = useState<number>(0)
  const [zThreshold, setZThreshold] = useState<number>(0)
  
  // Position offset (geometry deformation along each axis)
  // Min scale = 0.3 (300mm)
  const [offsetPosX, setOffsetPosX] = useState<number>(0.3)
  const [offsetPosY, setOffsetPosY] = useState<number>(1.0) // 1000mm default
  const [offsetPosZ, setOffsetPosZ] = useState<number>(0.6) // 600mm default (matches store zOffset)
  
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
    setOffsetX('300') // 300mm (min scale)
    setOffsetY('1000') // 1000mm (default)
    setXThreshold(0)
    setYThreshold(0)
    setZThreshold(0)
    setOffsetPosX(0.3) // 300mm (min scale)
    setOffsetPosY(1.0) // 1000mm (default)
    setOffsetPosZ(0.6) // 600mm (default)
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