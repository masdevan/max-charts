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
