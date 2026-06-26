## Context

Currently, connection lines (arrows) automatically snap to the closest edge center of the connected nodes dynamically. Users want the ability to explicitly specify which side of a node (top, right, bottom, left) the arrow should originate from or point to.

## Goals / Non-Goals

**Goals:**

- Extend the `Connection` state schema to support optional fixed sides (`fromSide`, `toSide`).
- Render connection handles on the 4 edges of text cards and images when the Arrow tool is active.
- Support dragging from and dropping onto these handles to establish fixed-side connections.
- Ensure that if no handles are used, connections default to dynamic automatic snapping.
- Highlight the target handle when dragging the pointer over it.

**Non-Goals:**

- Adding diagonal connection points.
- Modifying the arrow styling (remains solid black).

## Decisions

### 1. Connection Schema Extension

We will add optional `fromSide` and `toSide` fields (`'top' | 'right' | 'bottom' | 'left'`) to the `Connection` interface in `store.ts` and the `ActiveArrow` state in `useBoardEvents.ts`.
_Rationale:_ This is backwards-compatible and allows existing dynamic arrows to load/save without issues.

### 2. Handle Presentation and Drag Triggering

- **Text Cards:** Render 4 small circular handles absolute-positioned relative to the card container when `activeTool === 'arrow'`.
- **Image Nodes:** Render 4 small SVG circle handles overlaying each image when `activeTool === 'arrow'`.
  _Rationale:_ Because text cards are rendered as HTML, rendering their handles in HTML avoids pointer occlusion issues. Similarly, since images are SVG `<image>` elements, SVG handles fit naturally.

### 3. Rendering and Snapping Math

Update `getArrowPoints` to check if `from.side` or `to.side` are specified. If so, return the center of that side. Otherwise, fall back to the dynamic closest-side calculation.

## Risks / Trade-offs

- **Occlusion by Editing:** If a text card is in edit mode, editing takes precedence over arrow drawing.
  - _Mitigation:_ Hide connection handles when `node.isEditing` is true.
- **Small Targets:** Small handle dots might be hard to click on touch screens.
  - _Mitigation:_ Use larger invisible hitboxes around each connection handle to improve ease of interaction.
