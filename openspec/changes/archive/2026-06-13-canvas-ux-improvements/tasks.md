## 1. Selection State & Style

- [x] 1.1 Add `selectedNodeAtom` to `src/store.ts` to hold the currently selected node: `{ type: 'text' | 'image'; id: string } | null`
- [x] 1.2 Update `handleNodeInteraction` in `useBoardEvents.ts` to set the clicked node as the selected node when using the move tool
- [x] 1.3 Update the canvas pointer down handler in `useBoardEvents.ts` to clear selection when clicking on empty canvas space
- [x] 1.4 Render a sutil outline/border around the active card in `CardNode.tsx` based on the selection state
- [x] 1.5 Render a visual outline around the active image node in the SVG renderer in `App.tsx` based on the selection state

## 2. Keyboard Shortcuts (Delete & Duplicate)

- [x] 2.1 Register global `keydown` event listener in `useBoardEvents.ts` with checks to bypass text input elements (inputs, textareas, contentEditable)
- [x] 2.2 Implement Backspace/Delete keyboard action to delete the currently selected node
- [x] 2.3 Implement duplication shortcut (`Ctrl+D`) to duplicate the selected node, shifted by 20px, and select the copy

## 3. Undo / Redo History

- [x] 3.1 Create history state arrays and undo/redo stacks for board states: `{ strokes: Point[][]; texts: TextNode[]; images: ImageNode[] }` in `src/store.ts`
- [x] 3.2 Add helper function `pushStateToHistory` to push the current board state onto the undo stack
- [x] 3.3 Wire `pushStateToHistory` to fire at action boundaries: when a stroke is completed, on card exit-editing, on image upload, or on delete/duplicate
- [x] 3.4 Bind `Ctrl+Z` to undo and `Ctrl+Y` to redo in the keyboard listener, updating the state atoms accordingly

## 4. Canvas Navigation

- [x] 4.1 Track spacebar down/up state as `isSpacePanning` in `useBoardEvents.ts`
- [x] 4.2 Prevent default browser scroll when spacebar is pressed on the canvas
- [x] 4.3 Update board pointer handlers in `useBoardEvents.ts` to pan the board when left-click dragging is performed while spacebar is held down
- [x] 4.4 Implement `Shift+1` camera reset shortcut (sets camera to zoom: 1, x: 0, y: 0)

## 5. Verification & Final Testing

- [x] 5.1 Run all unit tests to ensure there are no regressions
- [x] 5.2 Build the production app bundle (`npm run build`)
