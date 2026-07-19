export function createLockIcon(color = '#666') {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('width', '14')
  svg.setAttribute('height', '14')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')

  const body = document.createElementNS(ns, 'path')
  body.setAttribute('d', 'M8.1819 10.7027H6.00008C5.44781 10.7027 5.0001 11.1485 5.00009 11.7008C5.00005 13.3483 5 16.6772 5.00011 18.9189C5.00023 21.4317 8.88618 22 12 22C15.1139 22 19 21.4317 19 18.9189C19 16.6773 19 13.3483 19 11.7008C19 11.1485 18.5523 10.7027 18 10.7027H15.8182')
  body.setAttribute('stroke', color)
  body.setAttribute('stroke-width', '2')
  body.setAttribute('stroke-linecap', 'round')
  body.setAttribute('stroke-linejoin', 'round')
  svg.appendChild(body)

  const shackle = document.createElementNS(ns, 'path')
  shackle.setAttribute('d', 'M8.18185 10.7027C8.18185 10.7027 8.18189 8.13513 8.18185 6.59459C8.18181 4.74571 9.70882 3 12 3C14.2912 3 15.8181 4.74571 15.8181 6.59459')
  shackle.setAttribute('stroke', color)
  shackle.setAttribute('stroke-width', '2')
  shackle.setAttribute('stroke-linecap', 'round')
  shackle.setAttribute('stroke-linejoin', 'round')
  svg.appendChild(shackle)

  const keyhole = document.createElementNS(ns, 'path')
  keyhole.setAttribute('fill-rule', 'evenodd')
  keyhole.setAttribute('clip-rule', 'evenodd')
  keyhole.setAttribute('d', 'M13 16.6181V18C13 18.5523 12.5523 19 12 19C11.4477 19 11 18.5523 11 18V16.6181C10.6931 16.3434 10.5 15.9442 10.5 15.5C10.5 14.6716 11.1716 14 12 14C12.8284 14 13.5 14.6716 13.5 15.5C13.5 15.9442 13.3069 16.3434 13 16.6181Z')
  keyhole.setAttribute('fill', color)
  svg.appendChild(keyhole)

  return svg
}
