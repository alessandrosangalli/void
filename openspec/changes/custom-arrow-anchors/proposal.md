## Why

Users currently cannot choose which side of a card (text node or image node) an arrow connection connects to. Instead, the connection automatically snaps to the closest edge center. Allowing users to choose specific anchor points (top, right, bottom, left) gives them precise control over how ideas are linked visually.

## What Changes

- Add connection handles (dots/anchors) on the 4 sides (top, right, bottom, left) of text cards and images when the Arrow tool is active.
- Allow dragging from a specific handle to start a connection.
- Allow dropping onto a specific handle of a target node to snap the connection to that side.
- Support fallback to automatic dynamic snapping if connection is drawn without using specific handles.
- Store the chosen `fromSide` and `toSide` anchor points in the `Connection` state.
- Render connection lines aligned to the chosen sides.

## Capabilities

### New Capabilities

### Modified Capabilities

- `arrow-connections`: Update specifications to support specific starting and ending sides (anchors) for connection lines, enabling custom layout configurations.

## Impact

- `src/store.ts`: Update `Connection` interface to store optional `fromSide` and `toSide` properties.
- `src/App.tsx`: Update the snapping/rendering math in `getArrowPoints` to respect chosen anchor sides, and render handles.
- `src/hooks/useBoardEvents.ts`: Update pointer event handlers to detect dragging from/to specific handles.
- `src/components/CardNode.tsx`: Render HTML handles when the Arrow tool is active.
