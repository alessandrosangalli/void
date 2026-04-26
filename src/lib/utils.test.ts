import { describe, it, expect } from 'vitest'
import { getSvgPathFromStroke } from './utils'
import type { Point } from '../store'

describe('getSvgPathFromStroke', () => {
  it('returns empty string for empty stroke', () => {
    expect(getSvgPathFromStroke([])).toBe('')
  })

  it('returns valid SVG path for a simple stroke', () => {
    const stroke: Point[] = [
      [100, 100, 0.5], [110, 105, 0.5], [120, 110, 0.5],
      [130, 108, 0.5], [140, 100, 0.5],
    ]
    const path = getSvgPathFromStroke(stroke)
    expect(path).toMatch(/^M/)
    expect(path).toContain('Q')
    expect(path).toMatch(/Z$/)
  })

  it('handles single-point stroke without crash', () => {
    const path = getSvgPathFromStroke([[50, 50, 0.5]])
    expect(typeof path).toBe('string')
  })

  it('handles two-point stroke', () => {
    const path = getSvgPathFromStroke([[50, 50, 0.5], [60, 55, 0.5]])
    expect(typeof path).toBe('string')
  })

  it('handles zero pressure', () => {
    const path = getSvgPathFromStroke([[100, 100, 0], [110, 105, 0], [120, 110, 0]])
    expect(typeof path).toBe('string')
  })

  it('handles long strokes without throwing', () => {
    const stroke: Point[] = Array.from({ length: 500 }, (_, i) => [
      100 + Math.sin(i * 0.1) * 50, 100 + i * 0.5, 0.5,
    ] as Point)
    const path = getSvgPathFromStroke(stroke)
    expect(path.length).toBeGreaterThan(0)
  })

  it('handles negative coordinates', () => {
    const path = getSvgPathFromStroke([[-100, -200, 0.5], [-90, -195, 0.5], [-80, -190, 0.5]])
    expect(typeof path).toBe('string')
  })

  it('produces different paths for different strokes', () => {
    const p1 = getSvgPathFromStroke([[100, 100, 0.5], [200, 200, 0.5], [300, 100, 0.5]])
    const p2 = getSvgPathFromStroke([[100, 100, 0.5], [200, 50, 0.5], [300, 100, 0.5]])
    expect(p1).not.toBe(p2)
  })
})
