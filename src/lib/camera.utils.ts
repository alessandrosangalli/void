/**
 * Camera utility functions for coordinate transformations and zoom calculations.
 * All functions are pure — no side effects, no DOM dependencies.
 */

export interface Camera {
  x: number
  y: number
  zoom: number
}

export const ZOOM_MIN = 0.05
export const ZOOM_MAX = 20
export const ZOOM_STEP_KEYBOARD = 1.2
export const ZOOM_SENSITIVITY_WHEEL = 0.02
export const ZOOM_SENSITIVITY_TRACKPAD = 0.01

/**
 * Converts screen (pixel) coordinates to world coordinates,
 * accounting for camera pan and zoom.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: Camera
): { x: number; y: number } {
  return {
    x: (screenX - camera.x) / camera.zoom,
    y: (screenY - camera.y) / camera.zoom,
  }
}

/**
 * Converts world coordinates back to screen (pixel) coordinates.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: Camera
): { x: number; y: number } {
  return {
    x: worldX * camera.zoom + camera.x,
    y: worldY * camera.zoom + camera.y,
  }
}

/**
 * Clamps a zoom value to the allowed range [ZOOM_MIN, ZOOM_MAX].
 */
export function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, ZOOM_MIN), ZOOM_MAX)
}

/**
 * Calculates the next camera state after a zoom operation.
 * Zooms toward the given focal point (e.g., cursor position or pinch center).
 *
 * @param camera - Current camera state
 * @param zoomFactor - Multiplicative zoom factor (> 1 = zoom in, < 1 = zoom out)
 * @param focalX - Screen X coordinate to zoom toward
 * @param focalY - Screen Y coordinate to zoom toward
 * @returns New camera state
 */
export function zoomAtPoint(
  camera: Camera,
  zoomFactor: number,
  focalX: number,
  focalY: number
): Camera {
  const nextZoom = clampZoom(camera.zoom * zoomFactor)
  const ratio = nextZoom / camera.zoom
  return {
    zoom: nextZoom,
    x: focalX - (focalX - camera.x) * ratio,
    y: focalY - (focalY - camera.y) * ratio,
  }
}

/**
 * Calculates zoom-toward-center (used by keyboard shortcuts).
 */
export function zoomAtCenter(
  camera: Camera,
  direction: 'in' | 'out' | 'reset',
  viewportWidth: number,
  viewportHeight: number
): Camera {
  if (direction === 'reset') {
    return { zoom: 1, x: 0, y: 0 }
  }
  const factor = direction === 'in' ? ZOOM_STEP_KEYBOARD : 1 / ZOOM_STEP_KEYBOARD
  return zoomAtPoint(camera, factor, viewportWidth / 2, viewportHeight / 2)
}

/**
 * Calculates the zoom factor from a wheel event deltaY value.
 */
export function wheelDeltaToZoomFactor(deltaY: number, isDiscreteWheel: boolean): number {
  const sensitivity = isDiscreteWheel ? ZOOM_SENSITIVITY_TRACKPAD : ZOOM_SENSITIVITY_WHEEL
  return Math.pow(1.1, -deltaY * sensitivity)
}

/**
 * Pans the camera by a screen-space delta.
 */
export function panCamera(camera: Camera, dx: number, dy: number): Camera {
  return { ...camera, x: camera.x + dx, y: camera.y + dy }
}

/**
 * Detects whether a wheel event is from a discrete mouse wheel
 * (as opposed to a smooth trackpad).
 */
export function isDiscreteWheelEvent(deltaMode: number, deltaY: number, deltaX: number): boolean {
  return deltaMode !== 0 || (Math.abs(deltaY) >= 20 && Math.abs(deltaX) < 1)
}

/**
 * Calculates the pinch zoom factor from two sets of pointer positions.
 */
export function pinchZoomFactor(
  currentDistance: number,
  previousDistance: number
): number {
  if (previousDistance === 0) return 1
  return currentDistance / previousDistance
}

/**
 * Calculates the distance between two points.
 */
export function pointerDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}

/**
 * Calculates the midpoint between two points.
 */
export function pointerMidpoint(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

/**
 * Scales image dimensions to fit within maxWidth while preserving aspect ratio.
 */
export function fitImageDimensions(
  width: number,
  height: number,
  maxWidth: number
): { w: number; h: number } {
  if (width <= maxWidth) return { w: width, h: height }
  const ratio = maxWidth / width
  return { w: maxWidth, h: height * ratio }
}
