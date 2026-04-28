import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store/useStore'
import { analytics } from '../utils/analytics'

interface ModalSystemProps {
  showModals: boolean
}

const MODAL_1_TITLE = 'Добро пожаловать'
const MODAL_1_CONTENT = `Эта страница - часть исследовательской работы по изучению оптимального интерфейса 3д-конфигуратора.

Ваша задача - создать окно с размерами 840 по ширине и 1345 по высоте, а также выбрать темный материал стекла, и материал оклейки Дуб Венге.`

const MODAL_2_TITLE = 'Инструкция'
const MODAL_2_CONTENT = `Не спешите, выполняйте инструкции в своем темпе.
Для вращения вокруг объекта зажмите левую кнопку мыши, используйте колесо для приближения, и зажмите правую кнопку мыши для сдвига объекта вбок.

Чувствуйте себя как дома`

/**
 * Modal System - Shows sequential welcome/instruction modals
 */
export const ModalSystem: React.FC<ModalSystemProps> = ({ showModals }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentModal, setCurrentModal] = useState(1)
  const logInteraction = useStore((s) => s.logInteraction)
  
  useEffect(() => {
    if (showModals) {
      setIsOpen(true)
      setCurrentModal(1)
      analytics.trackModalOpen('modal_1')
    }
  }, [showModals])

  const handleClose = useCallback(() => {
    if (currentModal === 1) {
      setCurrentModal(2)
      analytics.trackModalClose('modal_1')
      analytics.trackModalOpen('modal_2')
    } else {
      setIsOpen(false)
      analytics.trackModalClose('modal_2')
    }
    logInteraction({ type: 'modal' })
  }, [currentModal, logInteraction])

  if (!isOpen) return null

  const title = currentModal === 1 ? MODAL_1_TITLE : MODAL_2_TITLE
  const content = currentModal === 1 ? MODAL_1_CONTENT : MODAL_2_CONTENT

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
      
      <div 
        className="relative z-10 bg-slate-800 text-slate-100 rounded-2xl p-6 shadow-2xl max-w-md m-4 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-center text-xl font-semibold text-blue-400 mb-4">{title}</h2>
        <div className="border-t border-slate-700 mb-4" />
        <div className="text-center text-slate-300 space-y-3 whitespace-pre-line">
          {content}
        </div>
        <div className="w-full mt-6 flex justify-center">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 font-medium"
          >
            {currentModal === 1 ? 'Далее' : 'Понятно'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

/**
 * Placeholder Modal for page 6
 */
export const PlaceholderModal: React.FC = () => {
  const [isOpen] = useState(true)

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
      
      <div className="relative z-10 bg-slate-800 text-slate-100 rounded-2xl p-8 shadow-2xl border border-white/10 max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-blue-400 mb-4 text-center">
          Скоро тут будут диваны и столы
        </h2>
        <p className="text-slate-400 text-center">
          Мы работаем над новыми конфигураторами
        </p>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}