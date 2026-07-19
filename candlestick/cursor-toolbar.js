import { createCursorIcon } from '../icons/cursor.js'
import { createCrosshairIcon } from '../icons/crosshair-icon.js'
import { createChevronRightIcon } from '../icons/chevron-right.js'

export default {
  _setupCursorToolbar() {
    this._cursorMode = false
    this._toolbarOpen = false
    this._hoverReady = true
    const c = this._colors

    this._sidebar.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:28px;flex-shrink:0;position:relative;z-index:1001;background:' + c.bg

    this._cursorGroup = document.createElement('div')
    this._cursorGroup.style.cssText =
      'display:flex;align-items:center;position:relative;margin:12px 0 0 8px'

    this._cursorBtn = document.createElement('button')
    this._cursorBtn.style.cssText = 'cursor:pointer;background:transparent;border:none;padding:3px 3px;display:flex;align-items:center;justify-content:center;border-radius:2px'
    const cursorIcon = createCursorIcon(c.text)
    cursorIcon.style.background = 'inherit'
    this._cursorBtnIcon = cursorIcon
    const crosshairIcon = createCrosshairIcon(c.text)
    crosshairIcon.style.background = 'inherit'
    this._crosshairBtnIcon = crosshairIcon
    this._cursorBtn.appendChild(this._crosshairBtnIcon)
    this._cursorBtn.title = 'Cursor'

    this._chevronBtn = document.createElement('button')
    this._chevronBtn.style.cssText =
      'cursor:pointer;background:transparent;border:none;margin-left:1px;padding:3px 0 3px 0px;display:flex;align-items:center;justify-content:center;border-radius:2px;position:absolute;left:100%;top:0;height:100%;opacity:0;z-index:1000'
    this._chevronIcon = createChevronRightIcon(c.text)
    this._chevronIcon.style.background = 'inherit'
    this._chevronBtn.appendChild(this._chevronIcon)
    this._chevronBtn.title = 'More'


    this._cursorGroup.appendChild(this._cursorBtn)
    this._cursorGroup.appendChild(this._chevronBtn)

    const styleId = 'oc-cursor-hover'
    if (!document.getElementById(styleId)) {
      const s = document.createElement('style')
      s.id = styleId
      s.textContent = '.oc-cg:hover .oc-cv{opacity:1!important}'
      document.head.appendChild(s)
    }
    this._cursorGroup.className = 'oc-cg'
    this._chevronBtn.className = 'oc-cv'

    this._cursorGroup.addEventListener('mouseenter', () => {
      this._chevronBtn.style.background = c.grid
      if (this._toolbarOpen) this._chevronBtn.style.opacity = '1'
    })
    this._cursorGroup.addEventListener('mouseleave', () => {
      this._chevronBtn.style.background = 'transparent'
      if (this._toolbarOpen) this._chevronBtn.style.opacity = '1'
    })

    this._toolbarPopup = document.createElement('div')
    this._toolbarPopup.style.cssText =
      'position:absolute;z-index:1001;display:none;top:11px;left:39px;' +
      'background:' + c.bg + ';border:1px solid ' + c.grid + ';' +
      'padding:4px;' +
      'font-family:"Terminal Grotesque",monospace;font-size:10px;min-width:120px'

    const crosshairItem = document.createElement('div')
    crosshairItem.style.cssText =
      'display:flex;align-items:center;gap:5px;padding:4px 8px;cursor:pointer;color:' + c.text
    crosshairItem.style.background = 'inherit'
    const crosshairSvg = createCrosshairIcon(c.text)
    crosshairSvg.style.background = 'inherit'
    crosshairItem.appendChild(crosshairSvg)
    crosshairItem.appendChild(document.createTextNode('Crosshair'))
    crosshairItem.addEventListener('mouseenter', () => {
      if (this._cursorMode !== false) crosshairItem.style.background = c.grid
    })
    crosshairItem.addEventListener('mouseleave', () => {
      if (this._cursorMode !== false) crosshairItem.style.background = ''
    })
    crosshairItem.addEventListener('click', (e) => {
      e.stopPropagation()
      this._setCursorMode(false)
      this._hideToolbarPopup()
    })
    this._toolbarPopup.appendChild(crosshairItem)

    const cursorItem = document.createElement('div')
    cursorItem.style.cssText =
      'display:flex;align-items:center;gap:5px;padding:4px 8px;cursor:pointer;color:' + c.text
    cursorItem.style.background = 'inherit'
    const cursorItemIcon = createCursorIcon(c.text)
    cursorItemIcon.style.background = 'inherit'
    cursorItem.appendChild(cursorItemIcon)
    cursorItem.appendChild(document.createTextNode('Cursor'))
    cursorItem.addEventListener('mouseenter', () => {
      if (this._cursorMode !== true) cursorItem.style.background = c.grid
    })
    cursorItem.addEventListener('mouseleave', () => {
      if (this._cursorMode !== true) cursorItem.style.background = ''
    })
    cursorItem.addEventListener('click', (e) => {
      e.stopPropagation()
      this._setCursorMode(true)
      this._hideToolbarPopup()
    })
    this._toolbarPopup.appendChild(cursorItem)

    this._updatePopupActive()

    this._cursorBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this._setCursorMode(true)
      this._hideToolbarPopup()
    })

    this._chevronBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this._toggleToolbarPopup()
    })

    this._onToolbarDocClick = (e) => {
      if (this._toolbarOpen && !this._toolbarPopup.contains(e.target) && !this._cursorGroup.contains(e.target)) {
        this._hideToolbarPopup()
      }
    }
    document.addEventListener('click', this._onToolbarDocClick)

    this._sidebar.appendChild(this._cursorGroup)
    this._sidebar.appendChild(this._toolbarPopup)

    this._toolbarPopup.style.display = 'block'
    this._toolbarPopupHeight = this._toolbarPopup.offsetHeight
    this._toolbarPopup.style.display = 'none'
  },

  _setCursorMode(cursorMode) {
    this._cursorMode = cursorMode
    const c = this._colors
    this._cursorBtn.style.background = cursorMode ? c.grid : 'transparent'
    this._cursorBtn.textContent = ''
    this._cursorBtn.appendChild(cursorMode ? this._cursorBtnIcon : this._crosshairBtnIcon)
    this._updatePopupActive()
    if (this._mouseX != null) this._render()
  },

  _updatePopupActive() {
    const items = this._toolbarPopup.children
    if (items.length < 2) return
    const crosshairItem = items[0]
    const cursorItem = items[1]
    crosshairItem.style.background = this._cursorMode ? '' : this._colors.grid
    cursorItem.style.background = this._cursorMode ? this._colors.grid : ''
  },

  _toggleToolbarPopup() {
    this._toolbarOpen = !this._toolbarOpen
    this._toolbarPopup.style.display = this._toolbarOpen ? 'block' : 'none'
    if (this._toolbarOpen) {
      this._hoverReady = false
      setTimeout(() => { this._hoverReady = true }, 100)
      this._chevronBtn.style.background = this._colors.grid
      this._chevronBtn.style.opacity = '1'
      this._updatePopupActive()
    }
  },

  _hideToolbarPopup() {
    this._toolbarOpen = false
    this._toolbarPopup.style.display = 'none'
    this._chevronBtn.style.background = 'transparent'
    this._chevronBtn.style.opacity = '0'
  }
}
