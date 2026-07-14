import { formatPrice } from './utils.js'

const TOOLTIP_STYLE =
  'position:absolute;pointer-events:none;color:#d0d0d0;' +
  'font:9px/1.4 "Terminal Grotesque",monospace;display:none;z-index:1000;white-space:nowrap;'

export function createTooltip(container) {
  const el = document.createElement('div')
  el.style.cssText = TOOLTIP_STYLE
  container.style.position = 'relative'
  container.appendChild(el)
  return el
}

export function showTooltip(el, data, margin, textColor, fontSize) {
  const isBullish = data.close >= data.open
  const arrow = isBullish ? '&#9650;' : '&#9660;'
  const color = isBullish ? '#26a69a' : '#ef5350'
  const d = new Date(data.date)
  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const fmt = (v) => formatPrice(v)

  el.innerHTML =
    `<span style="color:${textColor}">${dateStr}</span>` +
    `<span style="color:${color};margin-left:5px">${arrow} <b>${fmt(data.close)}</b></span>` +
    `<span style="color:${textColor};opacity:0.5;margin:0 5px">|</span>` +
    `<span style="color:${textColor}">O <b>${fmt(data.open)}</b></span>` +
    `<span style="color:${textColor};margin-left:5px">H <b>${fmt(data.high)}</b></span>` +
    `<span style="color:${textColor};margin-left:5px">L <b>${fmt(data.low)}</b></span>` +
    `<span style="color:${color};margin-left:5px">C <b>${fmt(data.close)}</b></span>`

  el.style.fontSize = fontSize + 'px'
  el.style.left = (margin.left + 4) + 'px'
  el.style.top = margin.top + 'px'
  el.style.display = 'block'
}

export function hideTooltip(el) {
  el.style.display = 'none'
}

export function getCandleAtX(clientX, canvas, margin, width, visibleCount, startIndex, data) {
  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left - margin.left
  if (x < 0) return null
  const chartW = width - margin.left - margin.right
  const candleW = chartW / visibleCount
  const idx = Math.floor(x / candleW)
  const dataIdx = Math.floor(startIndex) + idx
  if (dataIdx < 0 || dataIdx >= data.length) return null
  return { index: dataIdx, data: data[dataIdx] }
}
