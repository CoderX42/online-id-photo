'use client'

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import '@/features/studio/studio.css'
import { useModelPreload } from '@/features/studio/hooks/useModelPreload'
import { usePreviewRender } from '@/features/studio/hooks/usePreviewRender'
import SizeModal from '@/features/studio/components/SizeModal'
import PayModal from '@/features/studio/components/PayModal'
import { useStudioStore } from '@/features/studio/store'
import { backgrounds, type LayoutOptions } from '@/lib/imageUtils'
import {
  Camera, Check, ChevronDown, Download, FileImage, ImagePlus, Info,
  LayoutGrid, LoaderCircle, Maximize2, Minus, Move, Palette,
  Plus, RefreshCw, RotateCcw, Upload, X,
} from 'lucide-react'
import {
  preloadBackgroundModel,
  subscribeModelProgress,
  type ModelProgress,
} from '@/lib/backgroundRemoval'

type PopoverPosition = {
  bottom: number
  left: number
  ready: boolean
}

function useToolbarPopoverPosition(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  popoverRef: React.RefObject<HTMLDivElement | null>,
) {
  const [position, setPosition] = useState<PopoverPosition>({
    bottom: 0,
    left: 0,
    ready: false,
  })

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const popover = popoverRef.current
    if (!trigger || !popover) return

    const gutter = 12
    const triggerRect = trigger.getBoundingClientRect()
    const popoverRect = popover.getBoundingClientRect()
    const toolbarRect = trigger.closest('.bottom-toolbar')?.getBoundingClientRect()
    const left = Math.min(
      Math.max(gutter, triggerRect.left),
      Math.max(gutter, window.innerWidth - popoverRect.width - gutter),
    )

    setPosition({
      bottom: window.innerHeight - (toolbarRect?.top ?? triggerRect.top) + gutter,
      left,
      ready: true,
    })
  }, [popoverRef, triggerRef])

  useLayoutEffect(() => {
    if (!open) {
      setPosition((current) => current.ready ? { ...current, ready: false } : current)
      return
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  return position
}

export default function StudioPage() {
  useModelPreload()
  usePreviewRender()

  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const bgControlRef = useRef<HTMLDivElement>(null)
  const adjControlRef = useRef<HTMLDivElement>(null)
  const bgTriggerRef = useRef<HTMLButtonElement>(null)
  const adjTriggerRef = useRef<HTMLButtonElement>(null)
  const bgPopoverRef = useRef<HTMLDivElement>(null)
  const adjPopoverRef = useRef<HTMLDivElement>(null)

  // Store
  const originalUrl = useStudioStore((s) => s.originalUrl)
  const cutoutUrl = useStudioStore((s) => s.cutoutUrl)
  const photoPreview = useStudioStore((s) => s.photoPreview)
  const layoutPreview = useStudioStore((s) => s.layoutPreview)
  const layoutStats = useStudioStore((s) => s.layoutStats)
  const processing = useStudioStore((s) => s.processing)
  const progress = useStudioStore((s) => s.progress)
  const processNote = useStudioStore((s) => s.processNote)
  const hasCutout = useStudioStore((s) => s.hasCutout)
  const sourceFile = useStudioStore((s) => s.sourceFile)
  const fileName = useStudioStore((s) => s.fileName)
  const size = useStudioStore((s) => s.size)
  const background = useStudioStore((s) => s.background)
  const customColor = useStudioStore((s) => s.customColor)
  const scale = useStudioStore((s) => s.scale)
  const offsetX = useStudioStore((s) => s.offsetX)
  const offsetY = useStudioStore((s) => s.offsetY)
  const activeTab = useStudioStore((s) => s.activeTab)
  const showOriginal = useStudioStore((s) => s.showOriginal)
  const paper = useStudioStore((s) => s.paper)
  const gapMm = useStudioStore((s) => s.gapMm)
  const marginMm = useStudioStore((s) => s.marginMm)
  const cutLines = useStudioStore((s) => s.cutLines)

  const processFile = useStudioStore((s) => s.processFile)
  const setSizeOpen = useStudioStore((s) => s.setSizeOpen)
  const setBackground = useStudioStore((s) => s.setBackground)
  const setCustomColor = useStudioStore((s) => s.setCustomColor)
  const setScale = useStudioStore((s) => s.setScale)
  const setOffsetX = useStudioStore((s) => s.setOffsetX)
  const setOffsetY = useStudioStore((s) => s.setOffsetY)
  const resetAdjustments = useStudioStore((s) => s.resetAdjustments)
  const setActiveTab = useStudioStore((s) => s.setActiveTab)
  const setShowOriginal = useStudioStore((s) => s.setShowOriginal)
  const setPaper = useStudioStore((s) => s.setPaper)
  const setGapMm = useStudioStore((s) => s.setGapMm)
  const setMarginMm = useStudioStore((s) => s.setMarginMm)
  const setCutLines = useStudioStore((s) => s.setCutLines)
  const exportPhoto = useStudioStore((s) => s.exportPhoto)
  const exportLayout = useStudioStore((s) => s.exportLayout)

  const handlePayAndExport = useCallback((action: () => void) => {
    setPendingExport(() => action)
    setPayOpen(true)
  }, [])
  const resetPhoto = useStudioStore((s) => s.resetPhoto)

  // UI state
  const [bgOpen, setBgOpen] = useState(false)
  const [adjOpen, setAdjOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [pendingExport, setPendingExport] = useState<(() => void) | null>(null)
  const [modelRetrying, setModelRetrying] = useState(false)
  const [modelInfo, setModelInfo] = useState<ModelProgress>({
    percent: 0,
    label: '正在准备本地人像模型…',
    status: 'loading',
  })
  const bgPopoverPosition = useToolbarPopoverPosition(bgOpen, bgTriggerRef, bgPopoverRef)
  const adjPopoverPosition = useToolbarPopoverPosition(adjOpen, adjTriggerRef, adjPopoverRef)

  useEffect(() => {
    const unsub = subscribeModelProgress(setModelInfo)
    return () => { unsub() }
  }, [])

  useEffect(() => {
    if (!bgOpen && !adjOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (bgOpen && !bgControlRef.current?.contains(target)) setBgOpen(false)
      if (adjOpen && !adjControlRef.current?.contains(target)) setAdjOpen(false)
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (bgOpen) {
        setBgOpen(false)
        bgTriggerRef.current?.focus()
      }
      if (adjOpen) {
        setAdjOpen(false)
        adjTriggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [bgOpen, adjOpen])

  const effectiveBg = background.id === 'custom'
    ? { ...background, css: customColor, value: customColor }
    : background
  const previewSource = showOriginal
    ? originalUrl
    : photoPreview || cutoutUrl || originalUrl

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }, [processFile])

  const dropHandler = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0])
  }, [processFile])

  const retryModel = useCallback(async () => {
    setModelRetrying(true)
    try {
      await preloadBackgroundModel()
    } finally {
      setModelRetrying(false)
    }
  }, [])

  return (
    <div className="immersive-studio">
      {/* ===== No photo: upload screen ===== */}
      {!originalUrl ? (
        <div
          className="upload-screen"
          onDragOver={(e) => e.preventDefault()}
          onDrop={dropHandler}
        >
          <div className="upload-center">
            <div className="upload-icon-ring">
              <ImagePlus size={36} />
            </div>
            <h2 className="text-xl font-bold mt-4">拖拽或选择一张正面照</h2>
            <p className="text-sm text-[var(--ink-muted)] mt-1">JPG / PNG / WebP，最大 20MB</p>
            <div className="flex gap-3 mt-6">
              <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()}>
                <Upload size={17} /> 选择照片
              </button>
              <button type="button" className="btn-ghost" onClick={() => cameraRef.current?.click()}>
                <Camera size={17} /> 手机拍摄
              </button>
            </div>
            <div
              className={`model-status-bar mt-6 status-${modelInfo.status}`}
              role="status"
              aria-live="polite"
            >
              {modelInfo.status === 'error' ? (
                <button type="button" onClick={retryModel} disabled={modelRetrying}>
                  <RefreshCw className={modelRetrying ? 'spin' : ''} size={13} />
                  {modelRetrying ? '正在重试人像模型…' : modelInfo.label}
                </button>
              ) : (
                <>
                  <i
                    role="progressbar"
                    aria-label="人像模型加载进度"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={modelInfo.percent}
                  >
                    <em style={{ width: `${modelInfo.percent}%` }} />
                  </i>
                  <span>{modelInfo.label}</span>
                </>
              )}
            </div>
            {processNote && (
              <p className="upload-feedback" role="alert">
                <Info size={13} /> {processNote}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ===== Preview canvas (full viewport) ===== */}
          <div
            className="preview-stage"
            onDragOver={(e) => e.preventDefault()}
            onDrop={dropHandler}
          >
            {/* Processing overlay */}
            {processing && (
              <div className="processing-toast">
                <LoaderCircle className="spin" size={18} />
                <span>{processNote}</span>
                <b>{progress}%</b>
              </div>
            )}

            {/* Photo tab */}
            {activeTab === 'photo' && previewSource && (
              <div className="photo-display">
                <img
                  key={`${size.id}-${effectiveBg.id}-${effectiveBg.value}`}
                  src={previewSource}
                  alt="证件照预览"
                  className={`photo-img ${processing && !cutoutUrl ? 'is-processing-source' : ''}`}
                  style={{
                    aspectRatio: `${size.width}/${size.height}`,
                    background: effectiveBg.kind === 'transparent'
                      ? undefined
                      : effectiveBg.kind === 'gradient'
                        ? effectiveBg.css
                        : effectiveBg.value,
                  }}
                />
                {hasCutout && photoPreview && (
                  <button
                  type="button"
                  className="compare-toggle"
                  onPointerDown={(e) => {
                    (e.target as HTMLElement).setPointerCapture(e.pointerId)
                    setShowOriginal(true)
                  }}
                  onPointerUp={() => setShowOriginal(false)}
                  onPointerCancel={() => setShowOriginal(false)}
                  >
                    按住对比原图
                  </button>
                )}
              </div>
            )}

            {/* Layout tab */}
            {activeTab === 'layout' && layoutPreview && (
              <div className={`layout-display paper-${paper}`}>
                <img src={layoutPreview} alt="排版照预览" />
                <span className="layout-badge">
                  {layoutStats.cols}×{layoutStats.rows} · {layoutStats.count}张 · {paper}
                </span>
              </div>
            )}
            {activeTab === 'layout' && !layoutPreview && (
              <div className="preview-pending" role="status">
                <LoaderCircle className="spin" size={20} />
                <span>{processing ? '完成抠图后将自动生成排版预览' : '正在生成排版预览…'}</span>
              </div>
            )}

            {/* Retry button */}
            {!processing && sourceFile && !hasCutout && (
              <button type="button" className="retry-btn" onClick={() => processFile(sourceFile)}>
                <RefreshCw size={14} /> 重新抠图
              </button>
            )}
          </div>

          {/* ===== Bottom toolbar ===== */}
          <div className="bottom-toolbar">
            {/* Left: controls */}
            <div className="toolbar-left">
              <div className="source-actions">
                <span title={fileName}>{fileName}</span>
                <button type="button" onClick={() => inputRef.current?.click()} aria-label="更换照片" title="更换照片">
                  <Upload size={14} />
                </button>
                <button type="button" onClick={resetPhoto} aria-label="关闭当前照片" title="关闭当前照片">
                  <X size={14} />
                </button>
              </div>
              <div className="tool-divider" />

              {/* Tab switcher */}
              <div className="tool-group">
                <button type="button" className={`tool-btn ${activeTab === 'photo' ? 'active' : ''}`} onClick={() => setActiveTab('photo')}>
                  <FileImage size={16} /> 寸照
                </button>
                <button type="button" className={`tool-btn ${activeTab === 'layout' ? 'active' : ''}`} onClick={() => setActiveTab('layout')}>
                  <LayoutGrid size={16} /> 排版
                </button>
              </div>

              <div className="tool-divider" />

              {/* Size */}
              <button type="button" className="tool-btn" onClick={() => setSizeOpen(true)}>
                {size.name} <ChevronDown size={14} />
              </button>

              {/* Background */}
              <div ref={bgControlRef} className="tool-group relative">
                <button
                  ref={bgTriggerRef}
                  type="button"
                  className="tool-btn"
                  aria-expanded={bgOpen}
                  aria-controls="background-popover"
                  aria-haspopup="dialog"
                  onClick={() => { setBgOpen(!bgOpen); setAdjOpen(false) }}
                >
                  <Palette size={15} /> {background.id === 'custom' ? customColor : background.label}
                </button>
                {bgOpen && (
                  <div
                    ref={bgPopoverRef}
                    id="background-popover"
                    className="tool-popover"
                    role="dialog"
                    aria-label="选择证件照底色"
                    style={{
                      bottom: bgPopoverPosition.bottom,
                      left: bgPopoverPosition.left,
                      visibility: bgPopoverPosition.ready ? 'visible' : 'hidden',
                    }}
                  >
                    <div className="color-grid-popover">
                      {backgrounds.map((b) => (
                        <button
                          type="button"
                          key={b.id}
                          className={`color-dot ${background.id === b.id ? 'selected' : ''} ${b.css === 'checkerboard' ? 'checkerboard' : ''}`}
                          style={b.css === 'checkerboard' ? undefined : { background: b.css }}
                          title={b.label}
                          aria-label={b.label}
                          aria-pressed={background.id === b.id}
                          onClick={() => setBackground(b)}
                        >
                          {background.id === b.id && <Check size={12} />}
                        </button>
                      ))}
                      <label className="color-dot rainbow" title="自定义底色">
                        <input
                          type="color"
                          aria-label="自定义底色"
                          value={customColor}
                          onChange={(e) => { setCustomColor(e.target.value); setBackground({ id: 'custom', label: '自定义', css: e.target.value, value: e.target.value, kind: 'solid' }) }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Adjust */}
              <div ref={adjControlRef} className="tool-group relative">
                <button
                  ref={adjTriggerRef}
                  type="button"
                  className="tool-btn"
                  aria-expanded={adjOpen}
                  aria-controls="adjust-popover"
                  aria-haspopup="dialog"
                  onClick={() => { setAdjOpen(!adjOpen); setBgOpen(false) }}
                >
                  <Maximize2 size={15} /> {Math.round(scale * 100)}%
                </button>
                {adjOpen && (
                  <div
                    ref={adjPopoverRef}
                    id="adjust-popover"
                    className="tool-popover adjust-popover"
                    role="dialog"
                    aria-label="调整人像位置和大小"
                    style={{
                      bottom: adjPopoverPosition.bottom,
                      left: adjPopoverPosition.left,
                      visibility: adjPopoverPosition.ready ? 'visible' : 'hidden',
                    }}
                  >
                    <div className="adjust-row">
                      <span className="adjust-label"><Maximize2 size={13} /> 缩放</span>
                      <input type="range" min={0.3} max={1.5} step={0.01} value={scale} onChange={(e) => setScale(Number(e.target.value))} />
                      <b>{Math.round(scale * 100)}%</b>
                    </div>
                    <div className="adjust-row">
                      <span className="adjust-label"><Move size={13} /> 左右</span>
                      <input type="range" min={-30} max={30} step={1} value={offsetX} onChange={(e) => setOffsetX(Number(e.target.value))} />
                      <b>{offsetX}</b>
                    </div>
                    <div className="adjust-row">
                      <span className="adjust-label"><Move size={13} /> 上下</span>
                      <input type="range" min={-30} max={30} step={1} value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} />
                      <b>{offsetY}</b>
                    </div>
                    <button type="button" className="reset-link" onClick={resetAdjustments}>
                      <RotateCcw size={12} /> 重置
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: export */}
            <div className="toolbar-right">
              {activeTab === 'photo' ? (
                <>
                  <button type="button" className="btn-export" disabled={!cutoutUrl || processing} onClick={() => handlePayAndExport(() => exportPhoto('jpeg'))}>
                    <Download size={16} /> JPG
                  </button>
                  <button type="button" className="btn-export primary" disabled={!cutoutUrl || processing} onClick={() => handlePayAndExport(() => exportPhoto('png'))}>
                    <Download size={16} /> PNG
                  </button>
                </>
              ) : (
                <>
                  <select className="tool-select" value={paper} onChange={(e) => setPaper(e.target.value as LayoutOptions['paper'])}>
                    <option value="6inch">6寸相纸</option>
                    <option value="5inch">5寸相纸</option>
                    <option value="a4">A4相纸</option>
                  </select>
                  <span className="layout-spacer">
                    间距 <b>{gapMm}mm</b>
                    <button type="button" aria-label="减小照片间距" onClick={() => setGapMm(Math.max(0, gapMm - 0.5))}><Minus size={10} /></button>
                    <button type="button" aria-label="增大照片间距" onClick={() => setGapMm(Math.min(10, gapMm + 0.5))}><Plus size={10} /></button>
                  </span>
                  <span className="layout-spacer">
                    页边距 <b>{marginMm}mm</b>
                    <button type="button" aria-label="减小页边距" onClick={() => setMarginMm(Math.max(0, marginMm - 0.5))}><Minus size={10} /></button>
                    <button type="button" aria-label="增大页边距" onClick={() => setMarginMm(Math.min(20, marginMm + 0.5))}><Plus size={10} /></button>
                  </span>
                  <label className="tool-check">
                    <input type="checkbox" checked={cutLines} onChange={(e) => setCutLines(e.target.checked)} />
                    裁切线
                  </label>
                  <button type="button" className="btn-export primary" disabled={!cutoutUrl || processing} onClick={() => handlePayAndExport(() => exportLayout())}>
                    <Download size={16} /> 排版照
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <SizeModal />
      <PayModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onPaid={() => {
          setPayOpen(false)
          pendingExport?.()
          setPendingExport(null)
        }}
      />
      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileInput} />
      <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="user" onChange={onFileInput} />
    </div>
  )
}
