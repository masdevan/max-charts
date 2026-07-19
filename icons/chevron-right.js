export function createChevronRightIcon(color = '#666') {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('width', '6')
  svg.setAttribute('height', '6')
  svg.setAttribute('viewBox', '0 0 32 32')
  svg.setAttribute('fill', 'none')

  const p = document.createElementNS(ns, 'path')
  p.setAttribute('d', 'M12 30 L24 16 12 2')
  p.setAttribute('stroke', color)
  p.setAttribute('stroke-width', '2')
  p.setAttribute('stroke-linecap', 'round')
  p.setAttribute('stroke-linejoin', 'round')
  svg.appendChild(p)

  return svg
}
