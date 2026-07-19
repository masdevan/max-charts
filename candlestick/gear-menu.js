import { createGearIcon } from '../icons/gear.js'
import { createLockIcon as createLockOpen } from '../icons/lock-open.js'
import { createLockIcon as createLockClosed } from '../icons/lock-closed.js'

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
    this._hoverReady = true
    const c = this._colors

    this._gearBtn = document.createElement('button')
    this._gearBtn.appendChild(createGearIcon(c.text))
    this._gearBtn.style.cssText =
      'position:absolute;cursor:pointer;z-index:3;' +
      'background:none;border:none;padding:2px;display:flex;align-items:center;justify-content:center'

    this._modal = document.createElement('div')
    this._modal.style.cssText = 'position:absolute;z-index:3;display:none;' +
      'background:' + c.bg + ';border:1px solid ' + c.grid + ';border-width:1px 0 0 1px;' +
      'padding:4px;' +
      'font-family:"Terminal Grotesque",monospace;font-size:11px;min-width:100px'

    const icon = this._priceLocked ? createLockClosed(c.text) : createLockOpen(c.text)
    this._lockIcon = icon
    this._modalLabel = document.createElement('span')
    this._modalLabel.textContent = this._priceLocked ? 'Chart Fixed' : 'Chart Auto'

    this._modalItem = document.createElement('div')
    this._modalItem.style.cssText =
      'display:flex;align-items:center;gap:5px;padding:4px 8px;cursor:pointer;color:' + c.text
    this._modalItem.addEventListener('mouseenter', () => {
      if (!this._hoverReady) return
      this._modalItem.style.background = c.grid
    })
    this._modalItem.addEventListener('mouseleave', () => {
      this._hoverReady = true
      this._modalItem.style.background = ''
    })
    this._modalItem.appendChild(this._lockIcon)
    this._modalItem.appendChild(this._modalLabel)
    this._modalItem.addEventListener('click', (e) => {
      e.stopPropagation()
      this._toggleLock()
      this._hideModal()
    })

    this._modal.appendChild(this._modalItem)

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
    this._modalItem.style.background = ''
    const icon = this._priceLocked ? createLockClosed(this._colors.text) : createLockOpen(this._colors.text)
    this._lockIcon = icon
    this._modalItem.replaceChild(this._lockIcon, this._modalItem.firstChild)
    this._modalLabel.textContent = this._priceLocked ? 'Chart Fixed' : 'Chart Auto'
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
      this._hoverReady = false
      setTimeout(() => { this._hoverReady = true }, 100)
      this._updateGearMenu()
      this._positionGearMenu()
    }
  },

  _hideModal() {
    this._modalOpen = false
    this._modal.style.display = 'none'
  }
}
