import { drawGrid, drawCandlesticks, drawXAxis } from './renderer.js'
import { createTooltip } from './tooltip.js'
import { formatPrice } from './utils.js'
import gearMethods from './gear-menu.js'
import eventsMethods from './events.js'
import crosshairMethods from './crosshair.js'
import loaderMethods from './loader.js'
import cursorToolbarMethods from './cursor-toolbar.js'
import tradingMethods from './trading-panel.js'

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

    this._decimals = null
    this._startIndex = 0
    this._visibleCount = 60
    this._minVisible = 5
    this._colors = {
      bullish: '#26a69a',
      bearish: '#ef5350',
      grid: '#e0e0e0',
      text: '#666',
      bg: '#ffffff',
      labelBg: '#e8e8e8',
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
      top: Math.max(2, Math.min(12, h * 0.025)),
      bottom: Math.max(10, Math.min(30, h * 0.08)),
      left: 10,
      right: Math.max(4, Math.min(12, w * 0.02))
    }
  }

  _fontSize() {
    return Math.max(9, Math.min(12, Math.floor((Math.min(this._width || 800, this._height || 500)) / 45)))
  }

  _loadFont() {
    if (this._fontPromise) return this._fontPromise
    const url = new URL('../fonts/terminal-grotesque.ttf', import.meta.url).href
    this._fontPromise = (async () => {
      try {
        const font = new FontFace('Terminal Grotesque', `url(${url})`)
        await font.load()
        document.fonts.add(font)
      } catch (_) {}
    })()
    return this._fontPromise
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
          const isDark = r * 0.299 + g * 0.587 + b * 0.114 < 128
          const amt = isDark ? 25 : -25
          this._colors.labelBg = `rgb(${Math.max(0,Math.min(255,r+amt))},${Math.max(0,Math.min(255,g+amt))},${Math.max(0,Math.min(255,b+amt))})`
          if (isDark) {
            this._colors.grid = `rgb(${Math.min(255,r+50)},${Math.min(255,g+50)},${Math.min(255,b+50)})`
            this._colors.text = `rgb(${Math.min(255,r+140)},${Math.min(255,g+140)},${Math.min(255,b+140)})`
            this._colors.wick = `rgb(${Math.min(255,r+100)},${Math.min(255,g+100)},${Math.min(255,b+100)})`
          } else {
            this._colors.grid = `rgb(${Math.max(0,r-80)},${Math.max(0,g-80)},${Math.max(0,b-80)})`
            this._colors.text = `rgb(${Math.max(0,r-180)},${Math.max(0,g-180)},${Math.max(0,b-180)})`
            this._colors.wick = `rgb(${Math.max(0,r-120)},${Math.max(0,g-120)},${Math.max(0,b-120)})`
          }
        }
        return
      }
      el = el.parentElement
    }
    this._colors.bg = '#ffffff'
    this._colors.grid = '#a0a0a0'
    this._colors.text = '#333'
    this._colors.wick = '#666'
    this._colors.labelBg = '#e8e8e8'
  }

  _detectDecimals() {
    let d = 0
    const sample = this._data.slice(0, 50)
    for (const p of sample) {
      for (const key of ['open', 'high', 'low', 'close']) {
        const s = String(p[key])
        const dot = s.indexOf('.')
        if (dot !== -1) d = Math.max(d, s.length - dot - 1)
      }
    }
    this._decimals = d
  }

  _defaultVisibleCount() {
    return this._data.length || 100
  }

  setData(data) {
    this._detectDecimals()
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
    document.removeEventListener('click', this._onToolbarDocClick)
    this._canvas.removeEventListener('wheel', this._onWheel)
    this._canvas.removeEventListener('mousedown', this._onMouseDown)
    this._canvas.removeEventListener('mousemove', this._onCanvasMove)
    this._canvas.removeEventListener('mouseleave', this._onCanvasLeave)
    document.removeEventListener('mousemove', this._onDocumentMove)
    document.removeEventListener('mouseup', this._onDocumentUp)
    this._tradeBtnGroup?.remove()
    this._container.removeChild(this._wrapper)
  }

  _init() {
    document.body.style.margin = '0'
    this._container.style.overflow = 'hidden'
    this._wrapper = document.createElement('div')
    const fmt = (v) => typeof v === 'number' ? v + 'px' : v
    const ws = this._customW && this._customH
      ? `position:relative;display:flex;overflow:hidden;width:${fmt(this._customW)};height:${fmt(this._customH)}`
      : 'position:relative;display:flex;overflow:hidden;width:100%;height:100%'
    this._wrapper.style.cssText = ws
    this._container.appendChild(this._wrapper)

    this._sidebar = document.createElement('div')
    this._sidebar.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:1px;padding-top:4px;width:28px;flex-shrink:0'
    this._wrapper.appendChild(this._sidebar)

    this._chartArea = document.createElement('div')
    this._chartArea.style.cssText = 'position:relative;flex:1;display:flex;flex-direction:column;min-width:0'
    this._wrapper.appendChild(this._chartArea)

    this._detectTheme()
    this._setupGearMenu()
    this._setupCursorToolbar()
    this._setupTradingButton()

    this._canvas = document.createElement('canvas')
    this._canvas.style.cssText = 'display:block;width:100%;flex:1;min-height:0'
    this._chartArea.appendChild(this._canvas)
    this._ctx = this._canvas.getContext('2d')

    this._tooltipEl = createTooltip(this._chartArea)

    if (window.ResizeObserver) {
      this._resizeObserver = new ResizeObserver(() => this._resize())
      this._resizeObserver.observe(this._chartArea)
    } else {
      window.addEventListener('resize', () => this._resize())
    }

    this._setupEvents()

    this._loadFont().then(() => {
      this._fontReady = true
      this._resize()
      if (this._loadFn) {
        this._loadMore(null)
      } else {
        this.setData(this._data)
      }
    })
  }

  _resize() {
    const rect = this._canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    this._canvas.width = rect.width * dpr
    this._canvas.height = rect.height * dpr
    this._ctx.scale(dpr, dpr)
    this._width = rect.width
    this._height = rect.height
    if (!this._fontReady) return
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

    let minP, maxP
    if (visibleData.length) {
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
    } else {
      if (this._minP == null || this._maxP == null) return
      minP = this._minP; maxP = this._maxP
    }

    ctx.font = fs + 'px "Terminal Grotesque", monospace'
    const pw = Math.max(ctx.measureText(formatPrice(maxP, this._decimals)).width, ctx.measureText(formatPrice(minP, this._decimals)).width)
    m.right = Math.max(pw + 6, this._lastMargin ? this._lastMargin.right : m.right)
    this._lastMargin = { ...m }

    const chartW = this._width - m.left - m.right
    const chartH = this._height - m.top - m.bottom
    if (chartW <= 0 || chartH <= 0) return

    const yPos = (price) => m.top + chartH - (price - minP) / (maxP - minP) * chartH

    ctx.fillStyle = this._colors.bg
    ctx.fillRect(0, 0, this._width, this._height)

    drawGrid(ctx, chartW, chartH, m.left, m.top, minP, maxP, yPos, this._colors, fs, this._decimals)
    ctx.save()
    ctx.beginPath()
    ctx.rect(m.left, m.top, chartW, chartH)
    ctx.clip()
    if (visibleData.length) {
      drawCandlesticks(ctx, visibleData, startIdx, m.left, chartW, chartH, m.top, yPos, this._visibleCount, this._colors)
    }
    ctx.restore()
    drawXAxis(ctx, this._data, startIdx, m.left, chartW, m.top, chartH, this._visibleCount, this._colors, fs, this._decimals)
    this._renderTradingLines(ctx)
    if (this._updateTradeButtons) this._updateTradeButtons()

    ctx.strokeStyle = this._colors.grid
    ctx.lineWidth = 1
    ctx.strokeRect(m.left, m.top, chartW, chartH)

    if (this._mouseX != null && this._mouseY != null && !this._cursorMode) {
      this._drawCrosshair(chartW, chartH, m)
    }
  }
}

Object.assign(CandlestickChart.prototype, gearMethods)
Object.assign(CandlestickChart.prototype, eventsMethods)
Object.assign(CandlestickChart.prototype, crosshairMethods)
Object.assign(CandlestickChart.prototype, loaderMethods)
Object.assign(CandlestickChart.prototype, cursorToolbarMethods)
Object.assign(CandlestickChart.prototype, tradingMethods)
