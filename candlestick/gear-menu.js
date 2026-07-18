import { createGearIcon } from '../icons/gear.js'

export default {
  _toggleLock() {
    this._priceLocked = !this._priceLocked
    if (!this._priceLocked) {
      this._frozenMinP = this._minP
      this._frozenMaxP = this._maxP
    }
    this._updateGearMenu()
    this._render()
  },

  _setupGearMenu() {
    this._modalOpen = false
    const c = this._colors

    this._gearBtn = document.createElement('button')
    this._gearBtn.appendChild(createGearIcon(c.text))
    this._gearBtn.style.cssText =
      'position:absolute;cursor:pointer;z-index:3;' +
      'background:none;border:none;padding:2px;display:flex;align-items:center;justify-content:center'

    this._modal = document.createElement('div')
    this._modal.style.cssText = 'position:absolute;z-index:3;display:none;' +
      'background:' + c.bg + ';border:1px solid ' + c.grid + ';border-width:1px 0 0 1px;' +
      'padding:4px 0;' +
      'font-family:"Terminal Grotesque",monospace;font-size:11px;min-width:100px'

    this._modalAuto = document.createElement('div')
    this._modalAuto.textContent = 'Chart Auto'
    this._modalAuto.style.cssText = 'padding:4px 10px;cursor:pointer;color:' + c.text
    this._modalAuto.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!this._priceLocked) this._toggleLock()
      this._hideModal()
    })

    this._modalFixed = document.createElement('div')
    this._modalFixed.textContent = 'Chart Fixed'
    this._modalFixed.style.cssText = 'padding:4px 10px;margin-top:4px;cursor:pointer;color:' + c.text
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

    this._modal.style.display = 'block'
    this._modalHeight = this._modal.offsetHeight
    this._modal.style.display = 'none'
  },

  _updateGearMenu() {
    const active = this._colors.grid
    const inactive = this._colors.bg
    this._modalAuto.style.background = this._priceLocked ? active : inactive
    this._modalFixed.style.background = this._priceLocked ? inactive : active
  },

  _positionGearMenu() {
    if (!this._modal) return
    this._gearBtn.style.bottom = '4px'
    this._gearBtn.style.right = '6px'
    const m = this._lastMargin || this._getMargin()
    this._modal.style.bottom = (m.bottom + 0.5) + 'px'
    this._modal.style.right = m.right + 'px'
  },

  _toggleModal() {
    this._modalOpen = !this._modalOpen
    this._modal.style.display = this._modalOpen ? 'block' : 'none'
    if (this._modalOpen) {
      this._updateGearMenu()
      this._positionGearMenu()
    }
  },

  _hideModal() {
    this._modalOpen = false
    this._modal.style.display = 'none'
  }
}
