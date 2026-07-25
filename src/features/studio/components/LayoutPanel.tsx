'use client'

import { Minus, Plus, Printer } from 'lucide-react'
import { getPaper, type LayoutOptions } from '@/lib/imageUtils'
import { useStudioStore } from '@/features/studio/store'

export default function LayoutPanel() {
  const paper = useStudioStore((s) => s.paper)
  const gapMm = useStudioStore((s) => s.gapMm)
  const marginMm = useStudioStore((s) => s.marginMm)
  const cutLines = useStudioStore((s) => s.cutLines)
  const layoutStats = useStudioStore((s) => s.layoutStats)
  const cutoutUrl = useStudioStore((s) => s.cutoutUrl)
  const processing = useStudioStore((s) => s.processing)

  const setPaper = useStudioStore((s) => s.setPaper)
  const setGapMm = useStudioStore((s) => s.setGapMm)
  const setMarginMm = useStudioStore((s) => s.setMarginMm)
  const setCutLines = useStudioStore((s) => s.setCutLines)
  const exportLayout = useStudioStore((s) => s.exportLayout)

  const paperMeta = getPaper(paper)

  return (
    <div className="layout-controls">
      <div className="control-row">
        <label>
          相纸尺寸
          <select value={paper} onChange={(e) => setPaper(e.target.value as LayoutOptions['paper'])}>
            <option value="6inch">6 寸（152×102mm）</option>
            <option value="5inch">5 寸（127×89mm）</option>
            <option value="a4">A4（210×297mm）</option>
          </select>
        </label>

        <label>
          照片间距
          <div className="number-stepper">
            <button onClick={() => setGapMm(Math.max(0, gapMm - 0.5))}><Minus size={12} /></button>
            <span>{gapMm} mm</span>
            <button onClick={() => setGapMm(Math.min(10, gapMm + 0.5))}><Plus size={12} /></button>
          </div>
        </label>

        <label>
          页边距
          <div className="number-stepper">
            <button onClick={() => setMarginMm(Math.max(0, marginMm - 1))}><Minus size={12} /></button>
            <span>{marginMm} mm</span>
            <button onClick={() => setMarginMm(Math.min(20, marginMm + 1))}><Plus size={12} /></button>
          </div>
        </label>

        <label className="switch-label">
          <input type="checkbox" checked={cutLines} onChange={(e) => setCutLines(e.target.checked)} />
          <i />
          显示裁切线
        </label>
      </div>

      <button className="layout-download" disabled={!cutoutUrl || processing} onClick={exportLayout}>
        <Printer size={18} /> 下载高清排版照 <small>300DPI · JPG</small>
      </button>
    </div>
  )
}
