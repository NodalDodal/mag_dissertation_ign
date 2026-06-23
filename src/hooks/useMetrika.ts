import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const METRIKA_ID = 109078887

/**
 * Custom hook for Yandex Metrika page hit tracking
 * Sends a hit to Metrika whenever the route changes
 */
export function useMetrikaHit() {
  const location = useLocation()
  const lastSentRef = useRef<string>('')

  useEffect(() => {
    // Avoid duplicate hits for the same path
    const path = location.pathname
    if (lastSentRef.current !== path) {
      lastSentRef.current = path
      
      if (typeof window !== 'undefined' && window.ym) {
        window.ym(METRIKA_ID, 'hit', path)
      }
    }
  }, [location.pathname])
}