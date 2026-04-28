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
  setOffset: (axis: 'x' | 'y' | 'z', value: number) => void
  setThreshold: (axis: 'x' | 'y' | 'z', value: number) => void
  
  setVariant: (variant: VariantConfig) => void
  logInteraction: (log: Omit<InteractionLog, 'timestamp'>) => void
  logClick: (x: number, y: number) => void
  logControlChange: (name: string, value: number | string) => void
  logFinish: () => void
  reset: () => void
}

const initialState = {
  xOffset: 0,
  yOffset: 0,
  zOffset: 0,
  xThreshold: 0,
  yThreshold: 0,
  zThreshold: 0,
  uvCorrectionStrength: 1, // Default set to 1
  variant: null,
  sessionStartTime: 0,
  interactionLogs: [],
}

export const useStore = create<ConfiguratorState>((set, get) => ({
  ...initialState,

  setXOffset: (value) => set({ xOffset: value }),
  setYOffset: (value) => set({ yOffset: value }),
  setZOffset: (value) => set({ zOffset: value }),
  setXThreshold: (value) => set({ xThreshold: value }),
  setYThreshold: (value) => set({ yThreshold: value }),
  setZThreshold: (value) => set({ zThreshold: value }),
  setUVCorrectionStrength: (value) => set({ uvCorrectionStrength: value }),
  
  setOffset: (axis, value) => {
    switch (axis) {
      case 'x': set({ xOffset: value }); break
      case 'y': set({ yOffset: value }); break
      case 'z': set({ zOffset: value }); break
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