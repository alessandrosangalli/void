## Why

Currently, the whiteboard/canvas workspace lacks essential keyboard accessibility, navigation shortcuts, and action history (undo/redo). Users cannot undo mistakes, must manually switch to the eraser tool to delete items, and have limited camera panning options. Adding selection states, common keyboard shortcuts, undo/redo capabilities, and space-drag navigation will dramatically improve productivity and match standard canvas UX practices (such as Figma and Miro) while preserving the minimalist interface.

## What Changes

- **Selection State & Key Actions:**
  - Clicking an item (card or image) with the move tool selects it, rendering a sutil visual outline.
  - Pressing `Backspace` or `Delete` deletes the selected item.
  - Pressing `Ctrl + D` (or `Cmd + D`) duplicates the selected item.
- **Undo / Redo History:**
  - Pressing `Ctrl + Z` undoes the last drawing stroke, card action, or image upload.
  - Pressing `Ctrl + Y` or `Ctrl + Shift + Z` redoes the undone action.
- **Canvas Navigation Improvements:**
  - Holding the `Space` bar enters panning mode, showing a grab cursor and allowing users to pan by left-clicking and dragging.
  - Pressing `Shift + 1` resets the camera view (zoom: 1, position: x=0, y=0).

## Capabilities

### New Capabilities
- `canvas-navigation`: Encompasses the Space+drag pan interaction and the camera reset shortcut.
- `undo-redo`: Handles the capturing, undoing, and redoing of user canvas actions (strokes, cards, and images).
- `selection-shortcuts`: Encompasses the visual selection state of nodes and quick keyboard actions (delete, duplicate).

### Modified Capabilities
<!-- No existing spec-level behavior changes, these are purely new capabilities -->

## Impact

- **Affected Components:** `App.tsx`, `useBoardEvents.ts`, `CardNode.tsx`, `CardLayer.tsx`, `store.ts`.
- **State Changes:** Add active selection state atom, undo/redo history stacks, and temporary space-pan state.
- **Dependencies:** None. No new packages are required.
