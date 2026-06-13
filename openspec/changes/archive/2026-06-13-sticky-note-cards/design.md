## Context

The board currently renders text as SVG `<text>` elements — plain, unstyled, no container. The editing flow uses a raw `<textarea>` overlay (`EditingTextarea` in `App.tsx`). The `TextNode` model holds only `id`, `x`, `y`, `content` (plain string), and `isEditing`.

Users expect sticky-note-style cards like Miro/FigJam: visually distinct containers with formatting support. This requires both a rendering architecture change (SVG → HTML) and a rich text editing system.

## Goals / Non-Goals

**Goals:**
- Cards render as HTML overlay divs, synced with camera transforms (pan/zoom)
- Cards are resizable via corner drag handles with minimum size 200×80
- Rich text editing inside cards using TipTap (bold, italic, underline, font size, text color, alignment, bullet lists)
- Floating formatting toolbar appears when editing a card
- 6 preset card background colors (sticky-note palette)
- Backwards-compatible persistence — old TextNodes without new fields get sensible defaults

**Non-Goals:**
- Markdown or code block support inside cards
- Collaborative real-time editing
- Card z-index reordering (cards always render above strokes)
- Card grouping, linking, or connectors between cards
- Custom fonts inside cards
- Card templates or presets

## Decisions

### Decision 1: HTML overlay instead of SVG foreignObject

**Choice**: Render cards as `position: fixed` HTML `<div>`s, positioned using camera transforms.

**Alternatives considered**:
- `<foreignObject>` inside SVG — Buggy cross-browser, limited CSS support, contentEditable unreliable inside SVG context
- Keep `<text>` SVG and add formatting attributes — SVG text doesn't support rich inline formatting (bold + italic in same block)

**Rationale**: HTML overlay is the standard approach used by Excalidraw, tldraw, and Miro. It gives full CSS/HTML capabilities while keeping strokes in SVG. The `EditingTextarea` already uses this pattern, proving it works with the camera system.

**Implementation**: Each card is a `<div>` with:
```
left: node.x * camera.zoom + camera.x
top:  node.y * camera.zoom + camera.y
width: node.w * camera.zoom
height: node.h * camera.zoom
transform-origin: top left
```

### Decision 2: TipTap for rich text editing

**Choice**: Use `@tiptap/react` with `StarterKit` + extensions for color, underline, and text alignment.

**Alternatives considered**:
- Raw `contentEditable` — Inconsistent behavior across browsers, manual state management for formatting commands
- Slate.js — More complex API, steeper learning curve, similar bundle size
- Quill — Opinionated UI, harder to customize floating toolbar

**Rationale**: TipTap (ProseMirror-based) gives a clean React API, composable extensions, and JSON/HTML serialization. It handles cursor management, undo/redo, and formatting commands reliably. Bundle cost (~100KB) is acceptable for the capability it provides.

**Extensions needed**:
- `@tiptap/starter-kit` (bold, italic, strike, bullet list, heading, history)
- `@tiptap/extension-underline`
- `@tiptap/extension-color` + `@tiptap/extension-text-style`
- `@tiptap/extension-text-align`

### Decision 3: Card color palette — fixed set

**Choice**: 6 curated sticky-note colors, selectable via color dots in the floating toolbar.

```
Yellow:  #FFF9C4 (default)
Pink:    #FCE4EC
Blue:    #E3F2FD
Green:   #E8F5E9
Purple:  #F3E5F5
White:   #FFFFFF
```

**Rationale**: Fixed palette ensures visual consistency across boards. A free color picker adds UI complexity without proportional value. 6 colors cover the most common sticky-note use cases.

### Decision 4: Resize via corner handle only

**Choice**: Single resize handle at bottom-right corner. Drag to resize freely (no aspect ratio lock). Minimum 200×80.

**Rationale**: Corner-only resize is simpler to implement and sufficient for text cards. Edge handles add complexity (8 handles vs 1) with little gain for card-type content. The minimum size prevents cards from collapsing to unusable sizes.

### Decision 5: Expanded TextNode data model

```typescript
type TextNode = {
  id: string
  x: number
  y: number
  w: number          // default: 280
  h: number          // default: 160
  content: string    // HTML string from TipTap
  isEditing: boolean
  cardColor: string  // default: '#FFF9C4'
}
```

**Backwards compatibility**: When loading old boards, missing `w`/`h`/`cardColor` fields receive defaults (280, 160, '#FFF9C4'). The plain `content` string is treated as a text paragraph in TipTap.

### Decision 6: Component architecture

```
App.tsx
├── <svg> (strokes only — no text rendering here)
├── CardLayer (new)
│   └── CardNode[] (one per TextNode)
│       ├── View mode: rendered HTML content
│       ├── Edit mode: TipTap editor
│       └── ResizeHandle
├── CardToolbar (new, floating — appears when editing)
│   ├── Format buttons (B, I, U, S)
│   ├── Font size control
│   ├── Text color picker
│   ├── Alignment buttons
│   ├── List toggle
│   └── Card color dots
└── Toolbar (existing, unchanged)
```

## Risks / Trade-offs

**[Risk] TipTap bundle size (~100KB gzipped)** → Acceptable for the functionality. Lazy-load the TipTap editor chunk so it's only loaded when the user first creates/edits a card.

**[Risk] HTML overlay z-fighting with SVG** → Cards always render above strokes (fixed z-index layer). This is a simplification but matches user mental model of sticky notes on top of drawings.

**[Risk] Camera sync performance with many cards** → Each card recalculates position on every camera change. Mitigate by using `transform` CSS property (GPU-accelerated) instead of `left/top` recalculation. For MVP, direct style updates are sufficient (tested with dozens of cards).

**[Risk] Rich text content increases save payload** → HTML strings are larger than plain text. Acceptable for typical card content (short notes). No compression needed for MVP.

**[Trade-off] No multi-line SVG text fallback** → Old boards with text nodes will render differently (cards instead of plain text). This is acceptable — the new rendering is strictly better.
