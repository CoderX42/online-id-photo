'use client'

import { ChevronRight } from 'lucide-react'
import { useStudioStore } from '@/features/studio/store'

export default function SizePicker() {
  const size = useStudioStore((s) => s.size)
  const setSizeOpen = useStudioStore((s) => s.setSizeOpen)

  return (
    <button className="size-picker" onClick={() => setSizeOpen(true)}>
      <span>
        <strong>{size.name}</strong>
        <small>{size.width} × {size.height}px · {size.widthMm} × {size.heightMm}mm</small>
      </span>
      <ChevronRight size={19} />
    </button>
  )
}
