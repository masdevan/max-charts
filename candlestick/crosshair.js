export default {
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

    ctx.font = this._fontSize() + 'px "Terminal Grotesque", monospace'
    const fs = this._fontSize()

    const priceLabel = price.toFixed(this._decimals || 2)
    const pw = ctx.measureText(priceLabel).width
    const pad = 3
    const px = m.left + chartW + 1
    ctx.fillStyle = this._colors.labelBg
    ctx.fillRect(px, cy - fs / 2 - pad, pw + pad * 2, fs + pad * 2)
    ctx.fillStyle = this._colors.text
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(priceLabel, px + pad, cy)

    if (candleIdx >= 0 && candleIdx < this._data.length) {
      const d = new Date(this._data[candleIdx].date)
      const dateLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      const dw = ctx.measureText(dateLabel).width
      const pad = 3
      const bgX = cx - dw / 2 - pad
      const bgY = m.top + chartH + 1
      ctx.fillStyle = this._colors.labelBg
      ctx.fillRect(bgX, bgY, dw + pad * 2, fs + pad * 2)
      ctx.fillStyle = this._colors.text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(dateLabel, cx, bgY + pad)
    }

    ctx.restore()
  }
}
