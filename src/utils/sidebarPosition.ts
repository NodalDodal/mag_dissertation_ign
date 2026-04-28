import type { SidebarPosition } from './variantGenerator'

const SIDEBAR_POSITION_KEY = 'sidebarPosition'

/**
 * Get sidebar position from localStorage or randomize
 */
export function getSidebarPosition(): SidebarPosition {
  if (typeof window === 'undefined') return 'left'
  
  const stored = localStorage.getItem(SIDEBAR_POSITION_KEY)
  if (stored === 'left' || stored === 'right') {
    return stored
  }
  
  // Randomize
  const position: SidebarPosition = Math.random() > 0.5 ? 'left' : 'right'
  localStorage.setItem(SIDEBAR_POSITION_KEY, position)
  return position
}

/**
 * Set sidebar position
 */
export function setSidebarPosition(position: SidebarPosition): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SIDEBAR_POSITION_KEY, position)
  }
}

/**
 * Reset sidebar position
 */
export function resetSidebarPosition(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SIDEBAR_POSITION_KEY)
  }
}