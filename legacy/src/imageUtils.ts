export type Background = {
  id: string
  label: string
  css: string
  value: string
  kind: 'solid' | 'gradient' | 'transparent'
}

export const backgrounds: Background[] = [
  { id: 'transparent', label: '透明', css: 'checkerboard', value: 'transparent', kind: 'transparent' },
  { id: 'white', label: '纯白', css: '#ffffff', value: '#ffffff', kind: 'solid' },
  { id: 'blue-light', label: '浅蓝', css: '#77c6ef', value: '#77c6ef', kind: 'solid' },
  { id: 'blue', label: '标准蓝', css: '#2b8ce9', value: '#2b8ce9', kind: 'solid' },
  { id: 'red', label: '标准红', css: '#ef2027', value: '#ef2027', kind: 'solid' },
  { id: 'blue-deep', label: '深蓝', css: '#405cc5', value: '#405cc5', kind: 'solid' },
  { id: 'gray', label: '浅灰', css: '#a1a1a1', value: '#a1a1a1', kind: 'solid' },
  { id: 'grad-blue', label: '蓝渐变', css: 'linear-gradient(#3d8fd0, #f7fbff)', value: '#3d8fd0|#f7fbff', kind: 'gradient' },
  { id: 'grad-red', label: '红渐变', css: 'linear-gradient(#a80019, #fff9fa)', value: '#a80019|#fff9fa', kind: 'gradient' },
  { id: 'grad-gray', label: '灰渐变', css: 'linear-gradient(#9d9d9d, #ffffff)', value: '#9d9d9d|#ffffff', kind: 'gradient' },
]

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

