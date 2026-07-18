export function niceStep(range) {
  const roughStep = range / 5
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)))
  const res = roughStep / mag
  if (res <= 1.5) return 1 * mag
  if (res <= 3.5) return 2 * mag
  if (res <= 7.5) return 5 * mag
  return 10 * mag
}

export function formatPrice(p, decimals) {
  if (decimals != null) return p.toFixed(decimals)
  if (p >= 1000) return p.toFixed(2)
  if (p >= 1) return p.toFixed(2)
  return p.toFixed(4)
}
