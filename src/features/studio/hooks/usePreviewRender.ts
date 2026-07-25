'use client'

import { useEffect, useRef } from 'react'
import { renderPhoto, renderLayout } from '@/lib/imageUtils'
import { useStudioStore } from '@/features/studio/store'

export function usePreviewRender() {
  const cutoutUrl = useStudioStore((s) => s.cutoutUrl)
  const size = useStudioStore((s) => s.size)
  const background = useStudioStore((s) => s.background)
  const customColor = useStudioStore((s) => s.customColor)
  const scale = useStudioStore((s) => s.scale)
  const offsetX = useStudioStore((s) => s.offsetX)
  const offsetY = useStudioStore((s) => s.offsetY)
  const paper = useStudioStore((s) => s.paper)
  const gapMm = useStudioStore((s) => s.gapMm)
  const marginMm = useStudioStore((s) => s.marginMm)
  const cutLines = useStudioStore((s) => s.cutLines)

  const setPhotoPreview = useStudioStore((s) => s.setPhotoPreview)
  const setLayoutPreview = useStudioStore((s) => s.setLayoutPreview)
  const setLayoutStats = useStudioStore((s) => s.setLayoutStats)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!cutoutUrl) {
      setPhotoPreview('')
      setLayoutPreview('')
      setLayoutStats({ count: 0, cols: 0, rows: 0 })
      return
    }

    let cancelled = false

    const update = async () => {
      const effectiveBg = background.id === 'custom'
        ? { id: 'custom' as const, label: '自定义', css: customColor, value: customColor, kind: 'solid' as const }
        : background

      try {
        const photoCanvas = await renderPhoto({
          sourceUrl: cutoutUrl,
          width: size.width,
          height: size.height,
          background: effectiveBg,
          scale,
          offsetX,
          offsetY,
        })
        const photoUrl = photoCanvas.toDataURL('image/png')

        const layout = renderLayout({
          photoCanvas,
          paper,
          widthMm: size.widthMm,
          heightMm: size.heightMm,
          gapMm,
          marginMm,
          cutLines,
        })
        const sheetUrl = layout.canvas.toDataURL('image/jpeg', 0.9)

        if (!cancelled) {
          setPhotoPreview(photoUrl)
          setLayoutPreview(sheetUrl)
          setLayoutStats({ count: layout.count, cols: layout.cols, rows: layout.rows })
        }
      } catch {
        // Silently ignore render failures during rapid slider changes
      }
    }

    // Debounce 150ms to avoid jank during slider dragging
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(update, 150)

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
    }
  }, [cutoutUrl, size, background, customColor, scale, offsetX, offsetY, paper, gapMm, marginMm, cutLines, setPhotoPreview, setLayoutPreview, setLayoutStats])
}