export async function preserveLightClothing(original: Blob, cutout: Blob): Promise<Blob> {
  const originalUrl = URL.createObjectURL(original)
  const cutoutUrl = URL.createObjectURL(cutout)
  try {
    const [originalImage, cutoutImage] = await Promise.all([loadImage(originalUrl), loadImage(cutoutUrl)])
    const width = cutoutImage.naturalWidth
    const height = cutoutImage.naturalHeight
    const originalCanvas = document.createElement('canvas')
    const outputCanvas = document.createElement('canvas')
    originalCanvas.width = outputCanvas.width = width
    originalCanvas.height = outputCanvas.height = height
    const originalContext = originalCanvas.getContext('2d', { willReadFrequently: true })!
    const outputContext = outputCanvas.getContext('2d', { willReadFrequently: true })!
    originalContext.drawImage(originalImage, 0, 0, width, height)
    outputContext.drawImage(cutoutImage, 0, 0, width, height)
    const originalData = originalContext.getImageData(0, 0, width, height)
    const outputData = outputContext.getImageData(0, 0, width, height)
    const pixels = width * height
    const exterior = new Uint8Array(pixels)
    const queue = new Int32Array(pixels)
    let head = 0
    let tail = 0
    const transparent = (index: number) => outputData.data[index * 4 + 3] < 48
    const enqueue = (index: number) => {
      if (index < 0 || index >= pixels || exterior[index] || !transparent(index)) return
      exterior[index] = 1
      queue[tail++] = index
    }

    for (let x = 0; x < width; x++) {
      enqueue(x)
      enqueue((height - 1) * width + x)
    }
    for (let y = 1; y < height - 1; y++) {
      enqueue(y * width)
      enqueue(y * width + width - 1)
    }
    while (head < tail) {
      const index = queue[head++]
      const x = index % width
      if (x > 0) enqueue(index - 1)
      if (x < width - 1) enqueue(index + 1)
      if (index >= width) enqueue(index - width)
      if (index < pixels - width) enqueue(index + width)
    }

    let restored = 0
    const redSamples: number[] = []
    const greenSamples: number[] = []
    const blueSamples: number[] = []
    const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 120))
    const topSampleHeight = Math.max(2, Math.floor(height * 0.055))
    const sideSampleWidth = Math.max(2, Math.floor(width * 0.025))
    const sideSampleHeight = Math.floor(height * 0.58)
    const samplePixel = (x: number, y: number) => {
      const offset = (y * width + x) * 4
      redSamples.push(originalData.data[offset])
      greenSamples.push(originalData.data[offset + 1])
      blueSamples.push(originalData.data[offset + 2])
    }
    for (let y = 0; y < topSampleHeight; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) samplePixel(x, y)
    }
    for (let y = topSampleHeight; y < sideSampleHeight; y += sampleStep) {
      for (let x = 0; x < sideSampleWidth; x += sampleStep) samplePixel(x, y)
      for (let x = width - sideSampleWidth; x < width; x += sampleStep) samplePixel(x, y)
    }
    const median = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b)
      return sorted[Math.floor(sorted.length / 2)] ?? 0
    }
    const backgroundRed = median(redSamples)
    const backgroundGreen = median(greenSamples)
    const backgroundBlue = median(blueSamples)
    const sampleDistances: number[] = []
    for (let index = 0; index < redSamples.length; index++) {
      const redDelta = redSamples[index] - backgroundRed
      const greenDelta = greenSamples[index] - backgroundGreen
      const blueDelta = blueSamples[index] - backgroundBlue
      sampleDistances.push(Math.sqrt(redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta))
    }
    sampleDistances.sort((a, b) => a - b)
    const backgroundSpread = sampleDistances[Math.floor(sampleDistances.length * 0.9)] ?? 255

    if (backgroundSpread < 48) {
      const clothingStartY = Math.floor(height * 0.3)
      const colorThreshold = Math.min(88, Math.max(38, backgroundSpread * 3 + 18))
      const colorThresholdSquared = colorThreshold * colorThreshold
      const connected = new Uint8Array(pixels)
      head = 0
      tail = 0
      const differsFromBackground = (index: number) => {
        const offset = index * 4
        const redDelta = originalData.data[offset] - backgroundRed
        const greenDelta = originalData.data[offset + 1] - backgroundGreen
        const blueDelta = originalData.data[offset + 2] - backgroundBlue
        return redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta > colorThresholdSquared
      }
      const enqueueConnected = (index: number) => {
        if (index < clothingStartY * width || index >= pixels || connected[index]) return
        if (outputData.data[index * 4 + 3] < 80 && !differsFromBackground(index)) return
        connected[index] = 1
        queue[tail++] = index
      }
      for (let y = clothingStartY; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x
          if (outputData.data[index * 4 + 3] >= 80) enqueueConnected(index)
        }
      }
      while (head < tail) {
        const index = queue[head++]
        const x = index % width
        if (x > 0) enqueueConnected(index - 1)
        if (x < width - 1) enqueueConnected(index + 1)
        if (index >= width) enqueueConnected(index - width)
        if (index < pixels - width) enqueueConnected(index + width)
      }
      for (let index = clothingStartY * width; index < pixels; index++) {
        const offset = index * 4
        if (!connected[index] || outputData.data[offset + 3] >= 200 || !differsFromBackground(index)) continue
        outputData.data[offset] = originalData.data[offset]
        outputData.data[offset + 1] = originalData.data[offset + 1]
        outputData.data[offset + 2] = originalData.data[offset + 2]
        outputData.data[offset + 3] = 255
        restored += 1
      }
    }

    for (let y = Math.floor(height * 0.36); y < height; y++) {
      let left = -1
      let right = -1
      for (let x = 0; x < width; x++) {
        if (outputData.data[(y * width + x) * 4 + 3] >= 80) {
          if (left < 0) left = x
          right = x
        }
      }
      const hasBodySpan = left >= 0 && right - left > width * 0.2
      for (let x = Math.floor(width * 0.16); x < Math.ceil(width * 0.84); x++) {
        const pixel = y * width + x
        const offset = pixel * 4
        if (outputData.data[offset + 3] >= 48) continue
        const red = originalData.data[offset]
        const green = originalData.data[offset + 1]
        const blue = originalData.data[offset + 2]
        const luminance = red * 0.299 + green * 0.587 + blue * 0.114
        const chroma = Math.max(red, green, blue) - Math.min(red, green, blue)
        const enclosedHole = exterior[pixel] === 0
        const insideBodySpan = hasBodySpan && x > left + 2 && x < right - 2
        if (luminance > 168 && chroma < 58 && (enclosedHole || insideBodySpan)) {
          outputData.data[offset] = red
          outputData.data[offset + 1] = green
          outputData.data[offset + 2] = blue
          outputData.data[offset + 3] = 255
          restored += 1
        }
      }
    }

    if (restored === 0) return cutout
    outputContext.putImageData(outputData, 0, 0)
    return await new Promise<Blob>((resolve, reject) => {
      outputCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('浅色衣物保护失败')), 'image/png', 0.96)
    })
  } finally {
    URL.revokeObjectURL(originalUrl)
    URL.revokeObjectURL(cutoutUrl)
  }
}

