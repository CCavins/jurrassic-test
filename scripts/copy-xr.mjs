import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'node_modules/@8thwall/engine-binary/dist')
const to = join(root, 'public/external/xr')

if (!existsSync(from)) {
  console.warn('8th Wall engine binary is not installed; skip copy.')
  process.exit(0)
}

mkdirSync(to, { recursive: true })
cpSync(from, to, { recursive: true })
const face = join(to, 'xr-face.js')
if (existsSync(face)) rmSync(face)
console.log('Copied 8th Wall XR engine into public/external/xr')
