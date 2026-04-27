// Generates icon-192.png and icon-512.png using Canvas API via node-canvas
// Run: node scripts/gen-icons.mjs
import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const s = size / 512

  // Background
  ctx.fillStyle = '#0a0a0a'
  const r = 112 * s
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#22c55e'

  function rect(x, y, w, h, rx) {
    x *= s; y *= s; w *= s; h *= s; rx *= s
    ctx.beginPath()
    ctx.moveTo(x + rx, y)
    ctx.lineTo(x + w - rx, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + rx)
    ctx.lineTo(x + w, y + h - rx)
    ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h)
    ctx.lineTo(x + rx, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - rx)
    ctx.lineTo(x, y + rx)
    ctx.quadraticCurveTo(x, y, x + rx, y)
    ctx.closePath()
    ctx.fill()
  }

  rect(32, 208, 96, 96, 24)
  rect(384, 208, 96, 96, 24)
  rect(112, 144, 64, 224, 32)
  rect(336, 144, 64, 224, 32)
  rect(176, 192, 160, 128, 32)

  return canvas.toBuffer('image/png')
}

mkdirSync(join(__dirname, '../public/icons'), { recursive: true })
writeFileSync(join(__dirname, '../public/icons/icon-192.png'), drawIcon(192))
writeFileSync(join(__dirname, '../public/icons/icon-512.png'), drawIcon(512))
console.log('Icons generated!')
