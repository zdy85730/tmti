import { themePalettes } from '../data/themeTokens'
import type { DraftFragment, ExportMode, ResultSnapshot } from '../types'

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const characters = [...text]
  let line = ''
  let cursorY = y

  characters.forEach((character) => {
    const testLine = `${line}${character}`

    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, cursorY)
      line = character
      cursorY += lineHeight
      return
    }

    line = testLine
  })

  if (line) {
    context.fillText(line, x, cursorY)
  }

  return cursorY
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function drawMotif(
  context: CanvasRenderingContext2D,
  motif: string,
  x: number,
  y: number,
  width: number,
  height: number,
  accent: string,
  ghost: string,
) {
  context.save()
  context.translate(x, y)

  switch (motif) {
    case 'frame': {
      context.strokeStyle = accent
      context.lineWidth = 10
      context.strokeRect(42, 42, width - 84, height - 84)
      break
    }
    case 'orbit': {
      context.strokeStyle = accent
      context.lineWidth = 8
      context.beginPath()
      context.ellipse(width * 0.55, height * 0.48, width * 0.34, height * 0.22, Math.PI / 10, 0, Math.PI * 2)
      context.stroke()
      context.beginPath()
      context.ellipse(width * 0.42, height * 0.54, width * 0.24, height * 0.16, -Math.PI / 8, 0, Math.PI * 2)
      context.stroke()
      break
    }
    case 'column': {
      context.fillStyle = ghost
      context.fillRect(width * 0.18, 0, width * 0.16, height)
      context.fillRect(width * 0.66, 0, width * 0.16, height)
      break
    }
    case 'ripple': {
      context.strokeStyle = accent
      context.lineWidth = 8
      ;[0.18, 0.32, 0.46].forEach((offset) => {
        context.beginPath()
        context.arc(width * 0.24, height * 0.72, width * offset, Math.PI * 1.08, Math.PI * 1.92)
        context.stroke()
      })
      break
    }
    case 'veil': {
      context.fillStyle = ghost
      context.beginPath()
      context.moveTo(width * 0.72, 0)
      context.quadraticCurveTo(width * 0.42, height * 0.3, width * 0.6, height)
      context.lineTo(width, height)
      context.lineTo(width, 0)
      context.closePath()
      context.fill()
      break
    }
    case 'band': {
      context.fillStyle = ghost
      context.fillRect(0, height * 0.18, width, height * 0.18)
      context.fillRect(0, height * 0.58, width, height * 0.12)
      break
    }
    case 'grid': {
      context.strokeStyle = ghost
      context.lineWidth = 2
      for (let column = 1; column < 5; column += 1) {
        const position = (width / 5) * column
        context.beginPath()
        context.moveTo(position, 0)
        context.lineTo(position, height)
        context.stroke()
      }
      for (let row = 1; row < 5; row += 1) {
        const position = (height / 5) * row
        context.beginPath()
        context.moveTo(0, position)
        context.lineTo(width, position)
        context.stroke()
      }
      break
    }
    case 'arc': {
      context.strokeStyle = accent
      context.lineWidth = 10
      context.beginPath()
      context.arc(width * 0.34, height * 0.84, width * 0.42, Math.PI * 1.1, Math.PI * 1.95)
      context.stroke()
      break
    }
    default:
      break
  }

  context.restore()
}

function drawDraftCard(
  context: CanvasRenderingContext2D,
  snapshot: ResultSnapshot,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  drawRoundedRect(context, x, y, width, height, 36)
  context.fillStyle = '#ece8e4'
  context.fill()
  context.strokeStyle = 'rgba(85, 85, 85, 0.14)'
  context.lineWidth = 2
  context.stroke()

  context.fillStyle = '#5e5a56'
  context.font = '600 22px "Noto Sans SC", sans-serif'
  context.fillText(snapshot.draftCard.title, x + 36, y + 54)

  context.fillStyle = '#6d6862'
  context.font = '500 17px "Noto Sans SC", sans-serif'
  snapshot.draftCard.fragments.slice(0, 3).forEach((fragment: DraftFragment, index) => {
    context.fillText(`${fragment.label}：${fragment.text}`, x + 36, y + 110 + index * 48)
  })

  context.fillStyle = '#8a8682'
  context.font = '500 16px "Noto Sans SC", sans-serif'
  wrapText(context, snapshot.draftCard.note, x + 36, y + height - 40, width - 72, 24)
}

