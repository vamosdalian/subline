/** Inline Lucide icons (https://lucide.dev) — ISC licensed. */

const SVG_NS = 'http://www.w3.org/2000/svg'

const LUCIDE_ATTRS: Record<string, string> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round'
}

const FOLDER_PATH =
  'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'

function createIcon(pathData: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  for (const [key, value] of Object.entries(LUCIDE_ATTRS)) {
    svg.setAttribute(key, value)
  }
  svg.classList.add('lucide-icon')
  svg.setAttribute('aria-hidden', 'true')

  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', pathData)
  svg.appendChild(path)

  return svg
}

export function createFolderIcon(): SVGSVGElement {
  return createIcon(FOLDER_PATH)
}
