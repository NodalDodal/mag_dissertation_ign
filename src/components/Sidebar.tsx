import React from 'react'
import type { SidebarPosition } from '../utils/variantGenerator'

interface SidebarProps {
  position: SidebarPosition
  children: React.ReactNode
}

/**
 * Sidebar Component - Supports left/right positions
 */
export const Sidebar: React.FC<SidebarProps> = ({ position, children }) => {
  const positionClasses = position === 'left' 
    ? 'left-4 top-4' 
    : 'right-4 top-4'

  return (
    <div className={`fixed ${positionClasses} z-20 w-[340px]`}>
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