import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getStroke } from 'perfect-freehand'
import type { Point } from '../store'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSvgPathFromStroke(stroke: Point[]) {
  if (!stroke.length) return ''
  const d = getStroke(stroke, { size: 8, thinning: 0.5, smoothing: 0.5, streamline: 0.5, simulatePressure: false })
  if (!d || !d.length) return ''
  const dPath = d.reduce((acc, [x0, y0], i, arr) => {
    const [x1, y1] = arr[(i + 1) % arr.length]
    acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
    return acc
  }, ['M', ...d[0], 'Q'])
  dPath.push('Z')
  return dPath.join(' ')
}
