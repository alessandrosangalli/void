## Context

Text inside card nodes is editable using a TipTap rich-text editor. The board allows zooming. When the board is zoomed in/out, the card container's size and base font-size are updated based on the zoom factor `camera.zoom`.
However, if a user changes the font-size of selected text using the toolbar, TipTap applies an inline style like `style="font-size: 24px;"` to the HTML span wrapper. Inline styles have higher specificity than CSS selectors. Consequently, these custom font-sized texts remain at their hardcoded pixel size, breaking the layout during zoom.

## Goals / Non-Goals

**Goals:**

- Scale custom-styled text size proportionally to `camera.zoom` during canvas zoom operations.
- Ensure that the toolbar dropdown still correctly parses and shows the active font size (e.g. 24px).
- Maintain backward compatibility with existing boards that have simple `font-size: <value>` inline styles.

**Non-Goals:**

- Change other styling properties (like text alignment or colors) during zoom.
- Rewrite the entire stylesheet logic of cards to CSS variables (only use variables where inline overrides are needed).

## Decisions

### Decision 1: Expose `--zoom` CSS variable on CardNode containers

We will pass the current `camera.zoom` value as a CSS variable `--zoom` on the style object of the outer CardNode `div` element:

```tsx
style={{
  ...
  '--zoom': camera.zoom,
} as React.CSSProperties}
```

### Decision 2: Modify TipTap `FontSize` Extension to render font-size using `calc()`

We will update `src/hooks/useTipTapEditor.ts` custom `FontSize` extension's `renderHTML` to generate:
`font-size: calc(${attributes.fontSize} * var(--zoom, 1))`

This allows the browser to compute the font size dynamically using the `--zoom` variable from the parent container.

### Decision 3: Update `parseHTML` in `FontSize` extension to parse the `calc()` wrapper

We will update the `parseHTML` logic to extract the base font-size string (e.g., `"24px"`) from the `calc(...)` pattern:
`const match = style.match(/calc\(([^]*?)\s*\*\s*var\(--zoom,\s*1\)\)/)`

If it matches, return the base value. If it doesn't (legacy style), return the raw style.

## Risks / Trade-offs

- **[Risk]** Parsing or matching issues with complex calc strings.
  - **Mitigation**: Use a simple regular expression and fall back to the raw style string if the regex doesn't match, preserving legacy inline styling.
