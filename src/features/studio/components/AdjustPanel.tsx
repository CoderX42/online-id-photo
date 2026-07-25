'use client'

import { Maximize2, Move, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useStudioStore } from '@/features/studio/store'

function RangeControl({
  icon,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
}) {
  const percentage = ((value - min) / (max - min)) * 100
  return (
    <label className="range-control">
      <span className="range-label">
        {icon}
        <span>{label}</span>
        <b>{display}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--range-progress': `${percentage}%` } as React.CSSProperties}
      />
    </label>
  )
}

export default function AdjustPanel() {
  const scale = useStudioStore((s) => s.scale)
  const offsetX = useStudioStore((s) => s.offsetX)
  const offsetY = useStudioStore((s) => s.offsetY)

  const setScale = useStudioStore((s) => s.setScale)
  const setOffsetX = useStudioStore((s) => s.setOffsetX)
  const setOffsetY = useStudioStore((s) => s.setOffsetY)
  const resetAdjustments = useStudioStore((s) => s.resetAdjustments)

  return (
    <>
      <div className="flex items-center justify-end mb-3">
        <button onClick={resetAdjustments} className="flex items-center gap-1 text-[11px] text-[var(--blue)] hover:underline">
          <RotateCcw size={13} /> 重置全部
        </button>
      </div>
      <RangeControl icon={<Maximize2 size={14} />} label="缩放" value={scale} min={0.72} max={1.5} step={0.01} display={`${Math.round(scale * 100)}%`} onChange={setScale} />
      <RangeControl icon={<Move size={14} />} label="左右" value={offsetX} min={-30} max={30} step={1} display={`${offsetX}`} onChange={setOffsetX} />
      <RangeControl icon={<Move size={14} />} label="上下" value={offsetY} min={-30} max={30} step={1} display={`${offsetY}`} onChange={setOffsetY} />
    </>
  )
}
