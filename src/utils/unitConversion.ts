/**
 * Unit Conversion Utilities
 * Centralized system for converting between internal scale values and millimeters
 * 
 * Internal scale: 0.3 ... 2.0 (proportional to original size)
 * Display: 300 ... 2000 (millimeters)
 * 
 * Formula: displayValueMm = internalScaleValue * 1000
 */

export const SCALE_TO_MM = 1000

// Internal scale bounds
export const MIN_INTERNAL_SCALE = 0.3
export const MAX_INTERNAL_SCALE = 2.0

// Display bounds (in mm)
export const MIN_DISPLAY_MM = MIN_INTERNAL_SCALE * SCALE_TO_MM // 300
export const MAX_DISPLAY_MM = MAX_INTERNAL_SCALE * SCALE_TO_MM // 2000

/**
 * Convert internal scale value to millimeters
 * Internal: 0.72 → Display: 720
 */
export function scaleToMm(value: number): number {
  return Math.round(value * SCALE_TO_MM)
}

/**
 * Convert millimeters to internal scale value
 * Display: 720 → Internal: 0.72
 */
export function mmToScale(valueMm: number): number {
  return valueMm / SCALE_TO_MM
}

/**
 * Clamp internal scale value to valid range
 */
export function clampScale(value: number): number {
  return Math.max(MIN_INTERNAL_SCALE, Math.min(MAX_INTERNAL_SCALE, value))
}

/**
 * Clamp mm value to valid display range
 */
export function clampMm(valueMm: number): number {
  return Math.max(MIN_DISPLAY_MM, Math.min(MAX_DISPLAY_MM, valueMm))
}

/**
 * Parse user input (mm) to internal scale value
 * Handles various input formats (with/without decimals)
 */
export function parseMmInput(valueMm: string): number {
  const parsed = parseFloat(valueMm)
  if (isNaN(parsed)) return MIN_INTERNAL_SCALE
  return clampScale(mmToScale(parsed))
}

/**
 * Format internal scale value for display in mm (no decimals)
 * Internal: 1.345 → Display: "1345"
 */
export function formatMmDisplay(value: number): string {
  return String(scaleToMm(value))
}

/**
 * Validate if mm value is within acceptable range
 */
export function isValidMm(valueMm: number): boolean {
  return valueMm >= MIN_DISPLAY_MM && valueMm <= MAX_DISPLAY_MM
}

/**
 * Get slider props for mm-based slider
 * Returns min/max in mm while step remains based on internal scale
 */
export function getSliderPropsMm() {
  return {
    min: MIN_DISPLAY_MM,
    max: MAX_DISPLAY_MM,
    step: 10 // 10mm steps
  }
}

/**
 * Convert slider mm value to internal scale
 */
export function sliderMmToScale(valueMm: number): number {
  return clampScale(mmToScale(valueMm))
}

/**
 * Convert internal scale to slider mm value
 */
export function scaleToSliderMm(value: number): number {
  return scaleToMm(value)
}
