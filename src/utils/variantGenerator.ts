/**
 * Variant Generator System
 * Handles randomization and configuration for A/B/C testing
 */

export type LayoutVariant = 'sidebar' | 'no-sidebar'
export type SidebarPosition = 'left' | 'right'
export type ControlTypeVariant = 'inputs' | 'sliders' | 'mixed' | 'hybrid' | 'gizmo'

export interface VariantConfig {
  id: string
  layout: LayoutVariant
  sidebarPosition: SidebarPosition
  controlType: ControlTypeVariant
  page: number
}

// Exclude page 6 from randomization
const EXCLUDED_PAGE = 6

// Predefined variant matrix
export const VARIANTS: VariantConfig[] = [
  // Page 1: Sidebar ONLY text inputs
  { id: 'v1', layout: 'sidebar', sidebarPosition: 'left', controlType: 'inputs', page: 1 },
  { id: 'v1b', layout: 'sidebar', sidebarPosition: 'right', controlType: 'inputs', page: 1 },
  
  // Page 2: Sidebar ONLY sliders
  { id: 'v2', layout: 'sidebar', sidebarPosition: 'left', controlType: 'sliders', page: 2 },
  { id: 'v2b', layout: 'sidebar', sidebarPosition: 'right', controlType: 'sliders', page: 2 },
  
  // Page 3: Sidebar Sliders + manual inputs
  { id: 'v3', layout: 'sidebar', sidebarPosition: 'left', controlType: 'mixed', page: 3 },
  { id: 'v3b', layout: 'sidebar', sidebarPosition: 'right', controlType: 'mixed', page: 3 },
  
  // Page 4: NO sidebar - 3D gizmos only
  { id: 'v4', layout: 'no-sidebar', sidebarPosition: 'left', controlType: 'gizmo', page: 4 },
  
  // Page 5: Sidebar + gizmos mixed controls
  { id: 'v5', layout: 'sidebar', sidebarPosition: 'left', controlType: 'hybrid', page: 5 },
  { id: 'v5b', layout: 'sidebar', sidebarPosition: 'right', controlType: 'hybrid', page: 5 },
  { id: 'v5c', layout: 'sidebar', sidebarPosition: 'left', controlType: 'gizmo', page: 5 },
]

// Storage key
const STORAGE_KEY = '3d_configurator_variant'

/**
 * Get or assign variant for user
 */
export function getAssignedVariant(): VariantConfig {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // Invalid stored data, continue to generate new
      }
    }
  }
  
  // Randomly assign (exclude page 6)
  const availableVariants = VARIANTS.filter(v => v.page !== EXCLUDED_PAGE)
  const randomVariant = availableVariants[Math.floor(Math.random() * availableVariants.length)]
  
  // Store assignment
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(randomVariant))
  }
  
  return randomVariant
}

/**
 * Get variant by page number
 */
export function getVariantByPage(page: number): VariantConfig | undefined {
  return VARIANTS.find(v => v.page === page)
}

/**
 * Reset variant assignment (for testing)
 */
export function resetVariantAssignment(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * Check if variant needs sidebar
 */
export function needsSidebar(variant: VariantConfig): boolean {
  return variant.layout === 'sidebar'
}

/**
 * Get control config description
 */
export function getControlDescription(type: ControlTypeVariant): string {
  const descriptions: Record<ControlTypeVariant, string> = {
    inputs: 'Только текстовые поля ввода',
    sliders: 'Только слайдеры',
    mixed: 'Слайдеры + поля ввода',
    hybrid: 'Смешанный тип',
    gizmo: '3D манипуляторы'
  }
  return descriptions[type]
}