export type RenderOptions = {
  sourceUrl: string
  width: number
  height: number
  background: Background
  scale: number
  offsetX: number
  offsetY: number
}

function paintBackground(ctx: CanvasRenderingContext2D, width: number, height: number, background: Background) {
  if (background.kind === 'transparent') return
  if (background.kind === 'gradient') {
    const [start, end] = background.value.split('|')
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, start)
    gradient.addColorStop(1, end)
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = background.value
  }
  ctx.fillRect(0, 0, width, height)
}

export async function renderPhoto(options: RenderOptions): Promise<HTMLCanvasElement> {
  const image = await loadImage(options.sourceUrl)
  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height
  const ctx = canvas.getContext('2d', { alpha: true })!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  paintBackground(ctx, canvas.width, canvas.height, options.background)

  const coverScale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight)
  const finalScale = coverScale * options.scale
  const drawWidth = image.naturalWidth * finalScale
  const drawHeight = image.naturalHeight * finalScale
  const x = (canvas.width - drawWidth) / 2 + (options.offsetX / 100) * canvas.width
  const y = (canvas.height - drawHeight) / 2 + (options.offsetY / 100) * canvas.height
  ctx.drawImage(image, x, y, drawWidth, drawHeight)
  return canvas
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string, format: 'png' | 'jpeg' = 'png'): Promise<void> {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg'
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图片导出失败'))
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = filename
      link.href = url
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      resolve()
    }, mime, 0.96)
  })
}

export type LayoutOptions = {
  photoCanvas: HTMLCanvasElement
  paper: '6inch' | '5inch' | 'a4'
  widthMm: number
  heightMm: number
  gapMm: number
  marginMm: number
  cutLines: boolean
}

const paperSizes = {
  '6inch': { width: 152, height: 102, label: '6 寸相纸' },
  '5inch': { width: 127, height: 89, label: '5 寸相纸' },
  a4: { width: 210, height: 297, label: 'A4 相纸' },
}

export function getPaper(paper: LayoutOptions['paper']) {
  return paperSizes[paper]
}

export function renderLayout(options: LayoutOptions): { canvas: HTMLCanvasElement; count: number; cols: number; rows: number } {
  const dpi = 300
  const pxPerMm = dpi / 25.4
  const paper = paperSizes[options.paper]
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(paper.width * pxPerMm)
  canvas.height = Math.round(paper.height * pxPerMm)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const photoW = Math.round(options.widthMm * pxPerMm)
  const photoH = Math.round(options.heightMm * pxPerMm)
  const gap = Math.round(options.gapMm * pxPerMm)
  const margin = Math.round(options.marginMm * pxPerMm)
  const cols = Math.max(1, Math.floor((canvas.width - margin * 2 + gap) / (photoW + gap)))
  const rows = Math.max(1, Math.floor((canvas.height - margin * 2 + gap) / (photoH + gap)))
  const usedWidth = cols * photoW + (cols - 1) * gap
  const usedHeight = rows * photoH + (rows - 1) * gap
  const startX = (canvas.width - usedWidth) / 2
  const startY = (canvas.height - usedHeight) / 2

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = Math.round(startX + col * (photoW + gap))
      const y = Math.round(startY + row * (photoH + gap))
      ctx.drawImage(options.photoCanvas, x, y, photoW, photoH)
      if (options.cutLines) {
        ctx.save()
        ctx.strokeStyle = '#9b9b9b'
        ctx.lineWidth = 1
        ctx.setLineDash([8, 6])
        ctx.strokeRect(x - 2, y - 2, photoW + 4, photoH + 4)
        ctx.restore()
      }
    }
  }
  return { canvas, count: cols * rows, cols, rows }
}
