import React, { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

/**
 * Modal component using React Portal for proper rendering
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  
  // Handle escape key press
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity duration-300" />
      
      {/* Modal content */}
        <div 
          className="relative z-10 bg-slate-800 text-slate-100 rounded-2xl p-6 shadow-2xl max-w-md transform transition-all duration-300 scale-100 m-4"
          onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 
            id="modal-title" 
            className="text-xl font-semibold text-cold-400"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cold-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            aria-label="Close modal"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
        
        {/* Divider */}
        <div className="border-t border-slate-700 mb-4" />
        
        {/* Content */}
        <div className="text-slate-300 space-y-3">
          {children}
        </div>
        
        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cold-500 hover:bg-cold-600 text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cold-400 focus:ring-offset-2 focus:ring-offset-slate-800 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )

  // Render using React Portal into document.body
  return createPortal(modalContent, document.body)
}
