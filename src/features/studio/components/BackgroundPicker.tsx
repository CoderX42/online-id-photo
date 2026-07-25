'use client'

import { Check, CircleAlert, Palette } from 'lucide-react'
import { backgrounds, type Background } from '@/lib/imageUtils'
import { useStudioStore } from '@/features/studio/store'

export default function BackgroundPicker() {
  const background = useStudioStore((s) => s.background)
  const customColor = useStudioStore((s) => s.customColor)
  const originalUrl = useStudioStore((s) => s.originalUrl)
  const hasCutout = useStudioStore((s) => s.hasCutout)

  const setBackground = useStudioStore((s) => s.setBackground)
  const setCustomColor = useStudioStore((s) => s.setCustomColor)

  const customBackground: Background = {
    id: 'custom',
    label: '自定义',
    css: customColor,
    value: customColor,
    kind: 'solid',
  }

  const locked = Boolean(originalUrl && !hasCutout)

  return (
    <div className={locked ? 'color-unavailable' : ''}>
      <div className="color-grid" role="list" aria-label="照片底色">
        {backgrounds.map((item) => (
          <button
            key={item.id}
            className={`color-swatch ${background.id === item.id ? 'selected' : ''} ${item.css === 'checkerboard' ? 'checkerboard' : ''}`}
            style={item.css === 'checkerboard' ? undefined : { background: item.css }}
            title={item.label}
            aria-label={item.label}
            disabled={locked}
            onClick={() => setBackground(item)}
          >
            {background.id === item.id && <Check size={17} />}
          </button>
        ))}
        <label
          className={`color-swatch rainbow ${background.id === 'custom' ? 'selected' : ''}`}
          title="自定义颜色"
        >
          <input
            type="color"
            disabled={locked}
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value)
              setBackground(customBackground)
            }}
          />
          {background.id === 'custom' && <Check size={17} />}
        </label>
      </div>

      {locked && (
        <div className="color-lock-note">
          <CircleAlert size={14} /> 完成人像识别后即可更换底色
        </div>
      )}
    </div>
  )
}
