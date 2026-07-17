import { drawGrid, drawCandlesticks, drawXAxis } from './renderer.js'
import { createTooltip } from './tooltip.js'
import { formatPrice } from './utils.js'
import gearMethods from './gear-menu.js'
import eventsMethods from './events.js'
import crosshairMethods from './crosshair.js'
import loaderMethods from './loader.js'

export class CandlestickChart {
  constructor(container, dataOrOptions = [], legacyOptions = {}) {
    this._container = typeof container === 'string' ? document.querySelector(container) : container

    if (Array.isArray(dataOrOptions)) {
      this._data = dataOrOptions
      this._loadFn = null
      this._customW = legacyOptions.width || null
      this._customH = legacyOptions.height || null
    } else {
      const opts = dataOrOptions || {}
      this._data = []
      this._loadFn = opts.load || null
      this._loadLimit = opts.limit || 100
      this._loadThreshold = opts.threshold || 100
      this._loading = false
      this._hasMore = true
      this._loadBeforeDate = null
      this._customW = opts.width || null
      this._customH = opts.height || null
    }

    this._startIndex = 0
    this._visibleCount = 30
    this._minVisible = 5
    this._colors = {
      bullish: '#26a69a',
      bearish: '#ef5350',
      grid: '#e0e0e0',
      text: '#666',
      bg: '#ffffff',
      wick: '#333'
    }
    this._priceLocked = true
    this._frozenMinP = null
    this._frozenMaxP = null
    this._isDragging = false
    this._priceDragging = false
    this._dateZooming = false
    this._mouseX = null
    this._mouseY = null
    this._init()
  }

  _getMargin() {
    const w = this._width || 800, h = this._height || 500
    return {
      top: Math.max(6, Math.min(20, h * 0.05)),
      bottom: Math.max(10, Math.min(30, h * 0.08)),
      left: Math.max(35, Math.min(65, w * 0.1)),
      right: Math.max(8, Math.min(23, w * 0.03 + 3))
    }
  }

  _fontSize() {
    return Math.max(9, Math.min(13, Math.floor((Math.min(this._width || 800, this._height || 500)) / 35)))
  }

  _loadFont() {
    if (document.getElementById('opencode-font')) return
    const base = new URL('.', import.meta.url).href
    const url = new URL('../fonts/terminal-grotesque.ttf', base).href
    const s = document.createElement('style')
    s.id = 'opencode-font'
    s.textContent = "@font-face { font-family:'Terminal Grotesque'; src:url('" + url + "') format('truetype') }"
    document.head.appendChild(s)
  }