function drawCoverCard(
  context: CanvasRenderingContext2D,
  snapshot: ResultSnapshot,
  mode: ExportMode,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const palette = themePalettes[snapshot.publicType.themeToken]

  drawRoundedRect(context, x, y, width, height, 40)
  context.fillStyle = palette.paper
  context.fill()
  context.shadowColor = palette.glow
  context.shadowBlur = 34
  context.shadowOffsetY = 10
  context.fillStyle = 'rgba(255,255,255,0.08)'
  drawRoundedRect(context, x, y, width, height, 40)
  context.fill()
  context.shadowColor = 'transparent'
  context.strokeStyle = palette.line
  context.lineWidth = 2
  drawRoundedRect(context, x, y, width, height, 40)
  context.stroke()

  const posterX = x + 52
  const posterY = y + 52
  const posterWidth = width - 104
  const posterHeight = 460

  drawRoundedRect(context, posterX, posterY, posterWidth, posterHeight, 28)
  context.fillStyle = palette.paperSoft
  context.fill()
  context.strokeStyle = palette.line
  context.stroke()
  drawMotif(context, snapshot.publicType.motif, posterX, posterY, posterWidth, posterHeight, palette.accent, palette.ghost)

  context.fillStyle = palette.accent
  context.font = '700 20px "Space Grotesk", sans-serif'
  context.fillText('TMTI', posterX + 30, posterY + 42)
  context.globalAlpha = 0.48
  context.fillText('PUBLIC CARD', posterX + posterWidth - 170, posterY + 42)
  context.globalAlpha = 1

  context.fillStyle = palette.text
  context.font = '700 28px "Space Grotesk", sans-serif'
  context.fillText(snapshot.publicType.code, posterX + 30, posterY + 108)
  context.font = '700 54px "Noto Serif SC", serif'
  context.fillText(snapshot.publicType.name, posterX + 30, posterY + 178)

  context.font = '500 24px "Noto Sans SC", sans-serif'
  wrapText(context, snapshot.publicType.subtitle, posterX + 30, posterY + 228, posterWidth - 60, 36)

  context.font = '600 19px "Noto Sans SC", sans-serif'
  snapshot.publicType.acceptedDescriptors.forEach((descriptor, index) => {
    const chipX = posterX + 30 + index * 160
    const chipY = posterY + posterHeight - 76
    drawRoundedRect(context, chipX, chipY, 128, 38, 19)
    context.fillStyle = palette.accentSoft
    context.fill()
    context.fillStyle = palette.accent
    context.fillText(descriptor, chipX + 18, chipY + 25)
  })

  context.fillStyle = palette.text
  context.font = '700 44px "Noto Serif SC", serif'
  context.fillText(snapshot.publicType.name, x + 52, y + 620)

  context.font = '500 26px "Noto Sans SC", sans-serif'
  wrapText(context, snapshot.publicType.shortDefinition, x + 52, y + 676, width - 104, 38)

  context.fillStyle = palette.subtext
  context.font = '500 20px "Noto Sans SC", sans-serif'
  context.fillText('默认导出的是更容易认领的版本', x + 52, y + height - 112)

  if (mode === 'cover-with-trace') {
    context.fillStyle = palette.subtext
    context.font = '600 18px "Space Grotesk", sans-serif'
    context.fillText('META-TI', x + width - 130, y + 46)
  }
}

function drawTraceFooter(
  context: CanvasRenderingContext2D,
  snapshot: ResultSnapshot,
  x: number,
  y: number,
) {
  context.fillStyle = '#4f4a45'
  context.font = '700 18px "Noto Sans SC", sans-serif'
  context.fillText('留痕', x, y)

  context.fillStyle = '#69645f'
  context.font = '500 18px "Noto Sans SC", sans-serif'
  snapshot.traceNotes.forEach((note, index) => {
    context.fillText(`- ${note.text}`, x, y + 36 + index * 28)
  })
}

export async function downloadShareCard(result: ResultSnapshot, mode: ExportMode) {
  const canvas = document.createElement('canvas')
  canvas.width = 1240
  canvas.height = 1600

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas rendering is unavailable.')
  }

  const palette = themePalettes[result.publicType.themeToken]
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#fcfaf6')
  gradient.addColorStop(0.55, palette.accentSoft)
  gradient.addColorStop(1, '#f4f1ec')
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  if (mode === 'cover-with-trace') {
    drawDraftCard(context, result, 132, 214, 840, 340)
  }

  drawCoverCard(context, result, mode, 170, 104, 900, 1150)

  if (mode === 'cover-with-trace') {
    drawTraceFooter(context, result, 170, 1324)
  }

  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = `tmti-${result.publicType.code.toLowerCase()}-${mode}.png`
  link.click()
}
