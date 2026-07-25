'use client'

import { Check, Search, Settings2, X } from 'lucide-react'
import { useMemo } from 'react'
import { categories, photoSizes } from '@/lib/photoSizes'
import { useStudioStore } from '@/features/studio/store'

export default function SizeModal() {
  const sizeOpen = useStudioStore((s) => s.sizeOpen)
  const size = useStudioStore((s) => s.size)
  const search = useStudioStore((s) => s.search)
  const category = useStudioStore((s) => s.category)
  const customWidth = useStudioStore((s) => s.customWidth)
  const customHeight = useStudioStore((s) => s.customHeight)
  const customUnit = useStudioStore((s) => s.customUnit)
  const dpi = useStudioStore((s) => s.dpi)

  const setSizeOpen = useStudioStore((s) => s.setSizeOpen)
  const setSize = useStudioStore((s) => s.setSize)
  const setSearch = useStudioStore((s) => s.setSearch)
  const setCategory = useStudioStore((s) => s.setCategory)
  const setCustomWidth = useStudioStore((s) => s.setCustomWidth)
  const setCustomHeight = useStudioStore((s) => s.setCustomHeight)
  const setCustomUnit = useStudioStore((s) => s.setCustomUnit)
  const setDpi = useStudioStore((s) => s.setDpi)
  const applyCustomSize = useStudioStore((s) => s.applyCustomSize)

  const filteredSizes = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return photoSizes.filter((item) => {
      const categoryMatch = category === '近期热门' ? item.hot : item.category === category
      const searchMatch = !keyword || `${item.name}${item.width}x${item.height}${item.widthMm}x${item.heightMm}`.toLowerCase().includes(keyword)
      return search ? searchMatch : categoryMatch
    })
  }, [category, search])

  if (!sizeOpen) return null

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSizeOpen(false)}>
      <div className="size-modal" role="dialog" aria-modal="true" aria-labelledby="size-title">
        <div className="modal-header">
          <div>
            <p>SIZE LIBRARY</p>
            <h2 id="size-title">选择照片尺寸</h2>
          </div>
          <button aria-label="关闭尺寸面板" onClick={() => setSizeOpen(false)}><X /></button>
        </div>

        {/* Custom size card */}
        <div className="custom-size-card">
          <div className="custom-heading">
            <span><Settings2 size={17} /> 自定义尺寸</span>
            <div className="unit-tabs">
              <button className={customUnit === 'px' ? 'active' : ''} onClick={() => setCustomUnit('px')}>像素</button>
              <button className={customUnit === 'mm' ? 'active' : ''} onClick={() => setCustomUnit('mm')}>毫米</button>
            </div>
          </div>
          <div className="custom-inputs">
            <label>
              <span>宽度</span>
              <input type="number" min="1" max={customUnit === 'px' ? 6000 : 500} value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} />
            </label>
            <b>×</b>
            <label>
              <span>高度</span>
              <input type="number" min="1" max={customUnit === 'px' ? 6000 : 500} value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} />
            </label>
            {customUnit === 'mm' && (
              <label>
                <span>DPI</span>
                <input type="number" min="72" max="600" value={dpi} onChange={(e) => setDpi(Number(e.target.value))} />
              </label>
            )}
            <button onClick={applyCustomSize}>应用尺寸</button>
          </div>
        </div>

        {/* Search */}
        <div className="size-search">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索名称、像素或毫米尺寸" />
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="category-tabs">
            {categories.map((item) => (
              <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="size-results" id="sizes">
          {filteredSizes.map((item) => (
            <button
              key={item.id}
              className={size.id === item.id ? 'selected' : ''}
              onClick={() => { setSize(item); setSizeOpen(false) }}
            >
              <span>
                <strong>{item.name}</strong>
                {item.hot && <em>热门</em>}
              </span>
              <small>{item.width} × {item.height}px</small>
              <small>{item.widthMm} × {item.heightMm}mm</small>
              {size.id === item.id && <Check className="selected-check" size={17} />}
            </button>
          ))}
          {filteredSizes.length === 0 && (
            <div className="no-results">
              <Search />
              <strong>没有找到匹配尺寸</strong>
              <span>可以在上方创建自定义尺寸</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
