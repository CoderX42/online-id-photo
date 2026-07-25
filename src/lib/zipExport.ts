import JSZip from 'jszip'
import { renderPhoto } from '@/lib/imageUtils'
import { photoSizes, type PhotoSize } from '@/lib/photoSizes'
import type { Background } from '@/lib/imageUtils'

export type ZipExportOptions = {
  sourceUrl: string
  sizes: PhotoSize[]
  background: Background
  scale: number
  offsetX: number
  offsetY: number
}

/**
 * Render multiple photo sizes and package them into a ZIP file for download.
 */
export async function createExportZip(options: ZipExportOptions): Promise<Blob> {
  const zip = new JSZip()

  for (const size of options.sizes) {
    const canvas = await renderPhoto({
      sourceUrl: options.sourceUrl,
      width: size.width,
      height: size.height,
      background: options.background,
      scale: options.scale,
      offsetX: options.offsetX,
      offsetY: options.offsetY,
    })

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/jpeg', 0.92)
    })

    zip.file(`${size.name}-${size.width}x${size.height}.jpg`, blob)
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

/**
 * Download a ZIP of all hot/popular sizes for the current photo.
 */
export async function downloadHotSizesZip(sourceUrl: string, background: Background): Promise<void> {
  const hotSizes = photoSizes.filter((s) => s.hot)
  const blob = await createExportZip({
    sourceUrl,
    sizes: hotSizes,
    background,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = '照见-多尺寸打包.zip'
  link.href = url
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
