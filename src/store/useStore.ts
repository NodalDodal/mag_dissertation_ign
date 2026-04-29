import { create } from 'zustand'
import type { VariantConfig } from '../utils/variantGenerator'

interface InteractionLog {
  type: 'click' | 'control_change' | 'finish' | 'modal'
  x?: number
  y?: number
  controlName?: string
  value?: number | string
  timestamp: number
}

interface ConfiguratorState {
  xOffset: number
  yOffset: number
  zOffset: number
  xThreshold: number
  yThreshold: number
  zThreshold: number
  uvCorrectionStrength: number
  selectedMaterial: string
  
  variant: VariantConfig | null
  sessionStartTime: number
  interactionLogs: InteractionLog[]
  
  setXOffset: (value: number) => void
  setYOffset: (value: number) => void
  setZOffset: (value: number) => void
  setXThreshold: (value: number) => void
  setYThreshold: (value: number) => void
  setZThreshold: (value: number) => void
  setUVCorrectionStrength: (value: number) => void
  setSelectedMaterial: (material: string) => void
  setOffset: (axis: 'x' | 'y' | 'z', value: number) => void
  setThreshold: (axis: 'x' | 'y' | 'z', value: number) => void
  
  setVariant: (variant: VariantConfig) => void
  logInteraction: (log: Omit<InteractionLog, 'timestamp'>) => void
  logClick: (x: number, y: number) => void
  logControlChange: (name: string, value: number | string) => void
  logFinish: () => void
  reset: () => void
}

const MIN_SCALE = 0.3
const MAX_SCALE = 2

const clampScale = (value: number): number => {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, value))
}

const initialState = {
  xOffset: 0,
  yOffset: 1,      // Высота default 1
  zOffset: 0.6,    // Ширина default 0.6
  xThreshold: 0,
  yThreshold: 0,
  zThreshold: 0,
  uvCorrectionStrength: 1, // 100% default
  selectedMaterial: 'dark-wood-stain',
  variant: null,
  sessionStartTime: 0,
  interactionLogs: [],
}

export const useStore = create<ConfiguratorState>((set, get) => ({
  ...initialState,

  setXOffset: (value) => set({ xOffset: clampScale(value) }),
  setYOffset: (value) => set({ yOffset: clampScale(value) }),
  setZOffset: (value) => set({ zOffset: clampScale(value) }),
  setXThreshold: (value) => set({ xThreshold: value }),
  setYThreshold: (value) => set({ yThreshold: value }),
  setZThreshold: (value) => set({ zThreshold: value }),
  setUVCorrectionStrength: (value) => set({ uvCorrectionStrength: value }),
  setSelectedMaterial: (material) => set({ selectedMaterial: material }),
  
  setOffset: (axis, value) => {
    const clampedValue = clampScale(value)
    switch (axis) {
      case 'x': set({ xOffset: clampedValue }); break
      case 'y': set({ yOffset: clampedValue }); break
      case 'z': set({ zOffset: clampedValue }); break
    }
  },
  
  setThreshold: (axis, value) => {
    switch (axis) {
      case 'x': set({ xThreshold: value }); break
      case 'y': set({ yThreshold: value }); break
      case 'z': set({ zThreshold: value }); break
    }
  },

  setVariant: (variant) => set({ variant, sessionStartTime: Date.now(), interactionLogs: [] }),

  logInteraction: (log) => set((state) => ({
    interactionLogs: [...state.interactionLogs, { ...log, timestamp: Date.now() }]
  })),

  logClick: (x, y) => {
    const log: InteractionLog = { type: 'click', x, y, timestamp: Date.now() }
    set((state) => ({ interactionLogs: [...state.interactionLogs, log] }))
    console.log('[Analytics] Click:', { x, y, time: Date.now() - get().sessionStartTime })
  },

  logControlChange: (name, value) => {
    const log: InteractionLog = { type: 'control_change', controlName: name, value, timestamp: Date.now() }
    set((state) => ({ interactionLogs: [...state.interactionLogs, log] }))
    console.log('[Analytics] Control Change:', { name, value, time: Date.now() - get().sessionStartTime })
  },

  logFinish: () => {
    const log: InteractionLog = { type: 'finish', timestamp: Date.now() }
    set((state) => ({ interactionLogs: [...state.interactionLogs, log] }))
    console.log('[Analytics] Finish clicked!', { totalTime: Date.now() - get().sessionStartTime, interactions: get().interactionLogs.length })
  },

  reset: () => set(initialState),
}))