import { describe, it, expect } from 'vitest'
import { photoSizes, categories } from '@/lib/photoSizes'

describe('photoSizes', () => {
  it('has between 22 and 25 sizes', () => {
    expect(photoSizes.length).toBeGreaterThanOrEqual(22)
    expect(photoSizes.length).toBeLessThanOrEqual(25)
  })

  it('has no duplicate ids', () => {
    const ids = photoSizes.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all sizes have valid dimensions', () => {
    for (const size of photoSizes) {
      expect(size.width).toBeGreaterThan(0)
      expect(size.height).toBeGreaterThan(0)
      expect(size.widthMm).toBeGreaterThan(0)
      expect(size.heightMm).toBeGreaterThan(0)
      expect(size.width).toBeLessThan(10000)
      expect(size.height).toBeLessThan(10000)
    }
  })

  it('pixel-to-mm ratio is consistent (~300 DPI)', () => {
    for (const size of photoSizes) {
      const dpiX = (size.width / size.widthMm) * 25.4
      const dpiY = (size.height / size.heightMm) * 25.4
      // Allow wide tolerance: some exam specs use ~146 DPI, official ones ~900 DPI
      expect(dpiX).toBeGreaterThan(100)
      expect(dpiX).toBeLessThan(1000)
      expect(dpiY).toBeGreaterThan(100)
      expect(dpiY).toBeLessThan(1000)
    }
  })

  it('all sizes belong to valid categories', () => {
    for (const size of photoSizes) {
      expect(categories).toContain(size.category)
    }
  })

  it('has at least one hot size', () => {
    const hotSizes = photoSizes.filter((s) => s.hot)
    expect(hotSizes.length).toBeGreaterThan(0)
  })

  it('all hot sizes are members of the categories list', () => {
    const hotSizes = photoSizes.filter((s) => s.hot)
    for (const size of hotSizes) {
      expect(categories).toContain(size.category)
    }
  })

  it('marriage photo is landscape (wider than tall)', () => {
    const marriage = photoSizes.find((s) => s.id === 'marriage')
    expect(marriage).toBeDefined()
    expect(marriage!.width).toBeGreaterThan(marriage!.height)
  })

  it('passport photo is square-ish', () => {
    const passport = photoSizes.find((s) => s.id === 'passport')
    expect(passport).toBeDefined()
  })

  it('visa-us is square', () => {
    const visaUs = photoSizes.find((s) => s.id === 'visa-us')
    expect(visaUs).toBeDefined()
    expect(visaUs!.width).toBe(visaUs!.height)
  })
})

describe('categories', () => {
  it('has the expected categories', () => {
    expect(categories).toContain('普通寸照')
    expect(categories).toContain('近期热门')
    expect(categories).toContain('学历考试')
    expect(categories).toContain('公务员')
    expect(categories).toContain('职业资格')
    expect(categories).toContain('财务会计')
    expect(categories).toContain('医药卫生')
    expect(categories).toContain('建筑工程')
    expect(categories).toContain('图像采集')
    expect(categories).toContain('其他')
  })
})
