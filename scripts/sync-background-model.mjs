import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const version = '1.7.0'
const remoteBase = `https://staticimgly.com/@imgly/background-removal-data/${version}/dist/`
const outputDir = join(process.cwd(), 'public', 'background-removal')
const requiredResources = [
  '/models/isnet_fp16',
  '/onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm',
  '/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs',
  '/onnxruntime-web/ort-wasm-simd-threaded.wasm',
  '/onnxruntime-web/ort-wasm-simd-threaded.mjs',
]

await mkdir(outputDir, { recursive: true })

const resourceResponse = await fetch(new URL('resources.json', remoteBase))
if (!resourceResponse.ok) throw new Error(`Failed to fetch resources.json: ${resourceResponse.status}`)
const allResources = await resourceResponse.json()
const resources = Object.fromEntries(requiredResources.map((key) => {
  if (!allResources[key]) throw new Error(`Missing resource metadata: ${key}`)
  return [key, allResources[key]]
}))

const chunks = new Map()
for (const resource of Object.values(resources)) {
  for (const chunk of resource.chunks) chunks.set(chunk.name, chunk.hash)
}

let completed = 0
for (const [name, expectedHash] of chunks) {
  const target = join(outputDir, name)
  let valid = false
  try {
    const current = await readFile(target)
    valid = createHash('sha256').update(current).digest('hex') === expectedHash
  } catch {
    valid = false
  }
  if (!valid) {
    const response = await fetch(new URL(name, remoteBase))
    if (!response.ok) throw new Error(`Failed to fetch ${name}: ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    const actualHash = createHash('sha256').update(bytes).digest('hex')
    if (actualHash !== expectedHash) throw new Error(`Checksum mismatch for ${name}`)
    await writeFile(target, bytes)
  }
  completed += 1
  process.stdout.write(`\rSynced ${completed}/${chunks.size} model chunks`)
}

await writeFile(join(outputDir, 'resources.json'), `${JSON.stringify(resources, null, 2)}\n`)
const selectedFiles = new Set([...chunks.keys(), 'resources.json'])
for (const name of await readdir(outputDir)) {
  if (/^[a-f0-9]{64}$/.test(name) && !selectedFiles.has(name)) await unlink(join(outputDir, name))
}
process.stdout.write(`\nBackground model ${version} is ready in public/background-removal\n`)
