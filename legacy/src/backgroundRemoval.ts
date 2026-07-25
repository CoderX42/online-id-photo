import type { Config } from '@imgly/background-removal'

export type ModelProgress = {
  percent: number
  label: string
  status: 'loading' | 'ready' | 'error'
}

const MODEL_ASSET_BYTES = 88_152_708 + 11_819_815 + 25_539
const listeners = new Set<(progress: ModelProgress) => void>()
const downloaded = new Map<string, number>()
let preloadPromise: Promise<void> | null = null
let latestProgress: ModelProgress = { percent: 0, label: '等待加载人像模型', status: 'loading' }

function emit(progress: ModelProgress) {
  latestProgress = progress
  listeners.forEach((listener) => listener(progress))
}

function reportProgress(key: string, current: number) {
  if (key.startsWith('fetch:')) {
    downloaded.set(key, current)
    const bytes = [...downloaded.values()].reduce((sum, value) => sum + value, 0)
    emit({
      percent: Math.min(90, Math.round((bytes / MODEL_ASSET_BYTES) * 90)),
      label: key.includes('/models/') ? '正在加载轻量人像模型…' : '正在初始化本地处理引擎…',
      status: 'loading',
    })
    return
  }

  const computeProgress: Record<string, number> = {
    'compute:decode': 92,
    'compute:inference': 95,
    'compute:mask': 98,
    'compute:encode': current >= 4 ? 100 : 99,
  }
  emit({
    percent: computeProgress[key] ?? latestProgress.percent,
    label: key === 'compute:inference' ? '正在识别人像边缘…' : '正在生成透明人像…',
    status: 'loading',
  })
}

function createConfig(): Config {
  return {
    publicPath: new URL('background-removal/', document.baseURI).href,
    model: 'isnet_fp16',
    device: 'cpu',
    progress: reportProgress,
    output: { format: 'image/png', quality: 0.95 },
  }
}

export function subscribeModelProgress(listener: (progress: ModelProgress) => void) {
  listeners.add(listener)
  listener(latestProgress)
  return () => listeners.delete(listener)
}

export async function preloadBackgroundModel() {
  if (preloadPromise) return preloadPromise
  preloadPromise = import('@imgly/background-removal')
    .then(({ preload }) => preload(createConfig()))
    .then(() => emit({ percent: 100, label: '人像模型已就绪', status: 'ready' }))
    .catch((error) => {
      preloadPromise = null
      emit({ percent: 0, label: '人像模型加载失败，可点击重试', status: 'error' })
      throw error
    })
  return preloadPromise
}

export async function removePhotoBackground(file: File) {
  await preloadBackgroundModel()
  const { removeBackground } = await import('@imgly/background-removal')
  const blob = await removeBackground(file, createConfig())
  emit({ percent: 100, label: '人像识别完成', status: 'ready' })
  return blob
}
