import { getCandleAtX, showTooltip, hideTooltip } from './tooltip.js'

export default {
  _setupEvents() {
    this._onWheel = (e) => {
      e.preventDefault()
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const step = (delta > 0 ? 1 : -1) * Math.max(3, Math.round(this._visibleCount * 0.05))
      this._visibleCount = Math.max(this._minVisible, Math.min(this._data.length, this._visibleCount + step))
      this._startIndex = Math.max(0, this._startIndex)
      if (!this._rafWheel) {
        this._rafWheel = requestAnimationFrame(() => {
          this._rafWheel = null
          this._render()
          this._checkLoadMore()
        })
      }
    }

    this._onMouseDown = (e) => {
      const rect = this._canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const m = this._lastMargin || this._getMargin()
      const chartW = this._width - m.left - m.right
      const chartH = this._height - m.top - m.bottom

      if (cx > m.left + chartW && cx <= m.left + chartW + m.right && cy >= m.top && cy <= m.top + chartH) {
        this._priceDragging = true
        this._dragStartY = e.clientY
        this._dragStartMinP = this._minP
        this._dragStartMaxP = this._maxP
        this._isDragging = true
        this._canvas.style.cursor = 'grabbing'
      } else if (cy > m.top + chartH && cy <= m.top + chartH + m.bottom && cx >= m.left && cx <= m.left + (this._width - m.left - m.right)) {
        this._dateZooming = true
        this._dragStartX = e.clientX
        this._dragStartVisibleCount = this._visibleCount
        this._isDragging = true
        this._canvas.style.cursor = 'grabbing'
      } else {
        this._isDragging = true
        this._dragStartX = e.clientX
        this._dragStartY = e.clientY
        this._dragStartIndex = this._startIndex
        this._dragStartMinP = this._minP
        this._dragStartMaxP = this._maxP
        this._canvas.style.cursor = 'grabbing'
      }
    }

    this._onDocumentMove = (e) => {
      if (!this._isDragging) return
      const rect = this._canvas.getBoundingClientRect()
      this._mouseX = e.clientX - rect.left
      this._mouseY = e.clientY - rect.top
      const m = this._lastMargin || this._getMargin()
      const chartW = this._width - m.left - m.right
      const chartH = this._height - m.top - m.bottom

      if (this._priceDragging) {
        const mid = (this._dragStartMaxP + this._dragStartMinP) / 2
        const range = this._dragStartMaxP - this._dragStartMinP
        const factor = (this._dragStartY - e.clientY) / chartH
        const newRange = Math.max(range * 0.1, range * (1 - factor * 2))
        const half = newRange / 2
        this._frozenMinP = mid - half
        this._frozenMaxP = mid + half
      } else if (this._dateZooming) {
        const factor = (this._dragStartX - e.clientX) / chartW
        this._visibleCount = Math.max(this._minVisible, Math.min(this._data.length, Math.round(this._dragStartVisibleCount * (1 + factor))))
        this._startIndex = Math.max(0, this._startIndex)
      } else {
        const candleW = chartW / this._visibleCount
        const shift = Math.round((this._dragStartX - e.clientX) / candleW)
        this._startIndex = Math.max(0, this._dragStartIndex + shift)
        if (!this._priceLocked) {
          const range = this._dragStartMaxP - this._dragStartMinP
          const vShift = (this._dragStartY - e.clientY) / chartH * range
          this._frozenMinP = this._dragStartMinP - vShift
          this._frozenMaxP = this._dragStartMaxP - vShift
        }
      }
      this._render()
      this._checkLoadMore()
    }

    this._onDocumentUp = () => {
      if (!this._isDragging) return
      this._isDragging = false
      if (this._priceDragging && this._priceLocked) {
        this._priceLocked = false
        this._updateGearMenu()
      }
      this._priceDragging = false
      this._dateZooming = false
    this._canvas.style.cursor = this._cursorMode ? 'default' : 'crosshair'
      this._checkLoadMore()
    }

    this._onCanvasMove = (e) => {
      if (this._isDragging) return
      const rect = this._canvas.getBoundingClientRect()
      this._mouseX = e.clientX - rect.left
      this._mouseY = e.clientY - rect.top
      const m = this._lastMargin || this._getMargin()
      const cx = this._mouseX, cy = this._mouseY
      const chartW = this._width - m.left - m.right
      const chartH = this._height - m.top - m.bottom
      if (cx > m.left + chartW && cx <= m.left + chartW + m.right && cy >= m.top && cy <= m.top + chartH) {
        this._canvas.style.cursor = 'row-resize'
      } else if (cy > m.top + chartH && cy <= m.top + chartH + m.bottom && cx >= m.left && cx <= m.left + (this._width - m.left - m.right)) {
        this._canvas.style.cursor = 'col-resize'
      } else {
        this._canvas.style.cursor = this._cursorMode ? 'default' : 'crosshair'
      }
      const hit = getCandleAtX(e.clientX, this._canvas, m, this._width, this._visibleCount, this._startIndex, this._data)
      if (hit) {
        showTooltip(this._tooltipEl, hit.data, m, this._colors.text, this._fontSize())
      } else {
        hideTooltip(this._tooltipEl)
      }
      if (!this._rafMove) {
        this._rafMove = requestAnimationFrame(() => {
          this._rafMove = null
          this._render()
        })
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
    this._canvas.style.cursor = this._cursorMode ? 'default' : 'crosshair'
  }
}
