## Why

Users currently can draw, write text cards, and upload images, but there is no native way to represent relationships or flows between these elements. Enabling simple arrow connections allows users to create mind maps, diagrams, and structured visual representations directly on the board.

## What Changes

- Add a new "Arrow" tool to the toolbar (shortcut: `F`).
- Allow users to click and drag from a source node (text or image) to a target node (text or image) to create a visual connecting arrow.
- Display a real-time preview of the arrow when dragging.
- Ensure arrows dynamically update their start and end points as the connected cards are moved or resized.
- Support deletion of arrows using the Eraser tool or automatically when a connected node is deleted.
- Add support for undoing and redoing arrow creations and deletions.
- Persist connections in local storage and Google Drive board save files.

## Capabilities

### New Capabilities

- `arrow-connections`: Allows drawing, rendering, persisting, and managing dynamic arrows that connect board elements (text nodes and image nodes).

### Modified Capabilities

<!-- None -->

## Impact

- **State & Store (`src/store.ts`)**: Addition of `Connection` type, `connectionsAtom`, and expansion of `BoardState` to include `connections`.
- **Canvas Interaction (`src/hooks/useBoardEvents.ts`)**: Addition of pointer handlers for drawing arrows (pointer down/move/up), and canvas bounding box checking.
- **Rendering (`src/App.tsx`)**: SVG definitions for the arrowhead marker, rendering of active connections, and drawing preview.
- **Toolbar (`src/components/Toolbar.tsx`)**: Addition of the Arrow tool button and keybinding shortcut.
- **Persistence (`src/hooks/useAutoSave.ts`, `src/App.tsx`)**: Saving and loading the connections array from JSON files and local storage.
