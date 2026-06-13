## 1. Dependencies & Data Model

- [x] 1.1 Install TipTap dependencies: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-color`, `@tiptap/extension-text-style`, `@tiptap/extension-text-align`
- [x] 1.2 Update `TextNode` type in `store.ts` — add `w: number`, `h: number`, `cardColor: string` fields
- [x] 1.3 Add default values constant for new fields: `{ w: 280, h: 160, cardColor: '#FFF9C4' }`
- [x] 1.4 Add backwards-compatibility helper that applies defaults to TextNodes missing `w`/`h`/`cardColor` (used when loading boards)

## 2. Card Container Component

- [x] 2.1 Create `CardNode` component (`src/components/CardNode.tsx`) — renders a single card as an HTML div with background color, border-radius, shadow, and camera-synced positioning
- [x] 2.2 Implement camera transform positioning: card position and size computed from `node.x/y/w/h` and `camera.x/y/zoom`
- [x] 2.3 Add resize handle at bottom-right corner — visible on hover, drag to resize with minimum 200×80 constraint
- [x] 2.4 Implement resize drag interaction: pointer events update `w` and `h` in store, accounting for camera zoom
- [x] 2.5 Add view mode rendering: display TipTap HTML content as static rendered HTML inside the card
- [x] 2.6 Add edit mode: on double-click, activate TipTap editor inside the card with cursor focus

## 3. Rich Text Editor Integration

- [x] 3.1 Create TipTap editor setup hook (`src/hooks/useTipTapEditor.ts`) — configures StarterKit + extensions (underline, color, text-style, text-align)
- [x] 3.2 Integrate TipTap editor inside `CardNode` edit mode — replaces the old textarea with the TipTap `EditorContent` component
- [x] 3.3 Handle editor content sync: on every TipTap update, write HTML to `TextNode.content` in store
- [x] 3.4 Handle exit editing: click outside card or Ctrl+Enter deactivates editor, persists content

## 4. Floating Formatting Toolbar

- [x] 4.1 Create `CardToolbar` component (`src/components/CardToolbar.tsx`) — floating bar positioned above the active card
- [x] 4.2 Add format buttons: Bold (B), Italic (I), Underline (U) — toggle state reflected from TipTap editor
- [x] 4.3 Add font size selector dropdown with options: 12, 14, 16 (default), 20, 24, 32
- [x] 4.4 Add text color picker with preset colors
- [x] 4.5 Add text alignment buttons: left, center, right
- [x] 4.6 Add bullet list toggle button
- [x] 4.7 Add card background color selector — 6 color dots (Yellow, Pink, Blue, Green, Purple, White)
- [x] 4.8 Position toolbar dynamically based on card position and camera, ensuring it stays visible on screen

## 5. App Integration

- [x] 5.1 Create `CardLayer` wrapper component — renders all TextNodes as `CardNode` components in a fixed HTML overlay
- [x] 5.2 Remove SVG `<text>` rendering from `App.tsx` — cards no longer rendered inside the `<g>` transform group
- [x] 5.3 Remove `EditingTextarea` component from `App.tsx` — replaced by TipTap editor inside cards
- [x] 5.4 Wire `CardLayer` and `CardToolbar` into `App.tsx` render tree
- [x] 5.5 Update `useBoardEvents.ts` — set default `w`, `h`, `cardColor` when creating new text nodes

## 6. Interaction Fixes

- [x] 6.1 Ensure move tool drag works on card HTML divs — pointer events from cards call `handleNodeInteraction`
- [x] 6.2 Ensure eraser tool works on card HTML divs — clicking a card with eraser deletes it
- [x] 6.3 Prevent card pointer events from propagating to SVG canvas when interacting with cards
- [x] 6.4 Handle keyboard shortcuts (Q/W/E/R) — do NOT trigger when TipTap editor is focused

## 7. Persistence Compatibility

- [x] 7.1 Update board load logic in `App.tsx` — apply TextNode defaults for missing `w`/`h`/`cardColor` from localStorage
- [x] 7.2 Update board load from Google Drive (`drive.ts`) — apply same defaults
- [x] 7.3 Verify save/load round-trip: create card with formatting, save, reload, confirm formatting and card style preserved
