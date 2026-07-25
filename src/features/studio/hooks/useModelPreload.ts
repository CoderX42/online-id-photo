'use client'

import { useEffect } from 'react'
import { preloadBackgroundModel, subscribeModelProgress } from '@/lib/backgroundRemoval'
import { useStudioStore } from '@/features/studio/store'

export function useModelPreload() {
  const setModelInfo = useStudioStore((s) => s.setModelInfo)

  useEffect(() => {
    const unsubscribe = subscribeModelProgress(setModelInfo)
    const startPreload = () => preloadBackgroundModel().catch(() => undefined)

    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const useIdleCallback = typeof idleWindow.requestIdleCallback === 'function'
    const idleId = useIdleCallback
      ? idleWindow.requestIdleCallback(startPreload, { timeout: 1200 })
      : window.setTimeout(startPreload, 500)

    return () => {
      unsubscribe()
      if (useIdleCallback && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId as number)
      } else {
        window.clearTimeout(idleId)
      }
    }
  }, [setModelInfo])
}
