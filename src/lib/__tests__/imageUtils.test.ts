import { describe, it, expect } from 'vitest'
import { renderLayout, getPaper, backgrounds } from '@/lib/imageUtils'
import type { LayoutOptions } from '@/lib/imageUtils'

// Mock canvas and document for node environment
class MockCanvas {
  width = 0
  height = 0
  getContext() {
    return {
      fillStyle: '',
      fillRect() {},
      drawImage() {},
      save() {},
      restore() {},
      strokeStyle: '',
      lineWidth: 0,
      setLineDash() {},
      strokeRect() {},
    }
  }
  toDataURL() {
    return 'data:image/png;base64,'
  }
}

// @ts-expect-error - minimal mock
globalThis.document = {
  createElement(tag: string) {
    if (tag === 'canvas') return new MockCanvas() as any
    return {} as any
  },
}

function createMockPhotoCanvas(): HTMLCanvasElement {
  const canvas = new MockCanvas() as unknown as HTMLCanvasElement
  canvas.width = 300
  canvas.height = 400
  return canvas
}

describe('renderLayout', () => {
  it('calculates correct grid for 6-inch paper', () => {
    const photoCanvas = createMockPhotoCanvas()
    const result = renderLayout({
      photoCanvas,
      paper: '6inch',
      widthMm: 25,
      heightMm: 35,
      gapMm: 2,
      marginMm: 5,
      cutLines: false,
    })

    expect(result.count).toBeGreaterThan(0)
    expect(result.cols).toBeGreaterThan(0)
    expect(result.rows).toBeGreaterThan(0)
    expect(result.count).toBe(result.cols * result.rows)
    expect(result.canvas).toBeDefined()
  })

  it('calculates correct grid for 5-inch paper', () => {
    const photoCanvas = createMockPhotoCanvas()
    const result = renderLayout({
      photoCanvas,
      paper: '5inch',
      widthMm: 25,
      heightMm: 35,
      gapMm: 2,
      marginMm: 5,
      cutLines: false,
    })

    expect(result.count).toBeGreaterThan(0)
    expect(result.count).toBe(result.cols * result.rows)
  })

  it('calculates correct grid for A4 paper', () => {
    const photoCanvas = createMockPhotoCanvas()
    const result = renderLayout({
      photoCanvas,
      paper: 'a4',
      widthMm: 25,
      heightMm: 35,
      gapMm: 2,
      marginMm: 5,
      cutLines: false,
    })

    expect(result.count).toBeGreaterThan(0)
    // A4 should fit more photos than 6-inch
    expect(result.count).toBeGreaterThan(4)
  })

  it('handles zero gap and margin', () => {
    const photoCanvas = createMockPhotoCanvas()
    const result = renderLayout({
      photoCanvas,
      paper: '6inch',
      widthMm: 25,
      heightMm: 35,
      gapMm: 0,
      marginMm: 0,
      cutLines: false,
    })

    expect(result.count).toBeGreaterThan(0)
  })

  it('draws cut lines when enabled', () => {
    const photoCanvas = createMockPhotoCanvas()
    const result = renderLayout({
      photoCanvas,
      paper: '6inch',
      widthMm: 25,
      heightMm: 35,
      gapMm: 2,
      marginMm: 5,
      cutLines: true,
    })

    expect(result.canvas).toBeDefined()
  })
})

describe('getPaper', () => {
  it('returns correct dimensions for 6-inch', () => {
    const paper = getPaper('6inch')
    expect(paper.width).toBe(152)
    expect(paper.height).toBe(102)
    expect(paper.label).toBe('6 寸相纸')
  })

  it('returns correct dimensions for 5-inch', () => {
    const paper = getPaper('5inch')
    expect(paper.width).toBe(127)
    expect(paper.height).toBe(89)
  })

  it('returns correct dimensions for A4', () => {
    const paper = getPaper('a4')
    expect(paper.width).toBe(210)
    expect(paper.height).toBe(297)
  })
})

describe('backgrounds', () => {
  it('has 10 entries', () => {
    expect(backgrounds).toHaveLength(10)
  })

  it('has all unique ids', () => {
    const ids = backgrounds.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes all required kinds', () => {
    const kinds = backgrounds.map((b) => b.kind)
    expect(kinds).toContain('solid')
    expect(kinds).toContain('gradient')
    expect(kinds).toContain('transparent')
  })

  it('transparent background has checkerboard css', () => {
    const transparent = backgrounds.find((b) => b.id === 'transparent')
    expect(transparent?.css).toBe('checkerboard')
  })

  it('gradient backgrounds have pipe-separated values', () => {
    const gradients = backgrounds.filter((b) => b.kind === 'gradient')
    for (const g of gradients) {
      expect(g.value).toContain('|')
    }
  })
})
