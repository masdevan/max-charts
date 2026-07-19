import { createWalletIcon } from '../icons/wallet.js'
import { formatPrice } from './utils.js'

export default {
  _setupTradingButton() {
    this._tradingActive = false
    this._entryPrice = null
    this._slPrice = null
    this._tpPrice = null
    this._tradingDragging = null
    this._tradeLabelBoxes = []
    const c = this._colors

    this._walletGroup = document.createElement('div')
    this._walletGroup.style.cssText = 'display:flex;align-items:center;margin:8px 0 0 8px'

    this._walletBtn = document.createElement('button')
    const icon = createWalletIcon(c.text)
    icon.style.background = 'inherit'
    this._walletBtn.appendChild(icon)
    this._walletBtn.style.cssText =
      'cursor:pointer;background:transparent;border:none;padding:3px 3px;display:flex;align-items:center;justify-content:center;border-radius:2px'
    this._walletBtn.title = 'Trading'

    this._walletBtn.addEventListener('mouseenter', () => {
      this._walletBtn.style.background = c.grid
    })
    this._walletBtn.addEventListener('mouseleave', () => {
      if (!this._tradingActive) this._walletBtn.style.background = 'transparent'
    })
    this._walletBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this._toggleTrading()
    })

    this._walletGroup.appendChild(this._walletBtn)
    this._sidebar.appendChild(this._walletGroup)

    this._tradeBtnGroup = document.createElement('div')
    this._tradeBtnGroup.style.cssText =
      'position:absolute;display:none;gap:4px;z-index:999'
    this._sellBtn = document.createElement('button')
    this._sellBtn.textContent = 'Sell'
    this._sellBtn.style.cssText =
      'cursor:pointer;border:none;padding:4px 10px;border-radius:2px;font:10px "Terminal Grotesque",monospace;color:#fff;background:#ef5350'
    this._sellBtn.addEventListener('mouseenter', () => { this._sellBtn.style.background = '#c62828' })
    this._sellBtn.addEventListener('mouseleave', () => { this._sellBtn.style.background = '#ef5350' })
    this._buyBtn = document.createElement('button')
    this._buyBtn.textContent = 'Buy'
    this._buyBtn.style.cssText =
      'cursor:pointer;border:none;padding:4px 10px;border-radius:2px;font:10px "Terminal Grotesque",monospace;color:#fff;background:#2196F3'
    this._buyBtn.addEventListener('mouseenter', () => { this._buyBtn.style.background = '#1565C0' })
    this._buyBtn.addEventListener('mouseleave', () => { this._buyBtn.style.background = '#2196F3' })
    this._tradeBtnGroup.appendChild(this._sellBtn)
    this._tradeBtnGroup.appendChild(this._buyBtn)

    this._sellBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this._showTradeConfirmModal('Sell')
    })
    this._buyBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this._showTradeConfirmModal('Buy')
    })
    this._chartArea.appendChild(this._tradeBtnGroup)
  },

  _toggleTrading() {
    this._tradingActive = !this._tradingActive
    const c = this._colors
    this._walletBtn.style.background = this._tradingActive ? c.grid : 'transparent'
    this._tradeBtnGroup.style.display = this._tradingActive ? 'flex' : 'none'
    if (this._tradingActive) {
      const last = this._data[this._data.length - 1]
      if (last) this._entryPrice = last.close
      this._slPrice = null
      this._tpPrice = null
    }
    this._updateTradeButtons()
    this._render()
  },

  _deactivateTrading() {
    this._tradingActive = false
    this._walletBtn.style.background = 'transparent'
    this._tradeBtnGroup.style.display = 'none'
    this._render()
  },

  _showTradeConfirmModal(side) {
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.35);z-index:9999'
    const modal = document.createElement('div')
    modal.style.cssText =
      'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);' +
      'background:' + this._colors.bg + ';border:1px solid ' + this._colors.grid + ';' +
      'border-radius:4px;padding:12px 16px;' +
      'font:11px "Terminal Grotesque",monospace;color:' + this._colors.text + ';' +
      'min-width:160px;text-align:center'
    const color = side === 'Buy' ? '#2196F3' : '#ef5350'
    let html = '<div style="margin-bottom:6px;font-weight:bold;color:' + color + '">' + side + '</div>'
    html += '<div>Entry: ' + formatPrice(this._entryPrice, this._decimals) + '</div>'
    if (this._slPrice != null) {
      html += '<div style="color:rgb(239,83,80)">SL: ' + formatPrice(this._slPrice, this._decimals) + '</div>'
    }
    if (this._tpPrice != null) {
      html += '<div style="color:rgb(38,166,154)">TP: ' + formatPrice(this._tpPrice, this._decimals) + '</div>'
    }
    html += '<div style="display:flex;gap:6px;justify-content:center;margin-top:8px">' +
      '<button style="cursor:pointer;border:1px solid ' + this._colors.grid + ';border-radius:2px;padding:4px 12px;font:inherit;color:' + this._colors.text + ';background:' + this._colors.bg + '">Cancel</button>' +
      '<button style="cursor:pointer;border:none;border-radius:2px;padding:4px 12px;font:inherit;color:#fff;background:' + color + '">Confirm</button>' +
      '</div>'
    modal.innerHTML = html
    overlay.appendChild(modal)

    const close = () => { document.body.removeChild(overlay) }
    const confirmBtn = modal.querySelectorAll('button')[1]
    const cancelBtn = modal.querySelectorAll('button')[0]
    cancelBtn.addEventListener('mouseenter', () => { cancelBtn.style.background = this._colors.grid })
    cancelBtn.addEventListener('mouseleave', () => { cancelBtn.style.background = this._colors.bg })
    cancelBtn.addEventListener('click', close)
    confirmBtn.addEventListener('mouseenter', () => { confirmBtn.style.background = side === 'Buy' ? '#1565C0' : '#c62828' })
    confirmBtn.addEventListener('mouseleave', () => { confirmBtn.style.background = color })
    confirmBtn.addEventListener('click', () => {
      const trade = { side: side.toLowerCase(), entry: this._entryPrice, sl: this._slPrice, tp: this._tpPrice }
      const pk = this._positionKeys || { decision: 'decision', entry: 'entry', sl: 'sl', tp: 'tp', openTime: 'openTime', closeTime: 'closeTime' }
      const addPosition = () => {
        this._positions.push({
          [pk.decision]: trade.side,
          [pk.entry]: trade.entry,
          [pk.sl]: trade.sl,
          [pk.tp]: trade.tp,
          [pk.openTime]: new Date().toISOString(),
          [pk.closeTime]: null
        })
        this._render()
      }
      if (this._onTrade) {
        confirmBtn.disabled = true
        confirmBtn.textContent = '...'
        Promise.resolve(this._onTrade(trade)).then(() => {
          close()
          addPosition()
          this._deactivateTrading()
          this._showTradePlacedModal(side)
        }).catch((err) => {
          close()
          this._showTradePlacedModal(side, err.message || 'Error')
        })
      } else {
        close()
        addPosition()
        this._deactivateTrading()
        this._showTradePlacedModal(side)
      }
    })
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
    document.body.appendChild(overlay)
  },

  _showTradePlacedModal(side, error) {
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.35);z-index:9999'
    const modal = document.createElement('div')
    modal.style.cssText =
      'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);' +
      'background:' + this._colors.bg + ';border:1px solid ' + this._colors.grid + ';' +
      'border-radius:4px;padding:12px 16px;' +
      'font:11px "Terminal Grotesque",monospace;color:' + this._colors.text + ';' +
      'min-width:120px;text-align:center'
    modal.innerHTML =
      '<div style="color:' + (error ? '#ef5350' : 'inherit') + '">' + (error || side + ' order placed') + '</div>' +
      '<button style="cursor:pointer;border:1px solid ' + this._colors.grid + ';border-radius:2px;padding:4px 12px;font:inherit;color:' + this._colors.text + ';background:' + this._colors.bg + ';margin-top:8px">OK</button>'
    overlay.appendChild(modal)
    const close = () => { document.body.removeChild(overlay) }
    modal.querySelector('button').addEventListener('mouseenter', () => { modal.querySelector('button').style.background = this._colors.grid })
    modal.querySelector('button').addEventListener('mouseleave', () => { modal.querySelector('button').style.background = this._colors.bg })
    modal.querySelector('button').addEventListener('click', close)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
    document.body.appendChild(overlay)
  },

  _updateTradeButtons() {
    const tpAbove = this._tpPrice != null && this._tpPrice > this._entryPrice
    const slBelow = this._slPrice != null && this._slPrice < this._entryPrice
    const tpBelow = this._tpPrice != null && this._tpPrice < this._entryPrice
    const slAbove = this._slPrice != null && this._slPrice > this._entryPrice
    const isLong = tpAbove || slBelow
    const isShort = tpBelow || slAbove
    const canBuy = !isShort
    const canSell = !isLong
    this._buyBtn.style.opacity = canBuy ? '1' : '0.3'
    this._buyBtn.style.pointerEvents = canBuy ? 'auto' : 'none'
    this._sellBtn.style.opacity = canSell ? '1' : '0.3'
    this._sellBtn.style.pointerEvents = canSell ? 'auto' : 'none'
    const m = this._lastMargin
    if (m) {
      this._tradeBtnGroup.style.top = m.top + 4 + 'px'
      this._tradeBtnGroup.style.right = (m.right || 0) + 4 + 'px'
    }
  },

  _hitTestTradeLabels(mx, my) {
    for (const box of this._tradeLabelBoxes) {
      if (mx >= box.x && mx <= box.x + box.w && my >= box.y && my <= box.y + box.h) {
        return box
      }
    }
    return null
  },

  _renderTradingLines(ctx) {
    this._tradeLabelBoxes = []
    if (!this._tradingActive || this._entryPrice == null) return
    const m = this._lastMargin || this._getMargin()
    const chartW = this._width - m.left - m.right
    const chartH = this._height - m.top - m.bottom
    if (chartW <= 0 || chartH <= 0) return
    const minP = this._minP, maxP = this._maxP
    if (minP == null || maxP == null) return
    const yPos = (price) => m.top + chartH - (price - minP) / (maxP - minP) * chartH
    const fs = this._fontSize()
    const padX = 6, padY = 2, r = 3, gap = 4

    function drawHorizLine(y, color, dashed) {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      if (dashed) ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(m.left, y)
      ctx.lineTo(m.left + chartW, y)
      ctx.stroke()
      ctx.restore()
    }

    function drawLabelBox(text, color, cx, cy) {
      ctx.font = Math.max(8, fs - 1) + 'px "Terminal Grotesque", monospace'
      const tw = ctx.measureText(text).width
      const bw = tw + padX * 2, bh = fs + padY * 2
      const bx = cx - bw / 2, by = cy - bh / 2
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(bx + r, by)
      ctx.lineTo(bx + bw - r, by)
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r)
      ctx.lineTo(bx + bw, by + bh - r)
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh)
      ctx.lineTo(bx + r, by + bh)
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r)
      ctx.lineTo(bx, by + r)
      ctx.quadraticCurveTo(bx, by, bx + r, by)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.fillText(text, cx, cy)
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'
      return { x: bx, y: by, w: bw, h: bh }
    }

    const lines = []
    if (this._slPrice != null) {
      lines.push({ price: this._slPrice, color: 'rgb(239,83,80)', type: 'sl' })
    }
    if (this._tpPrice != null) {
      lines.push({ price: this._tpPrice, color: 'rgb(38,166,154)', type: 'tp' })
    }

    for (const l of lines) {
      const ly = yPos(l.price)
      if (ly < m.top || ly > m.top + chartH) continue
      drawHorizLine(ly, l.color, true)

      ctx.font = Math.max(8, fs - 1) + 'px "Terminal Grotesque", monospace'
      const labelText = l.type.toUpperCase()
      const xText = ' ×'
      const fullText = labelText + xText
      const tw = ctx.measureText(fullText).width
      const bw = tw + padX * 2, bh = fs + padY * 2
      const cx = m.left + chartW / 2
      const bx = cx - bw / 2, by = ly - bh / 2

      ctx.fillStyle = l.color
      ctx.beginPath()
      ctx.moveTo(bx + r, by)
      ctx.lineTo(bx + bw - r, by)
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r)
      ctx.lineTo(bx + bw, by + bh - r)
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh)
      ctx.lineTo(bx + r, by + bh)
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r)
      ctx.lineTo(bx, by + r)
      ctx.quadraticCurveTo(bx, by, bx + r, by)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#fff'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.fillText(fullText, cx, ly)
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'

      const xAreaW = 14
      this._tradeLabelBoxes.push({ type: l.type, x: bx, y: by, w: bw - xAreaW, h: bh })
      this._tradeLabelBoxes.push({ type: l.type, x: bx + bw - xAreaW, y: by, w: xAreaW, h: bh, remove: true })
    }

    const ey = yPos(this._entryPrice)
    if (ey < m.top || ey > m.top + chartH) return
    drawHorizLine(ey, 'rgba(128,128,128,0.6)', false)

    const entryLabels = []
    if (this._slPrice == null) entryLabels.push({ text: 'SL', color: 'rgb(239,83,80)', type: 'sl' })
    entryLabels.push({ text: 'Entry', color: 'rgb(80,80,80)', type: 'entry' })
    if (this._tpPrice == null) entryLabels.push({ text: 'TP', color: 'rgb(38,166,154)', type: 'tp' })

    ctx.font = Math.max(8, fs - 1) + 'px "Terminal Grotesque", monospace'
    let totalW = 0
    const meas = entryLabels.map(l => {
      const tw = ctx.measureText(l.text).width
      totalW += tw + padX * 2
      return tw
    })
    totalW += gap * (entryLabels.length - 1)
    const startX = m.left + chartW / 2 - totalW / 2
    let curX = startX
    entryLabels.forEach((l, i) => {
      const tw = meas[i]
      const cx = curX + (tw + padX * 2) / 2
      const box = drawLabelBox(l.text, l.color, cx, ey)
      if (l.type !== 'entry') this._tradeLabelBoxes.push({ type: l.type, x: box.x, y: box.y, w: box.w, h: box.h })
      curX += tw + padX * 2 + gap
    })

    const rightPrices = [{ price: this._entryPrice, color: 'rgba(128,128,128,0.6)' }]
    if (this._slPrice != null) rightPrices.push({ price: this._slPrice, color: 'rgb(239,83,80)' })
    if (this._tpPrice != null) rightPrices.push({ price: this._tpPrice, color: 'rgb(38,166,154)' })
    ctx.font = fs + 'px "Terminal Grotesque", monospace'
    const pad = 3
    for (const rp of rightPrices) {
      const py = yPos(rp.price)
      if (py < m.top || py > m.top + chartH) continue
      const text = formatPrice(rp.price, this._decimals)
      const tw = ctx.measureText(text).width
      const bx = m.left + chartW + 1
      const by = py - fs / 2 - pad
      ctx.fillStyle = rp.color
      ctx.fillRect(bx, by, tw + pad * 2, fs + pad * 2)
      ctx.fillStyle = '#fff'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillText(text, bx + pad, py)
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'
    }
  }
}
