import { describe, it, expect } from 'vitest'
import {
  screenToWorld,
  worldToScreen,
  clampZoom,
  zoomAtPoint,
  zoomAtCenter,
  wheelDeltaToZoomFactor,
  panCamera,
  isDiscreteWheelEvent,
  pinchZoomFactor,
  pointerDistance,
  pointerMidpoint,
  fitImageDimensions,
  ZOOM_MIN,
  ZOOM_MAX,
} from './camera.utils'

// ──────────────────────────────────────
// screenToWorld / worldToScreen
// ──────────────────────────────────────

describe('screenToWorld', () => {
  it('converts at identity camera (no pan, zoom=1)', () => {
    const result = screenToWorld(500, 300, { x: 0, y: 0, zoom: 1 })
    expect(result).toEqual({ x: 500, y: 300 })
  })

  it('accounts for camera pan offset', () => {
    const result = screenToWorld(500, 300, { x: 100, y: 50, zoom: 1 })
    expect(result).toEqual({ x: 400, y: 250 })
  })

  it('accounts for zoom', () => {
    const result = screenToWorld(500, 300, { x: 0, y: 0, zoom: 2 })
    expect(result).toEqual({ x: 250, y: 150 })
  })

  it('combines pan and zoom', () => {
    // screen(500, 300), camera offset (100, 50), zoom 2
    // world = (500 - 100) / 2 = 200, (300 - 50) / 2 = 125
    const result = screenToWorld(500, 300, { x: 100, y: 50, zoom: 2 })
    expect(result).toEqual({ x: 200, y: 125 })
  })

  it('handles extreme zoom out', () => {
    const result = screenToWorld(500, 300, { x: 0, y: 0, zoom: 0.05 })
    expect(result.x).toBeCloseTo(10000)
    expect(result.y).toBeCloseTo(6000)
  })

  it('handles negative camera offsets', () => {
    const result = screenToWorld(100, 100, { x: -200, y: -300, zoom: 1 })
    expect(result).toEqual({ x: 300, y: 400 })
  })

  it('handles origin (0,0) screen coordinates', () => {
    const result = screenToWorld(0, 0, { x: 100, y: 200, zoom: 1 })
    expect(result).toEqual({ x: -100, y: -200 })
  })
})

describe('worldToScreen', () => {
  it('converts at identity camera', () => {
    const result = worldToScreen(500, 300, { x: 0, y: 0, zoom: 1 })
    expect(result).toEqual({ x: 500, y: 300 })
  })

  it('applies camera offset', () => {
    const result = worldToScreen(400, 250, { x: 100, y: 50, zoom: 1 })
    expect(result).toEqual({ x: 500, y: 300 })
  })

  it('applies zoom', () => {
    const result = worldToScreen(250, 150, { x: 0, y: 0, zoom: 2 })
    expect(result).toEqual({ x: 500, y: 300 })
  })

  it('is the inverse of screenToWorld', () => {
    const camera = { x: 137, y: -42, zoom: 1.7 }
    const screen = { x: 800, y: 600 }
    const world = screenToWorld(screen.x, screen.y, camera)
    const backToScreen = worldToScreen(world.x, world.y, camera)
    expect(backToScreen.x).toBeCloseTo(screen.x)
    expect(backToScreen.y).toBeCloseTo(screen.y)
  })
})

// ──────────────────────────────────────
// clampZoom
// ──────────────────────────────────────

describe('clampZoom', () => {
  it('returns value within range as-is', () => {
    expect(clampZoom(1)).toBe(1)
    expect(clampZoom(5)).toBe(5)
    expect(clampZoom(0.5)).toBe(0.5)
  })

  it('clamps below minimum', () => {
    expect(clampZoom(0.01)).toBe(ZOOM_MIN)
    expect(clampZoom(0)).toBe(ZOOM_MIN)
    expect(clampZoom(-5)).toBe(ZOOM_MIN)
  })

  it('clamps above maximum', () => {
    expect(clampZoom(25)).toBe(ZOOM_MAX)
    expect(clampZoom(100)).toBe(ZOOM_MAX)
  })

  it('returns exact boundary values', () => {
    expect(clampZoom(ZOOM_MIN)).toBe(ZOOM_MIN)
    expect(clampZoom(ZOOM_MAX)).toBe(ZOOM_MAX)
  })
})

// ──────────────────────────────────────
// zoomAtPoint
// ──────────────────────────────────────

