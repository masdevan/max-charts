import { getCandleAtX, showTooltip, hideTooltip } from './tooltip.js'

export default {
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
}
