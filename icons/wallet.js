export function createWalletIcon(color = '#666') {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('width', '16')
  svg.setAttribute('height', '16')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')

  const p = document.createElementNS(ns, 'path')
  p.setAttribute('d', 'M21 12C21 11.4477 20.5523 11 20 11H3V18C3 19.6569 4.34315 21 6 21H20C20.5523 21 21 20.5523 21 20V12Z')
  p.setAttribute('stroke', color)
  p.setAttribute('stroke-width', '2')
  p.setAttribute('stroke-linecap', 'round')
  p.setAttribute('stroke-linejoin', 'round')
  svg.appendChild(p)

  const p2 = document.createElementNS(ns, 'path')
  p2.setAttribute('d', 'M3 11V6C3 5.44772 3.44772 5 4 5H18C18.5523 5 19 5.44772 19 6V11')
  p2.setAttribute('stroke', color)
  p2.setAttribute('stroke-width', '2')
  p2.setAttribute('stroke-linecap', 'round')
  p2.setAttribute('stroke-linejoin', 'round')
  svg.appendChild(p2)

  const p3 = document.createElementNS(ns, 'path')
  p3.setAttribute('d', 'M18 16C18.5523 16 19 15.5523 19 15C19 14.4477 18.5523 14 18 14C17.4477 14 17 14.4477 17 15C17 15.5523 17.4477 16 18 16Z')
  p3.setAttribute('fill', color)
  svg.appendChild(p3)

  return svg
}
