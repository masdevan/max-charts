import { niceStep, formatPrice } from './utils.js'

export function drawGrid(ctx, chartW, chartH, left, top, minP, maxP, yPos, colors, fontSize, decimals) {
  const range = maxP - minP
  const step = niceStep(range)
  const niceMin = Math.floor(minP / step) * step
  const niceMax = Math.ceil(maxP / step) * step

  ctx.textBaseline = 'middle'
  ctx.font = fontSize + 'px "Terminal Grotesque", monospace'

  ctx.save()
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.25
  ctx.strokeStyle = colors.grid
  for (let p = niceMin; p <= niceMax + step * 0.5; p += step) {
    const y = yPos(p)
    if (y < top || y > top + chartH) continue
    ctx.beginPath()
    ctx.moveTo(left, y)
    ctx.lineTo(left + chartW, y)
    ctx.stroke()
  }
  ctx.restore()

  ctx.globalAlpha = 1
  ctx.textAlign = 'left'
  for (let p = niceMin; p <= niceMax + step * 0.5; p += step) {
    const y = yPos(p)
    if (y < top || y > top + chartH) continue
    const label = formatPrice(p, decimals)
    const tw = ctx.measureText(label).width
    const pad = 3
    const bx = left + chartW
    const by = y - fontSize / 2 - pad
    ctx.fillStyle = colors.bg
    ctx.fillRect(bx, by, tw + pad * 2, fontSize + pad * 2)
    ctx.fillStyle = colors.text
    ctx.fillText(label, bx + pad, y)
  }
}

export function drawCandlesticks(ctx, visibleData, startIdx, left, chartW, chartH, top, yPos, visibleCount, colors) {
  const candleW = chartW / visibleCount
  const gap = Math.min(candleW * 0.2, 2)
  const bodyW = Math.max(1, candleW - gap)

  for (let i = 0; i < visibleData.length; i++) {
    const d = visibleData[i]
    const x = left + i * candleW
    const isBullish = d.close >= d.open
    const color = isBullish ? colors.bullish : colors.bearish

    ctx.strokeStyle = colors.wick
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + bodyW / 2, yPos(d.high))
    ctx.lineTo(x + bodyW / 2, yPos(d.low))
    ctx.stroke()

    const bodyTop = yPos(Math.max(d.open, d.close))
    const bodyH = Math.max(1, yPos(Math.min(d.open, d.close)) - bodyTop)
    ctx.fillStyle = color
    ctx.fillRect(x + gap / 2, bodyTop, bodyW, bodyH)
  }
}

function formatDateLabel(dt, totalMs) {
  const day = 86400000
  if (totalMs >= 365 * day) return dt.getFullYear().toString()
  if (totalMs >= 30 * day) return dt.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
  if (totalMs >= 2 * day) return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function drawXAxis(ctx, data, startIdx, left, chartW, top, chartH, visibleCount, colors, fontSize, decimals) {
  const step = Math.max(1, Math.floor(visibleCount / 6))
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = fontSize + 'px "Terminal Grotesque", monospace'

  let avgMs = 86400000
  const last = Math.min(startIdx + visibleCount, data.length - 1)
  const first = Math.max(0, last - 5)
  if (last - first >= 2) {
    let total = 0
    for (let i = first + 1; i <= last; i++) total += new Date(data[i].date).getTime() - new Date(data[i - 1].date).getTime()
    avgMs = total / (last - first)
  }
  const totalMs = avgMs * visibleCount

  ctx.save()
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.25
  ctx.strokeStyle = colors.grid
  for (let i = 0; i < visibleCount; i += step) {
    const x = left + i * (chartW / visibleCount) + (chartW / visibleCount) / 2
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, top + chartH)
    ctx.stroke()
  }
  ctx.restore()

  ctx.globalAlpha = 1
  for (let i = 0; i < visibleCount; i += step) {
    const idx = startIdx + i
    const x = left + i * (chartW / visibleCount) + (chartW / visibleCount) / 2
    let dt
    if (idx >= 0 && idx < data.length) {
      dt = new Date(data[idx].date)
    } else if (data.length > 0) {
      const ref = idx < 0 ? data[0] : data[data.length - 1]
      const offset = idx < 0 ? idx : idx - (data.length - 1)
      dt = new Date(new Date(ref.date).getTime() + offset * avgMs)
    } else {
      continue
    }
    const label = formatDateLabel(dt, totalMs)
    const tw = ctx.measureText(label).width
    const pad = 3
    const bx = x - tw / 2 - pad
    const by = top + chartH
    ctx.fillStyle = colors.bg
    ctx.fillRect(bx, by, tw + pad * 2, fontSize + pad * 2)
    ctx.fillStyle = colors.text
    ctx.fillText(label, x, by + pad)
  }
}
