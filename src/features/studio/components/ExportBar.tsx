'use client'

import { ArrowDownToLine, Download, ShieldCheck } from 'lucide-react'
import { useStudioStore } from '@/features/studio/store'

export default function ExportBar() {
  const cutoutUrl = useStudioStore((s) => s.cutoutUrl)
  const processing = useStudioStore((s) => s.processing)
  const size = useStudioStore((s) => s.size)
  const exportPhoto = useStudioStore((s) => s.exportPhoto)

  const disabled = !cutoutUrl || processing

  return (
    <div className="export-bar">
      <div>
        <ShieldCheck size={20} className="text-green-600" />
        <span>
          <strong>高清无水印</strong>
          <small>按所选像素与 300DPI 导出</small>
        </span>
      </div>
      <div className="export-actions">
        <button disabled={disabled} onClick={() => exportPhoto('jpeg')}>
          <Download size={17} /> 下载 JPG
        </button>
        <button className="dark" disabled={disabled} onClick={() => exportPhoto('png')}>
          <ArrowDownToLine size={17} /> 下载 PNG
        </button>
      </div>
    </div>
  )
}
