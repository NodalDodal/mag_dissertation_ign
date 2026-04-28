import React from 'react'
import { InputField } from './InputField'
import { SliderControl } from './SliderControl'
import { ToggleSwitch } from './ToggleSwitch'

interface ControlPanelProps {
  scaleX: string
  scaleY: string
  offsetX: string
  offsetY: string
  xThreshold: number
  yThreshold: number
  zThreshold: number
  offsetPosX: number
  offsetPosY: number
  offsetPosZ: number
  uvCorrectionStrength: number
  testToggle: boolean
  onScaleXChange: (value: string) => void
  onScaleYChange: (value: string) => void
  onOffsetXChange: (value: string) => void
  onOffsetYChange: (value: string) => void
  onXThresholdChange: (value: number) => void
  onYThresholdChange: (value: number) => void
  onZThresholdChange: (value: number) => void
  onOffsetPosXChange: (value: number) => void
  onOffsetPosYChange: (value: number) => void
  onOffsetPosZChange: (value: number) => void
  onUVCorrectionStrengthChange: (value: number) => void
  onTestToggleChange: (value: boolean) => void
  onOpenInfo: () => void
  onReset: () => void
}

/**
 * Modern glassmorphism control panel for 3D configurator
 * Multi-axis vertex manipulation
 */
export const ControlPanel: React.FC<ControlPanelProps> = ({
  scaleX,
  scaleY,
  offsetX,
  offsetY,
  xThreshold,
  yThreshold,
  zThreshold,
  offsetPosX,
  offsetPosY,
  offsetPosZ,
  uvCorrectionStrength,
  testToggle,
  onScaleXChange,
  onScaleYChange,
  onOffsetXChange,
  onOffsetYChange,
  onXThresholdChange,
  onYThresholdChange,
  onZThresholdChange,
  onOffsetPosXChange,
  onOffsetPosYChange,
  onOffsetPosZChange,
  onUVCorrectionStrengthChange,
  onTestToggleChange,
  onOpenInfo,
  onReset
}) => {
  return (
    <div className="fixed top-4 right-4 z-20 w-[340px]">
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-800/80 to-slate-700/60 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl border border-white/10 bg-slate-700/50 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-blue-400 tracking-wide">
                3D Configurator
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Multi-axis deformation
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Scale Section */}
          <div className="space-y-5">
            <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
              Scale
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Scale X" value={scaleX} onChange={onScaleXChange} />
              <InputField label="Scale Y" value={scaleY} onChange={onScaleYChange} />
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* Offset Section */}
          <div className="space-y-5">
            <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
              Offset
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Offset X" value={offsetX}  onChange={onOffsetXChange} />
              <InputField label="Offset Y" value={offsetY} onChange={onOffsetYChange} />
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* Vertex Selection - Thresholds */}
          <div className="space-y-5">
            <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
              Vertex Selection
            </h3>
            <SliderControl
              label="Z Threshold"
              sublabel="Distance from world origin along X"
              value={xThreshold}
              min={-2}
              max={2}
              step={0.5}
              onChange={onXThresholdChange}
            />
            <SliderControl
              label="Y Threshold"
              sublabel="Distance from world origin along Y"
              value={yThreshold}
              min={-2}
              max={2}
              step={0.5}
              onChange={onYThresholdChange}
            />
            <SliderControl
              label="X Threshold"
              sublabel="Distance from world origin along Z"
              value={zThreshold}
              min={-2}
              max={2}
              step={0.5}
              onChange={onZThresholdChange}
            />
          </div>

          <div className="border-t border-white/5" />

          {/* Position Adjustment - Offsets */}
          <div className="space-y-5">
            <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
              Position Adjustment
            </h3>
            <SliderControl
              label="Offset Z"
              sublabel="Position adjustment along X"
              value={offsetPosX}
              min={-2}
              max={2}
              step={0.5}
              onChange={onOffsetPosXChange}
            />
            <SliderControl
              label="Offset Y"
              sublabel="Position adjustment along Y"
              value={offsetPosY}
              min={-2}
              max={2}
              step={0.5}
              onChange={onOffsetPosYChange}
            />
            <SliderControl
              label="Offset X"
              sublabel="Position adjustment along Z"
              value={offsetPosZ}
              min={-2}
              max={2}
              step={0.5}
              onChange={onOffsetPosZChange}
            />
          </div>

          <div className="border-t border-white/5" />

          {/* UV Correction Section */}
          <div className="space-y-5">
            <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
              UV Correction
            </h3>
            <SliderControl
              label="UV Correction Strength"
              sublabel="Prevent texture stretching (0=off, 1=max)"
              value={uvCorrectionStrength}
              min={0}
              max={1}
              step={0.5}
              onChange={onUVCorrectionStrengthChange}
            />
          </div>

          <div className="border-t border-white/5" />

          {/* Toggle Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
              Options
            </h3>
            <ToggleSwitch
              label="Test"
              subtext="Test toggle"
              checked={testToggle}
              onChange={onTestToggleChange}
            />
          </div>

          <div className="border-t border-white/5" />

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onOpenInfo}
              className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium border border-blue-500/30 hover:border-blue-400/50 shadow-lg shadow-blue-500/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Open Info
            </button>

            <button
              onClick={onReset}
              className="w-full px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium border border-slate-600/50 hover:border-slate-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/40 border-t border-white/5">
          <p className="text-xs text-slate-500 text-center">
            Drag to rotate • Scroll to zoom
          </p>
        </div>
      </div>
    </div>
  )
}