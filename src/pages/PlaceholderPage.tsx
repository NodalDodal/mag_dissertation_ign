import React from 'react'
import { PlaceholderModal } from '../components/ModalSystem'

/**
 * Placeholder Page - Page 6
 * Disabled from random pool
 */
export const PlaceholderPage: React.FC = () => {
  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden">
      <PlaceholderModal />
    </div>
  )
}