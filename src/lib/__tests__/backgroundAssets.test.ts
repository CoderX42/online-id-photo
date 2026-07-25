import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type ResourceManifest = Record<string, {
  chunks: Array<{ name: string; offsets: [number, number] }>
  size: number
}>

const requiredResources = [
  '/models/isnet_fp16',
  '/onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm',
  '/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs',
  '/onnxruntime-web/ort-wasm-simd-threaded.wasm',
  '/onnxruntime-web/ort-wasm-simd-threaded.mjs',
]

describe('background removal assets', () => {
  it('contains complete local GPU and CPU resources', async () => {
    const assetDir = resolve(process.cwd(), 'public/background-removal')
    const manifest = JSON.parse(
      await readFile(resolve(assetDir, 'resources.json'), 'utf8'),
    ) as ResourceManifest

    expect(Object.keys(manifest)).toEqual(requiredResources)

    for (const key of requiredResources) {
      const resource = manifest[key]
      expect(resource.size).toBeGreaterThan(0)
      expect(resource.chunks.length).toBeGreaterThan(0)

      let assembledSize = 0
      for (const chunk of resource.chunks) {
        const expectedSize = chunk.offsets[1] - chunk.offsets[0]
        const chunkStats = await stat(resolve(assetDir, chunk.name))
        expect(chunkStats.size).toBe(expectedSize)
        assembledSize += chunkStats.size
      }
      expect(assembledSize).toBe(resource.size)
    }
  })
})
