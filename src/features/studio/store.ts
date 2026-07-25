import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  removePhotoBackground,
  subscribeModelProgress,
  type ModelProgress,
} from '@/lib/backgroundRemoval'
import {
  backgrounds,
  preserveLightClothing,
  renderPhoto,
  renderLayout,
  downloadCanvas,
  getPaper,
  type Background,
  type LayoutOptions,
} from '@/lib/imageUtils'
import { photoSizes, type PhotoSize } from '@/lib/photoSizes'

export type ExportRecord = {
  id: number
  name: string
  detail: string
  time: string
  kind: 'photo' | 'layout'
}

const defaultSize = photoSizes[0]

function formatTime() {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date())
}

function clampNumber(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum
  return Math.min(maximum, Math.max(minimum, value))
}

export interface StudioState {
  // Image state
  originalUrl: string
  cutoutUrl: string
  sourceFile: File | null
  hasCutout: boolean
  fileName: string
  sourceMeta: { width: number; height: number; size: number }
  processing: boolean
  progress: number
  processNote: string
  modelInfo: ModelProgress

  // Adjustment
  size: PhotoSize
  background: Background
  customColor: string
  scale: number
  offsetX: number
  offsetY: number

  // UI state
  showOriginal: boolean
  sizeOpen: boolean
  search: string
  category: string
  activeTab: 'photo' | 'layout'
  dragging: boolean

  // Layout
  paper: LayoutOptions['paper']
  gapMm: number
  marginMm: number
  cutLines: boolean

  // Preview cache
  photoPreview: string
  layoutPreview: string
  layoutStats: { count: number; cols: number; rows: number }

  // Export records
  records: ExportRecord[]

  // Custom size
  customWidth: number
  customHeight: number
  customUnit: 'px' | 'mm'
  dpi: number

  // Actions
  setOriginalUrl: (url: string) => void
  setCutoutUrl: (url: string) => void
  setSize: (size: PhotoSize) => void
  setBackground: (bg: Background) => void
  setCustomColor: (color: string) => void
  setScale: (scale: number) => void
  setOffsetX: (x: number) => void
  setOffsetY: (y: number) => void
  setShowOriginal: (show: boolean) => void
  setSizeOpen: (open: boolean) => void
  setSearch: (search: string) => void
  setCategory: (category: string) => void
  setActiveTab: (tab: 'photo' | 'layout') => void
  setDragging: (dragging: boolean) => void
  setPaper: (paper: LayoutOptions['paper']) => void
  setGapMm: (gap: number) => void
  setMarginMm: (margin: number) => void
  setCutLines: (cut: boolean) => void
  setCustomWidth: (w: number) => void
  setCustomHeight: (h: number) => void
  setCustomUnit: (unit: 'px' | 'mm') => void
  setDpi: (dpi: number) => void
  setModelInfo: (info: ModelProgress) => void
  setPhotoPreview: (preview: string) => void
  setLayoutPreview: (preview: string) => void
  setLayoutStats: (stats: { count: number; cols: number; rows: number }) => void

  resetAdjustments: () => void
  resetPhoto: () => void
  applyCustomSize: () => void
  processFile: (file: File) => Promise<void>
  useDemo: () => void
  exportPhoto: (format: 'png' | 'jpeg') => Promise<void>
  exportLayout: () => Promise<void>

  // Helpers
  effectiveBackground: () => Background
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      // Image state defaults
      originalUrl: '',
      cutoutUrl: '',
      sourceFile: null,
      hasCutout: false,
      fileName: '',
      sourceMeta: { width: 0, height: 0, size: 0 },
      processing: false,
      progress: 0,
      processNote: '',
      modelInfo: { percent: 0, label: '准备本地人像模型…', status: 'loading' },

      // Adjustment defaults
      size: defaultSize,
      background: backgrounds[1],
      customColor: '#f6d24a',
      scale: 1,
      offsetX: 0,
      offsetY: 0,

      // UI defaults
      showOriginal: false,
      sizeOpen: false,
      search: '',
      category: '普通寸照',
      activeTab: 'photo',
      dragging: false,

      // Layout defaults
      paper: '6inch',
      gapMm: 2,
      marginMm: 5,
      cutLines: true,

      // Preview defaults
      photoPreview: '',
      layoutPreview: '',
      layoutStats: { count: 0, cols: 0, rows: 0 },

      // Records
      records: [],

      // Custom size defaults
      customWidth: 295,
      customHeight: 413,
      customUnit: 'px',
      dpi: 300,

