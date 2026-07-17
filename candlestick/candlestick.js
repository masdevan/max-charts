import { drawGrid, drawCandlesticks, drawXAxis } from './renderer.js'
import { createTooltip, showTooltip, hideTooltip, getCandleAtX } from './tooltip.js'
import { createGearIcon } from '../icons/gear.js'
import { formatPrice } from './utils.js'

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

  _toggleLock() {
    this._priceLocked = !this._priceLocked
    if (!this._priceLocked) {
      this._frozenMinP = this._minP
      this._frozenMaxP = this._maxP
    }
    this._updateGearMenu()
    this._render()
  }

  _setupGearMenu() {
    this._modalOpen = false

    this._gearBtn = document.createElement('button')
    this._gearBtn.appendChild(createGearIcon(this._colors.text))
    this._gearBtn.style.cssText =
      'position:absolute;cursor:pointer;z-index:3;' +
      'background:none;border:none;padding:2px;display:flex;align-items:center;justify-content:center'

    this._modal = document.createElement('div')
    this._modal.style.cssText = 'position:absolute;z-index:3;display:none;' +
      'background:' + this._colors.bg + ';border:1px solid ' + this._colors.grid + ';' +
      'border-radius:0;padding:4px 0;' +
      'font-family:"Terminal Grotesque",monospace;font-size:11px;min-width:100px'

    this._modalAuto = document.createElement('div')
    this._modalAuto.textContent = 'Chart Auto'
    this._modalAuto.style.cssText = 'padding:4px 10px;cursor:pointer;color:' + this._colors.text
    this._modalAuto.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!this._priceLocked) this._toggleLock()
      this._hideModal()
    })

    this._modalFixed = document.createElement('div')
    this._modalFixed.textContent = 'Chart Fixed'
    this._modalFixed.style.cssText = 'padding:4px 10px;cursor:pointer;color:' + this._colors.text
    this._modalFixed.addEventListener('click', (e) => {
      e.stopPropagation()
      if (this._priceLocked) this._toggleLock()
      this._hideModal()
    })

    this._modal.appendChild(this._modalAuto)
    this._modal.appendChild(this._modalFixed)

    this._onGearClick = (e) => {
      e.stopPropagation()
      this._toggleModal()
    }
    this._gearBtn.addEventListener('click', this._onGearClick)

    this._onDocClick = (e) => {
      if (this._modalOpen && !this._modal.contains(e.target) && e.target !== this._gearBtn) {
        this._hideModal()
      }
    }
    document.addEventListener('click', this._onDocClick)

    this._wrapper.appendChild(this._gearBtn)
    this._wrapper.appendChild(this._modal)
  }

  _updateGearMenu() {
    const active = this._colors.grid
    const inactive = this._colors.bg
    this._modalAuto.style.background = this._priceLocked ? active : inactive
    this._modalFixed.style.background = this._priceLocked ? inactive : active
  }

  _positionGearMenu() {
    if (!this._modal) return
    const m = this._getMargin()
    const sz = this._gearBtn.offsetHeight || 20
    this._gearBtn.style.bottom = Math.max(4, m.bottom - sz + 18) + 'px'
    this._gearBtn.style.right = Math.max(0, m.right - sz - 5) + 'px'
    this._modal.style.bottom = m.bottom + 'px'
    this._modal.style.right = m.right + 'px'
  }

  _toggleModal() {
    this._modalOpen = !this._modalOpen
    this._modal.style.display = this._modalOpen ? 'block' : 'none'
    if (this._modalOpen) this._updateGearMenu()
  }

  _hideModal() {
    this._modalOpen = false
    this._modal.style.display = 'none'
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

  async _loadMore(beforeDate) {
    if (this._loading || !this._hasMore || !this._loadFn) return
    this._loading = true
    try {
      const results = await this._loadFn(beforeDate)
      if (!results || results.length === 0) {
        this._hasMore = false
        return
      }
      if (results.length < this._loadLimit) this._hasMore = false

      if (!beforeDate) {
        this._data = results.slice().reverse()
        this._visibleCount = this._defaultVisibleCount()
        this._startIndex = Math.max(0, this._data.length - this._visibleCount)
      } else {
        const added = results.slice().reverse()
        this._startIndex += added.length
        this._dragStartIndex += added.length
        this._data = [...added, ...this._data]
      }

      if (this._data.length > 0) this._loadBeforeDate = this._data[0].date

      this._render()
    } finally {
      this._loading = false
    }
  }

  _checkLoadMore() {
    if (!this._loadFn || this._loading || !this._hasMore) return
    if (this._startIndex < this._loadThreshold) this._loadMore(this._loadBeforeDate)
  }

  _setupEvents() {
    this._onWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 3 : -3
      this._visibleCount = Math.max(this._minVisible, Math.min(this._data.length, this._visibleCount + delta))
      this._startIndex = Math.min(this._startIndex, this._data.length - this._visibleCount)
      this._render()
      this._checkLoadMore()
    }

    this._onMouseDown = (e) => {
      this._isDragging = true
      this._dragStartX = e.clientX
      this._dragStartY = e.clientY
      this._dragStartIndex = this._startIndex
      this._dragStartMinP = this._minP
      this._dragStartMaxP = this._maxP
      this._canvas.style.cursor = 'grabbing'
    }

    this._onDocumentMove = (e) => {
      if (!this._isDragging) return
      const m = this._lastMargin || this._getMargin()
      const chartW = this._width - m.left - m.right
      const chartH = this._height - m.top - m.bottom
      const candleW = chartW / this._visibleCount
      const shift = Math.round((this._dragStartX - e.clientX) / candleW)
      this._startIndex = Math.max(0, Math.min(this._data.length - this._visibleCount, this._dragStartIndex + shift))
      if (!this._priceLocked) {
        const range = this._dragStartMaxP - this._dragStartMinP
        const vShift = (this._dragStartY - e.clientY) / chartH * range
        this._frozenMinP = this._dragStartMinP - vShift
        this._frozenMaxP = this._dragStartMaxP - vShift
      }
      this._render()
      this._checkLoadMore()
    }

    this._onDocumentUp = () => {
      if (!this._isDragging) return
      this._isDragging = false
      this._canvas.style.cursor = 'crosshair'
      this._checkLoadMore()
    }

    this._onCanvasMove = (e) => {
      if (this._isDragging) return
      const rect = this._canvas.getBoundingClientRect()
      this._mouseX = e.clientX - rect.left
      this._mouseY = e.clientY - rect.top
      this._render()
      const m = this._lastMargin || this._getMargin()
      const hit = getCandleAtX(e.clientX, this._canvas, m, this._width, this._visibleCount, this._startIndex, this._data)
      if (hit) {
        showTooltip(this._tooltipEl, hit.data, m, this._colors.text, this._fontSize())
      } else {
        hideTooltip(this._tooltipEl)
      }
    }

    this._onCanvasLeave = () => {
      hideTooltip(this._tooltipEl)
      this._mouseX = null
      this._mouseY = null
      this._render()
    }

    this._canvas.addEventListener('wheel', this._onWheel, { passive: false })
    this._canvas.addEventListener('mousedown', this._onMouseDown)
    this._canvas.addEventListener('mousemove', this._onCanvasMove)
    this._canvas.addEventListener('mouseleave', this._onCanvasLeave)
    document.addEventListener('mousemove', this._onDocumentMove)
    document.addEventListener('mouseup', this._onDocumentUp)
    this._canvas.style.cursor = 'crosshair'
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
    if (this._priceLocked) {
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

  _drawCrosshair(chartW, chartH, m) {
    const cx = this._mouseX, cy = this._mouseY
    if (cx < m.left || cx > m.left + chartW || cy < m.top || cy > m.top + chartH) return

    const ctx = this._ctx
    const price = this._maxP - (cy - m.top) / chartH * (this._maxP - this._minP)
    const candleIdx = Math.floor((cx - m.left) / (chartW / this._visibleCount)) + this._startIndex

    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    ctx.strokeStyle = '#888'

    ctx.beginPath()
    ctx.moveTo(cx, m.top)
    ctx.lineTo(cx, m.top + chartH)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(m.left, cy)
    ctx.lineTo(m.left + chartW, cy)
    ctx.stroke()

    ctx.setLineDash([])

    ctx.font = 'bold ' + this._fontSize() + 'px "Terminal Grotesque", monospace'

    const priceLabel = price.toFixed(2)
    const pw = ctx.measureText(priceLabel).width + 4
    let px = m.left + chartW - pw - 2
    if (px < m.left) px = m.left + 2
    const above = cy - m.top > 14
    ctx.textAlign = 'left'
    ctx.textBaseline = above ? 'bottom' : 'top'
    ctx.fillStyle = this._colors.text
    ctx.fillText(priceLabel, px, above ? cy - 2 : cy + 12)

    if (candleIdx >= 0 && candleIdx < this._data.length) {
      const d = new Date(this._data[candleIdx].date)
      const dateLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      const dw = ctx.measureText(dateLabel).width + 4
      let dx = cx - dw - 4
      if (dx < m.left) dx = cx + 4
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillStyle = this._colors.text
      ctx.fillText(dateLabel, dx, m.top + chartH - 2)
    }

    ctx.restore()
  }
}
