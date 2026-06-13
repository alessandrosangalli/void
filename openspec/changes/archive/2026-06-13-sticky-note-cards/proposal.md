## Why

Text nodes on the board are currently plain `<text>` SVG elements — no background, no border, no visual container, and no formatting options. They feel like floating labels rather than first-class content objects. Users expect sticky-note-style cards (like Miro, FigJam, or physical whiteboards) where they can write formatted text inside a visually distinct, resizable container. This is the most impactful UX gap in the board today.

## What Changes

- **Replace plain text rendering** with styled card/sticker containers that have backgrounds, rounded corners, and subtle shadows
- **Add resizable cards** with drag handles, minimum size constraints (200×80), and free-form proportions
- **Introduce a rich text editor** (TipTap) inside cards with a floating formatting toolbar
- **Add card color selection** from a curated palette of 6 sticky-note colors
- **Switch text rendering from SVG to HTML overlay** — cards become positioned `<div>`s synced with camera transforms instead of `<text>` SVG elements
- **Expand the `TextNode` data model** to include width, height, card color, and rich text content (HTML)
- **Add formatting toolbar** with bold, italic, underline, font size, text color, text alignment, and bullet lists

## Capabilities

### New Capabilities
- `card-container`: Visual card/sticker rendering with background colors, rounded corners, shadow, and resizable dimensions via drag handles
- `rich-text-editing`: TipTap-based rich text editor with floating formatting toolbar (bold, italic, underline, font size, text color, alignment, bullet lists)

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **Store (`store.ts`)**: `TextNode` type gains `w`, `h`, `cardColor` fields; `content` becomes HTML string
- **App (`App.tsx`)**: Text rendering moves from SVG `<text>` to HTML overlay `<div>`s; `EditingTextarea` replaced by TipTap editor inside card
- **Board events (`useBoardEvents.ts`)**: Resize interaction logic added; text node creation sets default card dimensions
- **Dependencies**: New dependency on `@tiptap/react`, `@tiptap/starter-kit`, and extensions for text color, text align, underline
- **Toolbar (`Toolbar.tsx`)**: No changes needed — card-level toolbar is a separate floating component
- **Persistence**: Board save/load must handle new TextNode fields; backwards-compatible (missing fields get defaults)
