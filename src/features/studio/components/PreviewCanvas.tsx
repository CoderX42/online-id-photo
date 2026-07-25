'use client'

import { useMemo } from 'react'
import { Eye, FileImage, ImagePlus, LayoutGrid, LoaderCircle } from 'lucide-react'
import { useStudioStore } from '@/features/studio/store'
import { getPaper } from '@/lib/imageUtils'

export default function PreviewCanvas() {
  const originalUrl = useStudioStore((s) => s.originalUrl)
  const cutoutUrl = useStudioStore((s) => s.cutoutUrl)
  const photoPreview = useStudioStore((s) => s.photoPreview)
  const layoutPreview = useStudioStore((s) => s.layoutPreview)
  const layoutStats = useStudioStore((s) => s.layoutStats)
  const activeTab = useStudioStore((s) => s.activeTab)
  const showOriginal = useStudioStore((s) => s.showOriginal)
  const processing = useStudioStore((s) => s.processing)
  const size = useStudioStore((s) => s.size)
  const background = useStudioStore((s) => s.background)
  const customColor = useStudioStore((s) => s.customColor)
  const paper = useStudioStore((s) => s.paper)

  const setActiveTab = useStudioStore((s) => s.setActiveTab)
  const setShowOriginal = useStudioStore((s) => s.setShowOriginal)

  const effectiveBg = background.id === 'custom'
    ? { id: 'custom' as const, label: '自定义', css: customColor, value: customColor, kind: 'solid' as const }
    : background

  const previewBackground = effectiveBg.kind === 'transparent' ? undefined : effectiveBg.css

  const previewMetrics = useMemo(() => {
    const s = Math.min(7, 360 / size.widthMm, 470 / size.heightMm)
    return {
      width: Math.max(96, Math.round(size.widthMm * s)),
      capped: s < 7,
    }
  }, [size])

  const paperMeta = getPaper(paper)
  const previewSource = showOriginal ? originalUrl : photoPreview || cutoutUrl || originalUrl

  return (
    <>
      {/* Toolbar */}
      <div className="preview-toolbar">
        <div className="tabs" role="tablist">
          <button
            className={activeTab === 'photo' ? 'active' : ''}
            onClick={() => setActiveTab('photo')}
            role="tab"
          >
            <FileImage size={17} /> 标准寸照
          </button>
          <button
            className={activeTab === 'layout' ? 'active' : ''}
            onClick={() => setActiveTab('layout')}
            role="tab"
          >
            <LayoutGrid size={17} /> 排版照
          </button>
        </div>
        {originalUrl && activeTab === 'photo' && (
          <button
            className={`compare-btn ${showOriginal ? 'active' : ''}`}
            onClick={() => setShowOriginal(!showOriginal)}
          >
            <Eye size={16} /> {showOriginal ? '查看效果' : '对比原图'}
          </button>
        )}
      </div>

      {/* Canvas area */}
      <div className={`preview-canvas ${activeTab}`}>
        {!originalUrl ? (
          <div className="empty-preview">
            <div className="empty-frame">
              <ImagePlus size={35} />
              <span>预览区</span>
            </div>
            <h3>你的证件照会出现在这里</h3>
            <p>上传一张清晰正面照，背景越简单效果越好</p>
          </div>
        ) : activeTab === 'photo' ? (
          <div
            className="photo-preview-wrap"
            style={{ '--photo-preview-width': `${previewMetrics.width}px` } as React.CSSProperties}
          >
            <div className="ruler top"><span>0</span><span>{size.width}px</span></div>
            <div className="ruler left"><span>0</span><span>{size.height}px</span></div>
            <div
              className={`result-photo ${effectiveBg.kind === 'transparent' ? 'checkerboard' : ''}`}
              style={{ aspectRatio: `${size.width}/${size.height}`, background: previewBackground }}
            >
              {processing && (
                <div className="processing-overlay">
                  <LoaderCircle className="spin" />
                  <span>正在智能抠图</span>
                </div>
              )}
              {!processing && previewSource && (
                <img
                  key={`${size.id}-${effectiveBg.id}-${effectiveBg.value}`}
                  className="result-image"
                  src={previewSource}
                  alt="证件照效果预览"
                />
              )}
              <span className="applied-size">{size.width} × {size.height}px</span>
              <div className="guide-line eye" />
              <div className="guide-line center" />
            </div>
            <div className="preview-caption">
              <strong>{size.name}</strong>
              <span>{size.widthMm} × {size.heightMm}mm · {previewMetrics.capped ? '适应区同比' : '尺寸同比'}</span>
            </div>
          </div>
        ) : (
          <div className="layout-preview-wrap">
            <div className={`paper-preview paper-${paper}`}>
              {layoutPreview && <img src={layoutPreview} alt="排版照效果预览" />}
            </div>
            <div className="layout-caption">
              <strong>{paperMeta.label}</strong>
              <span>{layoutStats.cols} 列 × {layoutStats.rows} 行，共 {layoutStats.count} 张</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
