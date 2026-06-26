## 1. Schema and Snapping Math

- [x] 1.1 Update the Connection interface in `src/store.ts` to include optional `fromSide` and `toSide` properties.
- [x] 1.2 Update the ActiveArrow state type in `src/hooks/useBoardEvents.ts` to include `fromSide`.
- [x] 1.3 Modify the `getArrowPoints` function in `src/App.tsx` to snap to the specified `fromSide` or `toSide` when available, falling back to the dynamic snapping math if undefined.

## 2. CardNode Handles (HTML)

- [x] 2.1 Update `src/components/CardNode.tsx` to render 4 interactive connection handle dots (top, right, bottom, left) when the Arrow tool is active and the card is not in edit mode.
- [x] 2.2 Implement pointerdown handlers on these card handles that propagate the start of arrow creation, passing the selected `fromSide` anchor.
- [x] 2.3 Style the handles visually with hover effects and clean circles using tailwind or vanilla CSS in `src/index.css`.

## 3. Image Handles (SVG)

- [x] 3.1 Update `src/App.tsx` to render 4 SVG circle handles overlaying each image element when the Arrow tool is active.
- [x] 3.2 Implement pointerdown handlers on these image handles to start arrow creation with the selected `fromSide`.

## 4. Pointer Interaction and Target Snapping

- [x] 4.1 Update `useBoardEvents.ts` pointer event handlers to track the current hovered element's nearest side/handle during dragging, to preview-snap the ending coordinate.
- [x] 4.2 Update the pointerup event handler to detect if the release occurred near or over a target handle, setting the `toSide` anchor accordingly, and create the Connection.
- [x] 4.3 Verify auto-save, local storage, history undo/redo, build, and tests run perfectly.