describe('zoomAtPoint', () => {
  const camera = { x: 0, y: 0, zoom: 1 }

  it('zooms in (factor > 1)', () => {
    const result = zoomAtPoint(camera, 2, 500, 300)
    expect(result.zoom).toBe(2)
  })

  it('zooms out (factor < 1)', () => {
    const result = zoomAtPoint(camera, 0.5, 500, 300)
    expect(result.zoom).toBe(0.5)
  })

  it('preserves focal point in world coords', () => {
    const focalX = 500
    const focalY = 300
    
    // The world point under the cursor should remain the same after zoom
    const worldBefore = screenToWorld(focalX, focalY, camera)
    const newCamera = zoomAtPoint(camera, 2, focalX, focalY)
    const worldAfter = screenToWorld(focalX, focalY, newCamera)
    
    expect(worldAfter.x).toBeCloseTo(worldBefore.x)
    expect(worldAfter.y).toBeCloseTo(worldBefore.y)
  })

  it('clamps zoom to max', () => {
    const result = zoomAtPoint({ x: 0, y: 0, zoom: 15 }, 2, 500, 300)
    expect(result.zoom).toBe(ZOOM_MAX)
  })

  it('clamps zoom to min', () => {
    const result = zoomAtPoint({ x: 0, y: 0, zoom: 0.1 }, 0.1, 500, 300)
    expect(result.zoom).toBe(ZOOM_MIN)
  })

  it('factor = 1 returns same zoom (identity)', () => {
    const result = zoomAtPoint(camera, 1, 500, 300)
    expect(result.zoom).toBe(camera.zoom)
    expect(result.x).toBeCloseTo(camera.x)
    expect(result.y).toBeCloseTo(camera.y)
  })
})

// ──────────────────────────────────────
// zoomAtCenter
// ──────────────────────────────────────

describe('zoomAtCenter', () => {
  const camera = { x: 100, y: 50, zoom: 1 }
  const vw = 1920
  const vh = 1080

  it('resets to identity', () => {
    const result = zoomAtCenter(camera, 'reset', vw, vh)
    expect(result).toEqual({ zoom: 1, x: 0, y: 0 })
  })

  it('zooms in increases zoom level', () => {
    const result = zoomAtCenter(camera, 'in', vw, vh)
    expect(result.zoom).toBeGreaterThan(camera.zoom)
  })

  it('zooms out decreases zoom level', () => {
    const result = zoomAtCenter(camera, 'out', vw, vh)
    expect(result.zoom).toBeLessThan(camera.zoom)
  })

  it('zoom in then zoom out returns approximately to original', () => {
    const zoomed = zoomAtCenter(camera, 'in', vw, vh)
    const back = zoomAtCenter(zoomed, 'out', vw, vh)
    expect(back.zoom).toBeCloseTo(camera.zoom, 5)
    expect(back.x).toBeCloseTo(camera.x, 5)
    expect(back.y).toBeCloseTo(camera.y, 5)
  })

  it('preserves center world point through zoom', () => {
    const centerWorldBefore = screenToWorld(vw / 2, vh / 2, camera)
    const newCamera = zoomAtCenter(camera, 'in', vw, vh)
    const centerWorldAfter = screenToWorld(vw / 2, vh / 2, newCamera)
    expect(centerWorldAfter.x).toBeCloseTo(centerWorldBefore.x)
    expect(centerWorldAfter.y).toBeCloseTo(centerWorldBefore.y)
  })
})

// ──────────────────────────────────────
// wheelDeltaToZoomFactor
// ──────────────────────────────────────

describe('wheelDeltaToZoomFactor', () => {
  it('negative delta (scroll up) produces factor > 1 (zoom in)', () => {
    const factor = wheelDeltaToZoomFactor(-100, false)
    expect(factor).toBeGreaterThan(1)
  })

  it('positive delta (scroll down) produces factor < 1 (zoom out)', () => {
    const factor = wheelDeltaToZoomFactor(100, false)
    expect(factor).toBeLessThan(1)
  })

  it('zero delta produces factor = 1', () => {
    const factor = wheelDeltaToZoomFactor(0, false)
    expect(factor).toBe(1)
  })

  it('discrete wheel is less sensitive than trackpad', () => {
    const discrete = wheelDeltaToZoomFactor(100, true)
    const smooth = wheelDeltaToZoomFactor(100, false)
    // Discrete uses smaller sensitivity, so the factor should be closer to 1
    expect(Math.abs(1 - discrete)).toBeLessThan(Math.abs(1 - smooth))
  })
})

// ──────────────────────────────────────
// panCamera
// ──────────────────────────────────────