      // Simple setters
      setOriginalUrl: (url) => set({ originalUrl: url }),
      setCutoutUrl: (url) => set({ cutoutUrl: url }),
      setSize: (size) => set({ size }),
      setBackground: (bg) => set({ background: bg }),
      setCustomColor: (color) => set({ customColor: color }),
      setScale: (scale) => set({ scale }),
      setOffsetX: (offsetX) => set({ offsetX }),
      setOffsetY: (offsetY) => set({ offsetY }),
      setShowOriginal: (showOriginal) => set({ showOriginal }),
      setSizeOpen: (sizeOpen) => set({ sizeOpen }),
      setSearch: (search) => set({ search }),
      setCategory: (category) => set({ category }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setDragging: (dragging) => set({ dragging }),
      setPaper: (paper) => set({ paper }),
      setGapMm: (gapMm) => set({ gapMm }),
      setMarginMm: (marginMm) => set({ marginMm }),
      setCutLines: (cutLines) => set({ cutLines }),
      setCustomWidth: (customWidth) => set({ customWidth }),
      setCustomHeight: (customHeight) => set({ customHeight }),
      setCustomUnit: (customUnit) => set({ customUnit }),
      setDpi: (dpi) => set({ dpi }),
      setModelInfo: (modelInfo) => set({ modelInfo }),
      setPhotoPreview: (photoPreview) => set({ photoPreview }),
      setLayoutPreview: (layoutPreview) => set({ layoutPreview }),
      setLayoutStats: (layoutStats) => set({ layoutStats }),

      effectiveBackground: () => {
        const { background, customColor } = get()
        if (background.id !== 'custom') return background
        return { id: 'custom', label: '自定义', css: customColor, value: customColor, kind: 'solid' as const }
      },

      resetAdjustments: () => set({ scale: 1, offsetX: 0, offsetY: 0 }),

      resetPhoto: () => {
        const state = get()
        const urls = new Set([state.originalUrl, state.cutoutUrl])
        urls.forEach((url) => {
          if (url.startsWith('blob:')) URL.revokeObjectURL(url)
        })
        set({
          originalUrl: '',
          cutoutUrl: '',
          sourceFile: null,
          hasCutout: false,
          fileName: '',
          sourceMeta: { width: 0, height: 0, size: 0 },
          processing: false,
          progress: 0,
          processNote: '',
          showOriginal: false,
          activeTab: 'photo',
          photoPreview: '',
          layoutPreview: '',
          layoutStats: { count: 0, cols: 0, rows: 0 },
        })
      },

      applyCustomSize: () => {
        const { customWidth, customHeight, customUnit, dpi } = get()
        const safeDpi = Math.round(clampNumber(dpi, 72, 600))
        const maxDimension = customUnit === 'px' ? 6000 : 500
        const safeWidth = clampNumber(customWidth, 1, maxDimension)
        const safeHeight = clampNumber(customHeight, 1, maxDimension)
        const pxWidth = customUnit === 'px'
          ? Math.round(safeWidth)
          : Math.max(1, Math.round((safeWidth * safeDpi) / 25.4))
        const pxHeight = customUnit === 'px'
          ? Math.round(safeHeight)
          : Math.max(1, Math.round((safeHeight * safeDpi) / 25.4))
        const widthMm = customUnit === 'mm'
          ? safeWidth
          : Number(((pxWidth / safeDpi) * 25.4).toFixed(1))
        const heightMm = customUnit === 'mm'
          ? safeHeight
          : Number(((pxHeight / safeDpi) * 25.4).toFixed(1))
        set({
          customWidth: safeWidth,
          customHeight: safeHeight,
          dpi: safeDpi,
          size: { id: 'custom', name: '自定义尺寸', width: pxWidth, height: pxHeight, widthMm, heightMm, category: '其他' },
          sizeOpen: false,
        })
      },

      processFile: async (file: File) => {
        const state = get()
        if (!file.type.startsWith('image/')) {
          set({ processNote: '请选择 JPG、PNG 或 WebP 图片' })
          return
        }
        if (file.size > 20 * 1024 * 1024) {
          set({ processNote: '图片不能超过 20MB' })
          return
        }

        // Revoke previous blob URLs
        if (state.originalUrl.startsWith('blob:')) URL.revokeObjectURL(state.originalUrl)
        if (state.cutoutUrl.startsWith('blob:')) URL.revokeObjectURL(state.cutoutUrl)

        const source = URL.createObjectURL(file)
        set({
          originalUrl: source,
          cutoutUrl: '',
          sourceFile: file,
          hasCutout: false,
          fileName: file.name,
          photoPreview: '',
          layoutPreview: '',
          layoutStats: { count: 0, cols: 0, rows: 0 },
          processing: true,
          progress: Math.max(1, state.modelInfo.percent),
          processNote: state.modelInfo.status === 'ready'
            ? '正在本地识别人像边缘…'
            : '正在准备本地轻量人像模型…',
        })

        // Inspect image metadata
        const image = new Image()
        image.onload = () => set({ sourceMeta: { width: image.naturalWidth, height: image.naturalHeight, size: file.size } })
        image.src = source

        const unsubscribe = subscribeModelProgress((info) => {
          set({ progress: info.percent, processNote: info.label })
        })

        let timeoutTimer = 0
        try {
          const removalTask = removePhotoBackground(file)
          const timeoutTask = new Promise<Blob>((_, reject) => {
            timeoutTimer = window.setTimeout(() => reject(new Error('MODEL_TIMEOUT')), 90000)
          })
          const rawBlob = await Promise.race([removalTask, timeoutTask])
          set({ processNote: '正在保护浅色衣物细节…' })
          const blob = await preserveLightClothing(file, rawBlob)
          set({
            cutoutUrl: URL.createObjectURL(blob),
            hasCutout: true,
            progress: 100,
            processNote: '人像识别完成，底色与尺寸调整已生效',
          })
        } catch (error) {
          const modelTimedOut = error instanceof Error && error.message === 'MODEL_TIMEOUT'
          if (!modelTimedOut) console.error(error)
          set({
            cutoutUrl: source,
            hasCutout: false,
            progress: 100,
            processNote: modelTimedOut
              ? '人像处理超时：尺寸裁切仍可用，换底色需重试抠图'
              : '人像抠图失败：尺寸裁切仍可用，换底色需重试抠图',
          })
        } finally {
          window.clearTimeout(timeoutTimer)
          unsubscribe()
          set({ processing: false })
        }
      },

      useDemo: () => {
        const state = get()
        if (state.originalUrl.startsWith('blob:')) URL.revokeObjectURL(state.originalUrl)
        if (state.cutoutUrl.startsWith('blob:')) URL.revokeObjectURL(state.cutoutUrl)
        set({
          originalUrl: '/demo-portrait.svg',
          cutoutUrl: '/demo-portrait.svg',
          sourceFile: null,
          hasCutout: true,
          fileName: '示例人像.svg',
          sourceMeta: { width: 900, height: 1200, size: 0 },
          processNote: '示例已就绪，试试换底色和排版',
          progress: 100,
        })
      },

      exportPhoto: async (format: 'png' | 'jpeg') => {
        const { cutoutUrl, size, background, customColor, scale, offsetX, offsetY, records } = get()
        if (!cutoutUrl) return
        const effectiveBg = background.id === 'custom'
          ? { id: 'custom' as const, label: '自定义', css: customColor, value: customColor, kind: 'solid' as const }
          : background
        const canvas = await renderPhoto({
          sourceUrl: cutoutUrl,
          width: size.width,
          height: size.height,
          background: effectiveBg,
          scale,
          offsetX,
          offsetY,
        })
        const ext = format === 'png' ? 'png' : 'jpg'
        await downloadCanvas(canvas, `照见-${size.name}-${size.width}x${size.height}.${ext}`, format)
        const record: ExportRecord = {
          id: Date.now(),
          name: size.name,
          detail: `${size.width} × ${size.height}px · ${format.toUpperCase()}`,
          time: formatTime(),
          kind: 'photo',
        }
        set({ records: [record, ...records].slice(0, 5) })
      },

      exportLayout: async () => {
        const { cutoutUrl, size, background, customColor, scale, offsetX, offsetY, paper, gapMm, marginMm, cutLines, records } = get()
        if (!cutoutUrl) return
        const effectiveBg = background.id === 'custom'
          ? { id: 'custom' as const, label: '自定义', css: customColor, value: customColor, kind: 'solid' as const }
          : background
        const photoCanvas = await renderPhoto({
          sourceUrl: cutoutUrl,
          width: size.width,
          height: size.height,
          background: effectiveBg,
          scale,
          offsetX,
          offsetY,
        })
        const layout = renderLayout({
          photoCanvas,
          paper,
          widthMm: size.widthMm,
          heightMm: size.heightMm,
          gapMm,
          marginMm,
          cutLines,
        })
        await downloadCanvas(layout.canvas, `照见-${size.name}-${getPaper(paper).label}-排版照.jpg`, 'jpeg')
        const record: ExportRecord = {
          id: Date.now(),
          name: `${size.name}排版照`,
          detail: `${getPaper(paper).label} · ${layout.count} 张 · 300DPI`,
          time: formatTime(),
          kind: 'layout',
        }
        set({ records: [record, ...records].slice(0, 5) })
      },
    }),
    {
      name: 'studio-records',
      partialize: (state) => ({ records: state.records }),
    },
  ),
)
