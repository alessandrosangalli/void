## Why

When users zoom in or out on the canvas, the font size of texts inside card text nodes remains physically constant if a custom font size has been applied via the toolbar. This overrides the visual scaling of the cards, breaking the visual layout and causing text to overflow or appear disproportionately sized.

## What Changes

- Modify how custom font sizes (applied via TipTap) are represented in HTML to incorporate the canvas zoom factor dynamically.
- Update the TipTap custom `FontSize` extension to parse and render font sizes relative to the camera zoom using CSS variables.
- Pass the camera zoom factor as a CSS variable (`--zoom`) to the card container so inline styles can utilize it.

## Capabilities

### New Capabilities

<!-- None needed, we are only modifying an existing capability -->

### Modified Capabilities

- `rich-text-editing`: Update the font size control requirement to specify that all custom font sizes must scale proportionally with the canvas zoom level.

## Impact

- `src/components/CardNode.tsx` (Card container element styles and CSS variable bindings)
- `src/hooks/useTipTapEditor.ts` (TipTap custom FontSize extension `parseHTML` and `renderHTML` behavior)
