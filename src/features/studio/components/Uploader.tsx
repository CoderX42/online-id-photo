'use client'

import { useRef } from 'react'
import { Upload, Camera, LoaderCircle, BadgeCheck, CircleAlert, RefreshCw } from 'lucide-react'
import { useStudioStore } from '@/features/studio/store'

export default function Uploader({ compact }: { compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const originalUrl = useStudioStore((s) => s.originalUrl)
  const fileName = useStudioStore((s) => s.fileName)
  const sourceMeta = useStudioStore((s) => s.sourceMeta)
  const processing = useStudioStore((s) => s.processing)
  const progress = useStudioStore((s) => s.progress)
  const processNote = useStudioStore((s) => s.processNote)
  const modelInfo = useStudioStore((s) => s.modelInfo)
  const dragging = useStudioStore((s) => s.dragging)
  const sourceFile = useStudioStore((s) => s.sourceFile)
  const hasCutout = useStudioStore((s) => s.hasCutout)

  const setDragging = useStudioStore((s) => s.setDragging)
  const processFile = useStudioStore((s) => s.processFile)

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const uploadZone = (
    <div
      className={`upload-zone ${dragging ? 'is-dragging' : ''}`}
      onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0])
      }}
    >
      <div className="upload-icon"><Upload size={25} /></div>
      <strong>拖拽或选择正面照</strong>
      <span>JPG / PNG / WebP，最大 20MB</span>
      <button onClick={() => inputRef.current?.click()}>选择照片</button>
      <button className="camera-link" onClick={() => cameraRef.current?.click()}>
        <Camera size={15} /> 手机拍摄
      </button>
      <div className={`model-status ${modelInfo.status}`}>
        <i><em style={{ width: `${modelInfo.percent}%` }} /></i>
        <span>{modelInfo.label}</span>
      </div>
    </div>
  )

  const fileInfo = (
    <div className="file-card">
      <img src={originalUrl} alt="原始照片缩略图" />
      <div>
        <strong>{fileName}</strong>
        <span>
          {sourceMeta.width} × {sourceMeta.height}px
          {sourceMeta.size ? ` · ${(sourceMeta.size / 1024 / 1024).toFixed(1)}MB` : ''}
        </span>
      </div>
      {processing ? (
        <LoaderCircle className="spin" size={20} />
      ) : hasCutout ? (
        <BadgeCheck className="success" size={20} />
      ) : (
        <CircleAlert className="warning" size={20} />
      )}
    </div>
  )

  const progressBar = (processing || processNote) ? (
    <div className="progress-card">
      <div>
        <span>{processNote}</span>
        <b>{processing ? `${progress}%` : ''}</b>
      </div>
      <i><em style={{ width: `${progress}%` }} /></i>
      {!processing && sourceFile && !hasCutout && (
        <button className="retry-model" onClick={() => processFile(sourceFile)}>
          <RefreshCw size={13} /> 重新识别人像
        </button>
      )}
    </div>
  ) : null

  // Compact mode: no panel-block wrapper (handled by CollapsibleSection)
  if (compact) {
    return (
      <>
        {!originalUrl ? uploadZone : (
          <>
            {fileInfo}
            <button onClick={() => inputRef.current?.click()} className="mt-2 text-[11px] font-semibold text-[var(--blue)] hover:underline">
              更换照片
            </button>
          </>
        )}
        {progressBar}
        <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} />
        <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={onInput} />
      </>
    )
  }

  return (
    <div className="panel-block">
      <div className="block-title">
        <span className="inline-flex items-center gap-2 font-bold text-sm">
          <Upload size={18} className="text-[var(--blue)]" />
          照片
        </span>
        {originalUrl && (
          <button onClick={() => inputRef.current?.click()} className="text-[var(--blue)] text-xs">
            更换
          </button>
        )}
      </div>
      {!originalUrl ? uploadZone : fileInfo}
      {progressBar}
      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} />
      <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={onInput} />
    </div>
  )
}