  _detectTheme() {
    let el = this._container
    while (el && el !== document) {
      const bg = getComputedStyle(el).backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const rgb = bg.match(/\d+/g)
        if (rgb) {
          const r = +rgb[0], g = +rgb[1], b = +rgb[2]
          this._colors.bg = bg
          if (r * 0.299 + g * 0.587 + b * 0.114 < 128) {
            this._colors.grid = `rgb(${Math.min(255,r+30)},${Math.min(255,g+30)},${Math.min(255,b+30)})`
            this._colors.text = `rgb(${Math.min(255,r+80)},${Math.min(255,g+80)},${Math.min(255,b+80)})`
            this._colors.wick = `rgb(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)})`
          }
        }
        return
      }
      el = el.parentElement
    }
    this._colors.bg = '#ffffff'
  }

  _defaultVisibleCount() {
    if (!this._width) return Math.min(this._data.length || 100, 100)
    const m = this._getMargin()
    const chartW = this._width - m.left - m.right
    return Math.max(this._minVisible, Math.min(this._data.length, Math.floor(chartW / 8)))
  }

  setData(data) {
    if (this._loadFn) {
      this._data = []
      this._loading = false
      this._hasMore = true
      this._loadBeforeDate = null
      this._startIndex = 0
      this._loadMore(null)
      return
    }
    this._data = data || []
    this._visibleCount = this._defaultVisibleCount()
    this._startIndex = Math.max(0, this._data.length - this._visibleCount)
    this._render()
  }

  destroy() {
    this._resizeObserver?.disconnect()
    this._gearBtn?.removeEventListener('click', this._onGearClick)
    document.removeEventListener('click', this._onDocClick)
    this._canvas.removeEventListener('wheel', this._onWheel)
    this._canvas.removeEventListener('mousedown', this._onMouseDown)
    this._canvas.removeEventListener('mousemove', this._onCanvasMove)
    this._canvas.removeEventListener('mouseleave', this._onCanvasLeave)
    document.removeEventListener('mousemove', this._onDocumentMove)
    document.removeEventListener('mouseup', this._onDocumentUp)
    this._wrapper.removeChild(this._gearBtn)
    this._wrapper.removeChild(this._modal)
    this._wrapper.removeChild(this._canvas)
    this._wrapper.removeChild(this._tooltipEl)
    this._container.removeChild(this._wrapper)
  }

  _init() {
    this._wrapper = document.createElement('div')
    const ws = this._customW && this._customH
      ? `position:relative;display:flex;flex-direction:column;width:${this._customW}px;height:${this._customH}px`
      : 'position:relative;display:flex;flex-direction:column;width:100%;height:100%'
    this._wrapper.style.cssText = ws
    this._container.appendChild(this._wrapper)

    this._loadFont()
    this._detectTheme()

    this._setupGearMenu()

    this._canvas = document.createElement('canvas')
    this._canvas.style.cssText = 'display:block;width:100%;flex:1;min-height:0'
    this._wrapper.appendChild(this._canvas)
    this._ctx = this._canvas.getContext('2d')

    this._tooltipEl = createTooltip(this._wrapper)

    if (window.ResizeObserver) {
      this._resizeObserver = new ResizeObserver(() => this._resize())
      this._resizeObserver.observe(this._wrapper)
    } else {
      window.addEventListener('resize', () => this._resize())
    }

    this._setupEvents()
    this._resize()

    if (this._loadFn) {
      this._loadMore(null)
    } else {
      this.setData(this._data)
    }
  }

  _resize() {
    const rect = this._canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    this._canvas.width = rect.width * dpr
    this._canvas.height = rect.height * dpr
    this._ctx.scale(dpr, dpr)
    this._width = rect.width
    this._height = rect.height
    this._render()
    this._positionGearMenu()
  }

  _render() {
    if (!this._width || !this._data.length) return

    const ctx = this._ctx
    const m = this._getMargin()
    const fs = this._fontSize()

    const endIdx = Math.ceil(Math.min(this._startIndex + this._visibleCount, this._data.length))
    const startIdx = Math.floor(this._startIndex)
    const visibleData = this._data.slice(startIdx, endIdx)
    if (!visibleData.length) return

    let minP, maxP
    if (this._priceLocked && !this._priceDragging) {
      minP = Infinity; maxP = -Infinity
      for (const d of visibleData) {
        if (d.low < minP) minP = d.low
        if (d.high > maxP) maxP = d.high
      }
      const pad = (maxP - minP) * 0.05 || 1
      minP -= pad; maxP += pad
      this._frozenMinP = minP; this._frozenMaxP = maxP
    } else {
      minP = this._frozenMinP; maxP = this._frozenMaxP
    }
    this._minP = minP; this._maxP = maxP

    ctx.font = fs + 'px "Terminal Grotesque", monospace'
    const pw = Math.max(ctx.measureText(formatPrice(maxP)).width, ctx.measureText(formatPrice(minP)).width)
    m.left = Math.max(pw + 11, 33)
    this._lastMargin = { ...m }

    const chartW = this._width - m.left - m.right
    const chartH = this._height - m.top - m.bottom
    if (chartW <= 0 || chartH <= 0) return

    const yPos = (price) => m.top + chartH - (price - minP) / (maxP - minP) * chartH

    ctx.fillStyle = this._colors.bg
    ctx.fillRect(0, 0, this._width, this._height)

    drawGrid(ctx, chartW, chartH, m.left, m.top, minP, maxP, yPos, this._colors, fs)
    ctx.save()
    ctx.beginPath()
    ctx.rect(m.left, m.top, chartW, chartH)
    ctx.clip()
    drawCandlesticks(ctx, visibleData, startIdx, m.left, chartW, chartH, m.top, yPos, this._visibleCount, this._colors)
    ctx.restore()
    drawXAxis(ctx, visibleData, startIdx, m.left, chartW, m.top, chartH, this._visibleCount, this._colors, fs)

    ctx.strokeStyle = this._colors.grid
    ctx.lineWidth = 1
    ctx.strokeRect(m.left, m.top, chartW, chartH)

    if (this._mouseX != null && this._mouseY != null) {
      this._drawCrosshair(chartW, chartH, m)
    }
  }
}

Object.assign(CandlestickChart.prototype, gearMethods)
Object.assign(CandlestickChart.prototype, eventsMethods)
Object.assign(CandlestickChart.prototype, crosshairMethods)
Object.assign(CandlestickChart.prototype, loaderMethods)
