import React, { useState } from 'react'
import type { SidebarPosition } from '../utils/variantGenerator'

interface SidebarProps {
  position: SidebarPosition
  children: React.ReactNode
  defaultOpen?: boolean
}

/**
 * Collapsible Sidebar Component - Supports left/right positions with slide animation
 */
export const Sidebar: React.FC<SidebarProps> = ({ position, children, defaultOpen = true }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultOpen)

  const isLeft = position === 'left'
  
  // Animation classes based on position and state
  const transformClass = isLeft
    ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full')
    : (isSidebarOpen ? 'translate-x-0' : 'translate-x-full')

  // Position classes for the fixed container
  const containerPositionClass = isLeft ? 'left-0' : 'right-0'

  // Toggle button position - sticks to the edge of the sidebar
  const buttonPositionClass = isLeft ? 'right-[-44px]' : 'left-[-44px]'

  // Arrow icon rotation - chevron points toward sidebar when open
  const arrowRotation = isSidebarOpen ? (isLeft ? 'rotate-0' : 'rotate-180') : (isLeft ? 'rotate-180' : 'rotate-0')

  return (
    <div 
      className={`fixed top-4 ${containerPositionClass} z-20 w-[340px] transition-transform duration-300 ease-in-out ${transformClass}`}
    >
      {/* Toggle Button - Always visible, attached to sidebar edge */}
      <button
        onClick={() => setIsSidebarOpen(prev => !prev)}
        className={`absolute top-1/2 -translate-y-1/2 ${buttonPositionClass} w-10 h-10 rounded-full bg-slate-700/70 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center transition-all duration-200 hover:bg-slate-600/80 hover:scale-105 active:scale-95 text-white`}
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <svg 
          className={`w-5 h-5 transition-transform duration-300 ${arrowRotation}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div style={{ padding: 2 }} className="p-4 bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

/**
 * Sidebar Header
 */
export const SidebarHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="px-6 py-5 bg-gradient-to-r from-slate-800/80 to-slate-700/60 border-b border-white/5">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl border border-white/10 bg-slate-700/50 flex items-center justify-center shadow-lg">
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-blue-400 tracking-wide">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  </div>
)

/**
 * Sidebar Content
 */
export const SidebarContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 space-y-6">{children}</div>
)

/**
 * Sidebar Section
 */
export const SidebarSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-5">
    <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{title}</h3>
    {children}
  </div>
)

/**
 * Sidebar Divider
 */
export const SidebarDivider: React.FC = () => <div className="border-t border-white/5" />

/**
 * Sidebar Footer
 */
export const SidebarFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 bg-slate-800/40 border-t border-white/5">
    {children}
  </div>
)