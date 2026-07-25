import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  BadgeCheck,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  Crop,
  Download,
  Eye,
  FileImage,
  Grid3X3,
  ImagePlus,
  LayoutGrid,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  Minus,
  Move,
  Palette,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react'
import {
  preloadBackgroundModel,
  removePhotoBackground,
  subscribeModelProgress,
  type ModelProgress,
} from './backgroundRemoval'
import { categories, photoSizes, type PhotoSize } from './photoSizes'
import {
  backgrounds,
  downloadCanvas,
  getPaper,
  preserveLightClothing,
  renderLayout,
  renderPhoto,
  type Background,
  type LayoutOptions,
} from './imageUtils'

type ExportRecord = {
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

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [originalUrl, setOriginalUrl] = useState<string>('')
  const [cutoutUrl, setCutoutUrl] = useState<string>('')
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [hasCutout, setHasCutout] = useState(false)
  const [fileName, setFileName] = useState('')
  const [sourceMeta, setSourceMeta] = useState({ width: 0, height: 0, size: 0 })
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processNote, setProcessNote] = useState('')
  const [modelInfo, setModelInfo] = useState<ModelProgress>({ percent: 0, label: '准备本地人像模型…', status: 'loading' })
  const [dragging, setDragging] = useState(false)
  const [size, setSize] = useState<PhotoSize>(defaultSize)
  const [background, setBackground] = useState<Background>(backgrounds[1])
  const [customColor, setCustomColor] = useState('#f6d24a')
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [showOriginal, setShowOriginal] = useState(false)
  const [sizeOpen, setSizeOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('普通寸照')
  const [customWidth, setCustomWidth] = useState(295)
  const [customHeight, setCustomHeight] = useState(413)
  const [customUnit, setCustomUnit] = useState<'px' | 'mm'>('px')
  const [dpi, setDpi] = useState(300)
  const [paper, setPaper] = useState<LayoutOptions['paper']>('6inch')
  const [gapMm, setGapMm] = useState(2)
  const [marginMm, setMarginMm] = useState(5)
  const [cutLines, setCutLines] = useState(true)
  const [photoPreview, setPhotoPreview] = useState('')
  const [layoutPreview, setLayoutPreview] = useState('')
  const [layoutStats, setLayoutStats] = useState({ count: 0, cols: 0, rows: 0 })
  const [activeTab, setActiveTab] = useState<'photo' | 'layout'>('photo')
  const [records, setRecords] = useState<ExportRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('photo-export-records') || '[]')
    } catch {
      return []
    }
  })

  const effectiveBackground = useMemo<Background>(() => {
    if (background.id !== 'custom') return background
    return { id: 'custom', label: '自定义', css: customColor, value: customColor, kind: 'solid' }
  }, [background, customColor])

  const filteredSizes = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return photoSizes.filter((item) => {
      const categoryMatch = category === '近期热门' ? item.hot : item.category === category
      const searchMatch = !keyword || `${item.name}${item.width}x${item.height}${item.widthMm}x${item.heightMm}`.toLowerCase().includes(keyword)
      return search ? searchMatch : categoryMatch
    })
  }, [category, search])

  const previewBackground = effectiveBackground.kind === 'transparent' ? undefined : effectiveBackground.css
  const previewMetrics = useMemo(() => {
    const scale = Math.min(7, 360 / size.widthMm, 470 / size.heightMm)
    return {
      width: Math.max(96, Math.round(size.widthMm * scale)),
      capped: scale < 7,
    }
  }, [size])

  useEffect(() => {
    const unsubscribe = subscribeModelProgress(setModelInfo)
    const startPreload = () => preloadBackgroundModel().catch(() => undefined)
    const idleWindow = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    const useIdleCallback = typeof idleWindow.requestIdleCallback === 'function'
    const idleId = useIdleCallback
      ? idleWindow.requestIdleCallback(startPreload, { timeout: 1200 })
      : window.setTimeout(startPreload, 500)
    return () => {
      unsubscribe()
      if (useIdleCallback && idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(idleId)
      else window.clearTimeout(idleId)
    }
  }, [])

  useEffect(() => {
    if (!cutoutUrl) {
      setPhotoPreview('')
      setLayoutPreview('')
      return
    }
    let cancelled = false
    let photoUrl = ''
    let sheetUrl = ''
    const update = async () => {
      try {
        const photoCanvas = await renderPhoto({
          sourceUrl: cutoutUrl,
          width: size.width,
          height: size.height,
          background: effectiveBackground,
          scale,
          offsetX,
          offsetY,
        })
        photoUrl = photoCanvas.toDataURL('image/png')
        const layout = renderLayout({
          photoCanvas,
          paper,
          widthMm: size.widthMm,
          heightMm: size.heightMm,
          gapMm,
          marginMm,
          cutLines,
        })
        sheetUrl = layout.canvas.toDataURL('image/jpeg', 0.9)
        if (!cancelled) {
          setPhotoPreview(photoUrl)
          setLayoutPreview(sheetUrl)
          setLayoutStats({ count: layout.count, cols: layout.cols, rows: layout.rows })
        }
      } catch {
        if (!cancelled) setProcessNote('预览生成失败，请重新上传照片')
      }
    }
    update()
    return () => {
      cancelled = true
    }
  }, [cutoutUrl, size, effectiveBackground, scale, offsetX, offsetY, paper, gapMm, marginMm, cutLines])

  const addRecord = (record: Omit<ExportRecord, 'id' | 'time'>) => {
    const next = [{ ...record, id: Date.now(), time: formatTime() }, ...records].slice(0, 5)
    setRecords(next)
    localStorage.setItem('photo-export-records', JSON.stringify(next))
  }

  const inspectImage = (url: string, file: File) => {
    const image = new Image()
    image.onload = () => setSourceMeta({ width: image.naturalWidth, height: image.naturalHeight, size: file.size })
    image.src = url
  }

  const processFile = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setProcessNote('请选择 JPG、PNG 或 WebP 图片')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setProcessNote('图片不能超过 20MB')
      return
    }
    if (originalUrl.startsWith('blob:')) URL.revokeObjectURL(originalUrl)
    if (cutoutUrl.startsWith('blob:')) URL.revokeObjectURL(cutoutUrl)
    const source = URL.createObjectURL(file)
    setOriginalUrl(source)
    setCutoutUrl('')
    setSourceFile(file)
    setHasCutout(false)
    setFileName(file.name)
    inspectImage(source, file)
    setProcessing(true)
    setProgress(Math.max(1, modelInfo.percent))
    setProcessNote(modelInfo.status === 'ready' ? '正在本地识别人像边缘…' : '正在准备本地轻量人像模型…')

    const unsubscribe = subscribeModelProgress((info) => {
      setProgress(info.percent)
      setProcessNote(info.label)
    })
    let timeoutTimer = 0
    try {
      const removalTask = removePhotoBackground(file)
      const timeoutTask = new Promise<Blob>((_, reject) => {
        timeoutTimer = window.setTimeout(() => reject(new Error('MODEL_TIMEOUT')), 90000)
      })
      const rawBlob = await Promise.race([removalTask, timeoutTask])
      setProcessNote('正在保护浅色衣物细节…')
      const blob = await preserveLightClothing(file, rawBlob)
      setCutoutUrl(URL.createObjectURL(blob))
      setHasCutout(true)
      setProgress(100)
      setProcessNote('人像识别完成，底色与尺寸调整已生效')
    } catch (error) {
      const modelTimedOut = error instanceof Error && error.message === 'MODEL_TIMEOUT'
      if (!modelTimedOut) console.error(error)
      setCutoutUrl(source)
      setHasCutout(false)
      setProgress(100)
      setProcessNote(modelTimedOut
        ? '人像处理超时：尺寸裁切仍可用，换底色需重试抠图'
        : '人像抠图失败：尺寸裁切仍可用，换底色需重试抠图')
    } finally {
      window.clearTimeout(timeoutTimer)
      unsubscribe()
      setProcessing(false)
    }
  }

  const useDemo = () => {
    if (originalUrl.startsWith('blob:')) URL.revokeObjectURL(originalUrl)
    if (cutoutUrl.startsWith('blob:')) URL.revokeObjectURL(cutoutUrl)
    setOriginalUrl('/demo-portrait.svg')
    setCutoutUrl('/demo-portrait.svg')
    setSourceFile(null)
    setHasCutout(true)
    setFileName('示例人像.svg')
    setSourceMeta({ width: 900, height: 1200, size: 0 })
    setProcessNote('示例已就绪，试试换底色和排版')
    setProgress(100)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    processFile(event.dataTransfer.files[0])
  }

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0])
    event.target.value = ''
  }

  const resetAdjustments = () => {
    setScale(1)
    setOffsetX(0)
    setOffsetY(0)
  }

  const applyCustomSize = () => {
    const safeDpi = Math.round(clampNumber(dpi, 72, 600))
    const maxDimension = customUnit === 'px' ? 6000 : 500
    const safeWidth = clampNumber(customWidth, 1, maxDimension)
    const safeHeight = clampNumber(customHeight, 1, maxDimension)
    const pxWidth = customUnit === 'px' ? Math.round(safeWidth) : Math.max(1, Math.round((safeWidth * safeDpi) / 25.4))
    const pxHeight = customUnit === 'px' ? Math.round(safeHeight) : Math.max(1, Math.round((safeHeight * safeDpi) / 25.4))
    const widthMm = customUnit === 'mm' ? safeWidth : Number(((pxWidth / safeDpi) * 25.4).toFixed(1))
    const heightMm = customUnit === 'mm' ? safeHeight : Number(((pxHeight / safeDpi) * 25.4).toFixed(1))
    setCustomWidth(safeWidth)
    setCustomHeight(safeHeight)
    setDpi(safeDpi)
    setSize({ id: 'custom', name: '自定义尺寸', width: pxWidth, height: pxHeight, widthMm, heightMm, category: '其他' })
    setSizeOpen(false)
  }

  const exportPhoto = async (format: 'png' | 'jpeg') => {
    if (!cutoutUrl) return
    const canvas = await renderPhoto({
      sourceUrl: cutoutUrl,
      width: size.width,
      height: size.height,
      background: effectiveBackground,
      scale,
      offsetX,
      offsetY,
    })
    await downloadCanvas(canvas, `照见-${size.name}-${size.width}x${size.height}.${format === 'png' ? 'png' : 'jpg'}`, format)
    addRecord({ name: size.name, detail: `${size.width} × ${size.height}px · ${format.toUpperCase()}`, kind: 'photo' })
  }

  const exportLayout = async () => {
    if (!cutoutUrl) return
    const photoCanvas = await renderPhoto({
      sourceUrl: cutoutUrl,
      width: size.width,
      height: size.height,
      background: effectiveBackground,
      scale,
      offsetX,
      offsetY,
    })
    const layout = renderLayout({ photoCanvas, paper, widthMm: size.widthMm, heightMm: size.heightMm, gapMm, marginMm, cutLines })
    await downloadCanvas(layout.canvas, `照见-${size.name}-${getPaper(paper).label}-排版照.jpg`, 'jpeg')
    addRecord({ name: `${size.name}排版照`, detail: `${getPaper(paper).label} · ${layout.count} 张 · 300DPI`, kind: 'layout' })
  }

  const customBackground: Background = { id: 'custom', label: '自定义', css: customColor, value: customColor, kind: 'solid' }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="照见首页">
          <span className="brand-mark"><Crop size={23} strokeWidth={2.4} /></span>
          <span>照见</span>
          <em>PHOTO LAB</em>
        </a>
        <nav aria-label="主导航">
          <a className="active" href="#studio">在线制作</a>
          <a href="#sizes">尺寸大全</a>
          <a href="#guide">拍摄指南</a>
        </nav>
        <div className="privacy-chip"><LockKeyhole size={15} /> 照片仅在本机处理</div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> 免费 · 无水印 · 无需登录</div>
            <h1>一张照片，<br /><span>所有证件尺寸。</span></h1>
            <p>智能抠图、自然换底、精准裁切，再自动排成可冲印相纸。整个过程都在你的浏览器里完成。</p>
            <div className="hero-actions">
              <button className="primary-btn" onClick={() => inputRef.current?.click()}><Upload size={18} /> 上传照片制作</button>
              <button className="text-btn" onClick={useDemo}><Eye size={18} /> 先用示例体验</button>
            </div>
            <div className="trust-row">
              <span><Check /> 本地处理</span>
              <span><Check /> 标准 300DPI</span>
              <span><Check /> 支持排版照</span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="photo-stack photo-back"><span>35 × 49</span></div>
            <div className="photo-stack photo-front">
              <img src="/demo-portrait.svg" alt="" />
              <div className="scan-line" />
            </div>
            <div className="color-orbit"><i /><i /><i /></div>
            <div className="hero-note"><WandSparkles size={17} /> 智能识别人像</div>
          </div>
        </section>

        <section id="studio" className="studio-section">
          <div className="section-heading">
            <span className="step-number">01</span>
            <div><p>PHOTO STUDIO</p><h2>在线证件照工作台</h2></div>
            <span className="section-hint">上传一次，即时预览所有效果</span>
          </div>

          <div className="studio-grid">
            <aside className="control-panel">
              <div className="panel-block">
                <div className="block-title"><span><ImagePlus size={18} /> 照片</span>{originalUrl && <button onClick={() => inputRef.current?.click()}>更换</button>}</div>
                {!originalUrl ? (
                  <div
                    className={`upload-zone ${dragging ? 'is-dragging' : ''}`}
                    onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                  >
                    <div className="upload-icon"><Upload size={25} /></div>
                    <strong>拖拽或选择正面照</strong>
                    <span>JPG / PNG / WebP，最大 20MB</span>
                    <button onClick={() => inputRef.current?.click()}>选择照片</button>
                    <button className="camera-link" onClick={() => cameraRef.current?.click()}><Camera size={15} /> 手机拍摄</button>
                    <div className={`model-status ${modelInfo.status}`}><i><em style={{ width: `${modelInfo.percent}%` }} /></i><span>{modelInfo.label}</span></div>
                  </div>
                ) : (
                  <div className="file-card">
                    <img src={originalUrl} alt="原始照片缩略图" />
                    <div><strong>{fileName}</strong><span>{sourceMeta.width} × {sourceMeta.height}px {sourceMeta.size ? `· ${(sourceMeta.size / 1024 / 1024).toFixed(1)}MB` : ''}</span></div>
                    {processing ? <LoaderCircle className="spin" size={20} /> : hasCutout ? <BadgeCheck className="success" size={20} /> : <CircleAlert className="warning" size={20} />}
                  </div>
                )}
                {(processing || processNote) && (
                  <div className="progress-card">
                    <div><span>{processNote}</span><b>{processing ? `${progress}%` : ''}</b></div>
                    <i><em style={{ width: `${progress}%` }} /></i>
                    {!processing && sourceFile && !hasCutout && <button className="retry-model" onClick={() => processFile(sourceFile)}><RefreshCw size={13} /> 重新识别人像</button>}
                  </div>
                )}
              </div>

              <div className="panel-block">
                <div className="block-title"><span><Maximize2 size={18} /> 照片尺寸</span></div>
                <button className="size-picker" onClick={() => setSizeOpen(true)} data-testid="size-picker">
                  <span><strong>{size.name}</strong><small>{size.width} × {size.height}px · {size.widthMm} × {size.heightMm}mm</small></span>
                  <ChevronRight size={19} />
                </button>
              </div>

              <div className={`panel-block ${originalUrl && !hasCutout ? 'color-unavailable' : ''}`} id="colors">
                <div className="block-title"><span><Palette size={18} /> 照片底色</span><small>{effectiveBackground.label}</small></div>
                <div className="color-grid" role="list" aria-label="照片底色">
                  {backgrounds.map((item) => (
                    <button
                      key={item.id}
                      className={`color-swatch ${background.id === item.id ? 'selected' : ''} ${item.css === 'checkerboard' ? 'checkerboard' : ''}`}
                      style={item.css === 'checkerboard' ? undefined : { background: item.css }}
                      title={item.label}
                      aria-label={item.label}
                      disabled={Boolean(originalUrl && !hasCutout)}
                      onClick={() => setBackground(item)}
                    >{background.id === item.id && <Check size={17} />}</button>
                  ))}
                  <label className={`color-swatch rainbow ${background.id === 'custom' ? 'selected' : ''}`} title="自定义颜色">
                    <input type="color" disabled={Boolean(originalUrl && !hasCutout)} value={customColor} onChange={(event) => { setCustomColor(event.target.value); setBackground(customBackground) }} />
                    {background.id === 'custom' && <Check size={17} />}
                  </label>
                </div>
                {originalUrl && !hasCutout && <div className="color-lock-note"><CircleAlert size={14} /> 完成人像识别后即可更换底色</div>}
              </div>

              <div className="panel-block">
                <div className="block-title"><span><SlidersHorizontal size={18} /> 人像微调</span><button onClick={resetAdjustments}><RotateCcw size={14} /> 重置</button></div>
                <RangeControl icon={<Maximize2 />} label="缩放" value={scale} min={0.72} max={1.5} step={0.01} onChange={setScale} display={`${Math.round(scale * 100)}%`} />
                <RangeControl icon={<Move />} label="左右" value={offsetX} min={-30} max={30} step={1} onChange={setOffsetX} display={`${offsetX}`} />
                <RangeControl icon={<Move />} label="上下" value={offsetY} min={-30} max={30} step={1} onChange={setOffsetY} display={`${offsetY}`} />
              </div>
            </aside>

            <section className="preview-panel">
              <div className="preview-toolbar">
                <div className="tabs" role="tablist">
                  <button className={activeTab === 'photo' ? 'active' : ''} onClick={() => setActiveTab('photo')} role="tab"><FileImage size={17} /> 标准寸照</button>
                  <button className={activeTab === 'layout' ? 'active' : ''} onClick={() => setActiveTab('layout')} role="tab"><LayoutGrid size={17} /> 排版照</button>
                </div>
                {originalUrl && activeTab === 'photo' && <button className={`compare-btn ${showOriginal ? 'active' : ''}`} onClick={() => setShowOriginal(!showOriginal)}><Eye size={16} /> {showOriginal ? '查看效果' : '对比原图'}</button>}
              </div>

              <div className={`preview-canvas ${activeTab}`} data-testid="preview-area">
                {!originalUrl ? (
                  <div className="empty-preview">
                    <div className="empty-frame"><ImagePlus size={35} /><span>预览区</span></div>
                    <h3>你的证件照会出现在这里</h3>
                    <p>上传一张清晰正面照，背景越简单效果越好</p>
                    <button onClick={useDemo}>使用示例照片</button>
                  </div>
                ) : activeTab === 'photo' ? (
                  <div
                    className="photo-preview-wrap"
                    style={{ '--photo-preview-width': `${previewMetrics.width}px` } as React.CSSProperties}
                  >
                    <div className="ruler top"><span>0</span><span>{size.width}px</span></div>
                    <div className="ruler left"><span>0</span><span>{size.height}px</span></div>
                    <div
                      className={`result-photo ${effectiveBackground.kind === 'transparent' ? 'checkerboard' : ''}`}
                      style={{ aspectRatio: `${size.width}/${size.height}`, background: previewBackground }}
                      data-testid="result-photo"
                    >
                      {processing && <div className="processing-overlay"><LoaderCircle className="spin" /><span>正在智能抠图</span></div>}
                      {!processing && <img key={`${size.id}-${effectiveBackground.id}-${effectiveBackground.value}`} className="result-image" src={showOriginal ? originalUrl : photoPreview || cutoutUrl} alt="证件照效果预览" />}
                      <span className="applied-size">{size.width} × {size.height}px</span>
                      <div className="guide-line eye" /><div className="guide-line center" />
                    </div>
                    <div className="preview-caption"><strong>{size.name}</strong><span>{size.widthMm} × {size.heightMm}mm · {previewMetrics.capped ? '适应区同比' : '尺寸同比'}</span></div>
                  </div>
                ) : (
                  <div className="layout-preview-wrap">
                    <div className={`paper-preview paper-${paper}`}>
                      {layoutPreview && <img src={layoutPreview} alt="排版照效果预览" />}
                    </div>
                    <div className="layout-caption"><strong>{getPaper(paper).label}</strong><span>{layoutStats.cols} 列 × {layoutStats.rows} 行，共 {layoutStats.count} 张</span></div>
                  </div>
                )}
              </div>

              {activeTab === 'photo' ? (
                <div className="export-bar">
                  <div><ShieldCheck size={20} /><span><strong>高清无水印</strong><small>按所选像素与 300DPI 导出</small></span></div>
                  <div className="export-actions">
                    <button disabled={!cutoutUrl || processing} onClick={() => exportPhoto('jpeg')}><Download size={17} /> 下载 JPG</button>
                    <button className="dark" disabled={!cutoutUrl || processing} onClick={() => exportPhoto('png')}><ArrowDownToLine size={17} /> 下载 PNG</button>
                  </div>
                </div>
              ) : (
                <div className="layout-controls">
                  <div className="control-row">
                    <label>相纸尺寸<select value={paper} onChange={(e) => setPaper(e.target.value as LayoutOptions['paper'])}><option value="6inch">6 寸（152×102mm）</option><option value="5inch">5 寸（127×89mm）</option><option value="a4">A4（210×297mm）</option></select></label>
                    <label>照片间距<div className="number-stepper"><button onClick={() => setGapMm(Math.max(0, gapMm - 0.5))}><Minus /></button><span>{gapMm} mm</span><button onClick={() => setGapMm(Math.min(10, gapMm + 0.5))}><Plus /></button></div></label>
                    <label>页边距<div className="number-stepper"><button onClick={() => setMarginMm(Math.max(0, marginMm - 1))}><Minus /></button><span>{marginMm} mm</span><button onClick={() => setMarginMm(Math.min(20, marginMm + 1))}><Plus /></button></div></label>
                    <label className="switch-label"><input type="checkbox" checked={cutLines} onChange={(e) => setCutLines(e.target.checked)} /><i /> 显示裁切线</label>
                  </div>
                  <button className="layout-download" disabled={!cutoutUrl || processing} onClick={exportLayout}><Printer size={18} /> 下载高清排版照 <small>300DPI · JPG</small></button>
                </div>
              )}
            </section>
          </div>
        </section>

        <section id="guide" className="guide-section">
          <div className="guide-intro"><span className="step-number">02</span><p>GOOD TO KNOW</p><h2>拍对了，成片会更自然</h2><p>不用专业设备，靠近窗边，用手机后置摄像头就足够。</p></div>
          <div className="guide-cards">
            <article><span>01</span><div className="guide-illustration face"><i /><b /></div><h3>正对镜头</h3><p>抬头挺胸，双肩自然放平，露出眉毛与耳朵。</p></article>
            <article><span>02</span><div className="guide-illustration light"><i /><b /></div><h3>光线均匀</h3><p>面向窗户拍摄，避开顶光、强阴影和过度美颜。</p></article>
            <article><span>03</span><div className="guide-illustration space"><i /><b /></div><h3>留足空间</h3><p>拍到胸口以下，头顶留白，方便适配不同尺寸。</p></article>
          </div>
        </section>

        {records.length > 0 && (
          <section className="records-section">
            <div><p>RECENT EXPORTS</p><h2>本次导出记录</h2><span>仅保存文件信息，不保存照片</span></div>
            <div className="records-list">
              {records.map((record) => <article key={record.id}>{record.kind === 'photo' ? <FileImage /> : <Grid3X3 />}<span><strong>{record.name}</strong><small>{record.detail}</small></span><time>{record.time}</time></article>)}
            </div>
          </section>
        )}
      </main>

      <footer>
        <div className="brand"><span className="brand-mark"><Crop size={21} /></span><span>照见</span></div>
        <p>让每一张证件照，都合规也好看。</p>
        <span><LockKeyhole size={14} /> 所有图像处理均在本地完成</span>
      </footer>

      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} />
      <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={onInput} />

      {sizeOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSizeOpen(false)}>
          <div className="size-modal" role="dialog" aria-modal="true" aria-labelledby="size-title">
            <div className="modal-header"><div><p>SIZE LIBRARY</p><h2 id="size-title">选择照片尺寸</h2></div><button aria-label="关闭尺寸面板" onClick={() => setSizeOpen(false)}><X /></button></div>
            <div className="custom-size-card">
              <div className="custom-heading"><span><Settings2 size={17} /> 自定义尺寸</span><div className="unit-tabs"><button className={customUnit === 'px' ? 'active' : ''} onClick={() => setCustomUnit('px')}>像素</button><button className={customUnit === 'mm' ? 'active' : ''} onClick={() => setCustomUnit('mm')}>毫米</button></div></div>
              <div className="custom-inputs"><label><span>宽度</span><input type="number" min="1" max={customUnit === 'px' ? 6000 : 500} value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} /></label><b>×</b><label><span>高度</span><input type="number" min="1" max={customUnit === 'px' ? 6000 : 500} value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} /></label>{customUnit === 'mm' && <label><span>DPI</span><input type="number" min="72" max="600" value={dpi} onChange={(e) => setDpi(Number(e.target.value))} /></label>}<button onClick={applyCustomSize}>应用尺寸</button></div>
            </div>
            <div className="size-search"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索名称、像素或毫米尺寸" /></div>
            {!search && <div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>}
            <div className="size-results" id="sizes">
              {filteredSizes.map((item) => (
                <button key={item.id} className={size.id === item.id ? 'selected' : ''} onClick={() => { setSize(item); setSizeOpen(false) }}>
                  <span><strong>{item.name}</strong>{item.hot && <em>热门</em>}</span>
                  <small>{item.width} × {item.height}px</small><small>{item.widthMm} × {item.heightMm}mm</small>
                  {size.id === item.id && <Check className="selected-check" size={17} />}
                </button>
              ))}
              {filteredSizes.length === 0 && <div className="no-results"><Search /><strong>没有找到匹配尺寸</strong><span>可以在上方创建自定义尺寸</span></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type RangeControlProps = {
  icon: React.ReactNode
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
}

function RangeControl({ icon, label, value, min, max, step, display, onChange }: RangeControlProps) {
  const percentage = ((value - min) / (max - min)) * 100
  return (
    <label className="range-control">
      <span className="range-label">{icon}<span>{label}</span><b>{display}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ '--range-progress': `${percentage}%` } as React.CSSProperties} />
    </label>
  )
}

export default App