describe('panCamera', () => {
  it('pans by positive delta', () => {
    const result = panCamera({ x: 100, y: 200, zoom: 1 }, 50, 30)
    expect(result).toEqual({ x: 150, y: 230, zoom: 1 })
  })

  it('pans by negative delta', () => {
    const result = panCamera({ x: 100, y: 200, zoom: 1 }, -50, -30)
    expect(result).toEqual({ x: 50, y: 170, zoom: 1 })
  })

  it('preserves zoom', () => {
    const result = panCamera({ x: 0, y: 0, zoom: 3.5 }, 100, 100)
    expect(result.zoom).toBe(3.5)
  })

  it('zero delta is identity', () => {
    const camera = { x: 100, y: 200, zoom: 1.5 }
    expect(panCamera(camera, 0, 0)).toEqual(camera)
  })
})

// ──────────────────────────────────────
// isDiscreteWheelEvent
// ──────────────────────────────────────

describe('isDiscreteWheelEvent', () => {
  it('deltaMode !== 0 is discrete (line/page mode)', () => {
    expect(isDiscreteWheelEvent(1, 3, 0)).toBe(true)
    expect(isDiscreteWheelEvent(2, 3, 0)).toBe(true)
  })

  it('large deltaY with small deltaX is discrete (mouse wheel)', () => {
    expect(isDiscreteWheelEvent(0, 120, 0)).toBe(true)
    expect(isDiscreteWheelEvent(0, -120, 0)).toBe(true)
    expect(isDiscreteWheelEvent(0, 20, 0)).toBe(true)
  })

  it('small deltaY is smooth (trackpad)', () => {
    expect(isDiscreteWheelEvent(0, 5, 0)).toBe(false)
    expect(isDiscreteWheelEvent(0, 3, 2)).toBe(false)
  })

  it('large deltaX disqualifies discrete', () => {
    expect(isDiscreteWheelEvent(0, 120, 5)).toBe(false)
  })
})

// ──────────────────────────────────────
// Pinch gesture utilities
// ──────────────────────────────────────

describe('pinchZoomFactor', () => {
  it('same distance returns 1', () => {
    expect(pinchZoomFactor(100, 100)).toBe(1)
  })

  it('increasing distance zooms in', () => {
    expect(pinchZoomFactor(200, 100)).toBe(2)
  })

  it('decreasing distance zooms out', () => {
    expect(pinchZoomFactor(50, 100)).toBe(0.5)
  })

  it('handles zero previous distance', () => {
    expect(pinchZoomFactor(100, 0)).toBe(1)
  })
})

describe('pointerDistance', () => {
  it('calculates horizontal distance', () => {
    expect(pointerDistance({ x: 0, y: 0 }, { x: 100, y: 0 })).toBe(100)
  })

  it('calculates diagonal distance', () => {
    expect(pointerDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })

  it('same point = 0', () => {
    expect(pointerDistance({ x: 50, y: 50 }, { x: 50, y: 50 })).toBe(0)
  })

  it('is commutative', () => {
    const a = { x: 10, y: 20 }
    const b = { x: 30, y: 40 }
    expect(pointerDistance(a, b)).toBe(pointerDistance(b, a))
  })
})

describe('pointerMidpoint', () => {
  it('calculates midpoint', () => {
    expect(pointerMidpoint({ x: 0, y: 0 }, { x: 100, y: 200 })).toEqual({ x: 50, y: 100 })
  })

  it('same point returns same point', () => {
    expect(pointerMidpoint({ x: 50, y: 50 }, { x: 50, y: 50 })).toEqual({ x: 50, y: 50 })
  })
})

// ──────────────────────────────────────
// fitImageDimensions
// ──────────────────────────────────────

describe('fitImageDimensions', () => {
  it('returns original dimensions if within max', () => {
    expect(fitImageDimensions(400, 300, 800)).toEqual({ w: 400, h: 300 })
  })

  it('scales down to maxWidth preserving aspect ratio', () => {
    const result = fitImageDimensions(1600, 900, 800)
    expect(result.w).toBe(800)
    expect(result.h).toBe(450)
  })

  it('handles square images', () => {
    const result = fitImageDimensions(1000, 1000, 800)
    expect(result.w).toBe(800)
    expect(result.h).toBe(800)
  })

  it('handles exact maxWidth', () => {
    expect(fitImageDimensions(800, 600, 800)).toEqual({ w: 800, h: 600 })
  })

  it('handles very wide images', () => {
    const result = fitImageDimensions(4000, 100, 800)
    expect(result.w).toBe(800)
    expect(result.h).toBe(20)
  })
})
