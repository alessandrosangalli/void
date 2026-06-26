## 1. State & Types

- [x] 1.1 Add `Connection` type, `connectionsAtom`, and update `ToolType` in `src/store.ts`
- [x] 1.2 Update `BoardState` type, `undoAtom`, `redoAtom`, and `pushHistoryAtom` to track and revert connections in `src/store.ts`

## 2. Drawing Interaction

- [x] 2.1 Add `activeArrow` local state to `useBoardEvents.ts`
- [x] 2.2 Update `handleNodeInteraction` in `useBoardEvents.ts` to trigger arrow drawing when in `arrow` tool and clicking a node
- [x] 2.3 Update `handleWindowPointerMove` in `useBoardEvents.ts` to update the preview target coordinate
- [x] 2.4 Update `handleWindowPointerUp` in `useBoardEvents.ts` to locate target node under cursor and commit connection
- [x] 2.5 Add keyboard shortcut key listener for the arrow tool (shortcut `F`) in `useBoardEvents.ts`

## 3. Eraser & Deletion Cleanup

- [x] 3.1 Implement cascade deletion of connections when deleting nodes via keyboard or eraser tool in `useBoardEvents.ts`
- [x] 3.2 Allow direct connection deletion using the Eraser tool by clicking on lines

## 4. Rendering & Toolbar UI

- [x] 4.1 Define SVG arrowhead marker in `src/App.tsx` `<defs>`
- [x] 4.2 Add snap coordinate math calculation function to compute edge connection points
- [x] 4.3 Render list of active connections as SVG `<line>` elements inside `<g>` group in `src/App.tsx`
- [x] 4.4 Render preview arrow line if `activeArrow` is active in `src/App.tsx`
- [x] 4.5 Add Arrow tool button with Lucide icon and tooltips to `src/components/Toolbar.tsx`

## 5. Persistence & Integration

- [x] 5.1 Update local storage load logic in `src/App.tsx` to restore connections
- [x] 5.2 Update `BoardState` interfaces and auto-save logic in `src/hooks/useAutoSave.ts`
