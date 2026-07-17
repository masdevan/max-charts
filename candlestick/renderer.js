import { niceStep, formatPrice } from './utils.js'

export function drawGrid(ctx, chartW, chartH, left, top, minP, maxP, yPos, colors, fontSize) {
  const range = maxP - minP
  const step = niceStep(range)
  const niceMin = Math.floor(minP / step) * step
  const niceMax = Math.ceil(maxP / step) * step

  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.font = fontSize + 'px "Terminal Grotesque", monospace'
  ctx.globalAlpha = 0.25

  for (let p = niceMin; p <= niceMax + step * 0.5; p += step) {
    const y = yPos(p)
    if (y < top || y > top + chartH) continue
    ctx.strokeStyle = colors.grid
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(left, y)
    ctx.lineTo(left + chartW, y)
    ctx.stroke()
  }

  ctx.globalAlpha = 1
  ctx.fillStyle = colors.text
  for (let p = niceMin; p <= niceMax + step * 0.5; p += step) {
    const y = yPos(p)
    if (y < top || y > top + chartH) continue
    ctx.fillText(formatPrice(p), left - 6, y)
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

export function drawXAxis(ctx, data, startIdx, left, chartW, top, chartH, visibleCount, colors, fontSize) {
  const step = Math.max(1, Math.floor(visibleCount / 6))
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = fontSize + 'px "Terminal Grotesque", monospace'

  // estimate interval from actual data
  let avgMs = 86400000
  const last = Math.min(startIdx + visibleCount, data.length - 1)
  const first = Math.max(0, last - 5)
  if (last - first >= 2) {
    let total = 0
    for (let i = first + 1; i <= last; i++) total += new Date(data[i].date).getTime() - new Date(data[i - 1].date).getTime()
    avgMs = total / (last - first)
  }

  ctx.globalAlpha = 0.25
  for (let i = 0; i < visibleCount; i += step) {
    const x = left + i * (chartW / visibleCount) + (chartW / visibleCount) / 2
    ctx.strokeStyle = colors.grid
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, top + chartH)
    ctx.stroke()
  }

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
    ctx.fillStyle = colors.text
    ctx.fillText(dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), x, top + chartH + fontSize + 4)
  }
}
