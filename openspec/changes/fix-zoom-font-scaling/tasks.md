## 1. Card Container Variable Injection

- [x] 1.1 Expose the `--zoom` CSS variable inside the inline styles of the card node `div` wrapper in `src/components/CardNode.tsx` using `camera.zoom`.

## 2. TipTap Font Size Extension

- [x] 2.1 Update `renderHTML` in the `FontSize` extension in `src/hooks/useTipTapEditor.ts` to output `font-size: calc(<value> * var(--zoom, 1))`.
- [x] 2.2 Update `parseHTML` in the `FontSize` extension in `src/hooks/useTipTapEditor.ts` to parse the `calc(<value> * var(--zoom, 1))` format and return the raw value so that the toolbar dropdown still functions correctly.

## 3. Verification

- [x] 3.1 Verify font size scaling is correct when zooming in and out with custom font sizes.
- [x] 3.2 Verify toolbar font size dropdown shows the correct active font size for newly typed and zoomed text.
- [x] 3.3 Verify legacy text card loads without errors and scales when zoom level changes.
