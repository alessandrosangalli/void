## Context

The Void whiteboard application supports freehand drawing (strokes), text cards, and images, but lacks a mechanism to connect elements visually. Adding connections is critical for structuring ideas. Because elements are dynamic (movable and resizable), these connections must adjust their coordinates automatically.

## Goals / Non-Goals

**Goals:**

- Add a new "Arrow" tool to the toolbar with key shortcut support (`F`).
- Support dragging from a source node to a target node to create a persistent connection.
- Render dynamic arrows in the SVG overlay snapping to the closest cardinal side centers of both nodes.
- Persist connections in local storage and board files.
- Support Undo/Redo for connections.
- Ensure deleting a node automatically cascadingly deletes its connections.
- Allow deleting connections directly with the Eraser tool.

**Non-Goals:**

- Custom path routing (orthogonal/elbow layout, bezier curves) — we will use straight lines with arrowheads.
- Custom line styles (dashed, dotted) or colors.
- Adding text labels to arrow connections.
- Connecting lines to freehand strokes (only text and image nodes are supported).

## Decisions

### 1. Data Model & Jotai State

We will represent each connection as a simple JSON object:

```typescript
export interface Connection {
  id: string
  from: { id: string; type: 'text' | 'image' }
  to: { id: string; type: 'text' | 'image' }
}
```

And add `connectionsAtom = atom<Connection[]>([])` in `src/store.ts`.
_Alternatives considered:_

- Storing lines as list of raw screen points: This would break when cards are moved since we would have to manually update line coordinates. Storing symbolic references (`from` and `to` node IDs) allows computing points dynamically.

### 2. Snap Coordinates Computation

To avoid complex geometry intersect computations, we will use a quadrant-based approximation. Comparing node centers $C_A$ and $C_B$:

- If $|\Delta x| > |\Delta y|$: Snap to `Left`/`Right` edges.
- If $|\Delta y| > |\Delta x|$: Snap to `Top`/`Bottom` edges.

Edge centers are calculated using the bounding box ($x, y, w, h$) of each node.

### 3. Rendering Connections

Connections will be rendered as SVG `<line>` elements inside the SVG `<g>` overlay in `src/App.tsx`.
An arrowhead is defined via SVG `<marker>` in `<defs>` and applied using `markerEnd="url(#arrowhead)"`.
_Alternatives considered:_

- Rendering lines in a separate HTML Canvas: SVG is more declarative, matches current stroke rendering, handles zoom/pan automatically, and allows direct mouse event binding (e.g. for the Eraser).

### 4. Interactive Dragging & Bounding Box Check

When in `arrow` tool, dragging from a node sets a temporary state `activeArrow: { from: { id, type }, currentX, currentY }`.
At pointer up, we search the `texts` and `images` lists for any node containing the pointer's world coordinates. If found, and not the source node, we commit the connection.

## Risks / Trade-offs

- **Z-Index overlap**: Since HTML cards sit on top of the SVG, the arrows might render behind the cards.
  _Mitigation_: Snapping arrow start/end points to the outer edges of cards ensures the arrows emerge from the borders and do not look hidden or cut off.
- **Node deletion orphans**: If a node is deleted, connections might point to non-existent nodes, causing crashes or rendering bugs.
  _Mitigation_: Implement cascade deletion in `useBoardEvents.ts` whenever nodes are deleted.
