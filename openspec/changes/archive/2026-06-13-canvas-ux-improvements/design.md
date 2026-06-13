## Context

The application is a lightweight, minimal vector-like whiteboard canvas. The state is managed locally via Jotai atoms (`strokesAtom`, `textsAtom`, `imagesAtom`, and `cameraAtom`).
- Nodes are rendered as distinct layers: strokes are drawn inside an `<svg>` viewport, while images are rendered inside the SVG, and text nodes are positioned on top as an HTML overlay (`CardLayer`).
- Currently, there is no system tracking which node is selected.
- Panning is bound to right-click dragging, and zoom to the mouse wheel.
- There is no history tracking (undo/redo) for strokes, texts, or images.

## Goals / Non-Goals

**Goals:**
- **Node Selection & Keyboard Actions:** Create a state to track the active selected card or image node. Display a sutil highlight border around the selected node, and allow deleting (`Backspace`/`Delete`) or duplicating (`Ctrl + D`) via keybinds.
- **Undo / Redo:** Maintain a chronological snapshot history of the canvas state (`strokes`, `texts`, `images`) to allow undo (`Ctrl + Z`) and redo (`Ctrl + Y`).
- **Canvas Navigation:** Support holding the `Space` bar to pan the canvas with the left click, and `Shift + 1` to reset camera zoom/pan.

**Non-Goals:**
- Multi-node selection (marquee select dragging or Shift-click selection of multiple nodes).
- Bounding box scale handles (resizing is already supported by the card bottom-right handle; we will not add bounding box transformation controls).
- Undo/redo history for camera movement actions (zooming and panning).

## Decisions

### 1. Node Selection State
We will introduce a new atom to track the currently selected node:
```typescript
export type SelectedNode = { type: 'text' | 'image'; id: string } | null
export const selectedNodeAtom = atom<SelectedNode>(null)
```
- **Alternatives Considered:** Storing `isSelected: boolean` on each text node and image node.
- **Rationale:** Storing selection inside a single isolated atom keeps the core serialization models for `TextNode` and `ImageNode` clean. Selection states do not need to be saved to localStorage or Google Drive.

### 2. Coordinated Undo/Redo History Stack
We will implement a custom history manager atom in `store.ts` that captures combined snapshots of `{ strokes, texts, images }` on key action boundaries (e.g. pointerup after drawing a stroke, onStopEditing a card, dropping an image, or deleting/duplicating nodes).
- **Alternatives Considered:** Using Jotai's `atomWithHistory` for each atom individually.
- **Rationale:** If each atom has its own history stack, pressing `Ctrl + Z` could get out of sync (e.g., undoing a stroke instead of a recently created card). A single combined snapshot history ensures that undoing reverts the board state exactly to the previous unified frame.

### 3. Keydown Guards for Shortcuts
All global shortcuts (Space pan, Backspace delete, Ctrl+D, Ctrl+Z, Ctrl+Y, Shift+1) will be registered globally on the window in `useBoardEvents.ts`.
- **Key Constraint:** These shortcuts must **never** trigger if the user is typing inside a text field or the TipTap contentEditable card editor.
- **Implementation:** The keydown handler will verify the target:
  ```typescript
  if (e.target instanceof HTMLInputElement || 
      e.target instanceof HTMLTextAreaElement || 
      (e.target as HTMLElement)?.isContentEditable) {
    return
  }
  ```

## Risks / Trade-offs

- **[Risk] Spacebar scrolling default behavior** → Holding spacebar in a browser scrolls the page by default.
  - **Mitigation:** Call `e.preventDefault()` in the window keydown listener if the target is not an input field and the key is `' '` (Spacebar).
- **[Risk] Rapid snapshot generation during drag** → Creating snapshots on every pointer move event would exhaust memory and pollute the undo stack.
  - **Mitigation:** Only push states onto the undo stack when an action finishes (on `pointerup` for drawing/moving/resizing, and on exit editing for text edits).
