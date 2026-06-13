# card-container Specification

## Purpose
TBD - created by archiving change sticky-note-cards. Update Purpose after archive.
## Requirements
### Requirement: Cards render as visual containers
Text nodes SHALL render as card/sticker containers with a solid background color, 16px border-radius, and a subtle box-shadow. Cards SHALL NOT render as plain SVG `<text>` elements.

#### Scenario: Card appears on canvas
- **WHEN** a text node exists on the board
- **THEN** it renders as an HTML div with the node's `cardColor` as background, rounded corners, and a drop shadow

#### Scenario: Card with default styling
- **WHEN** a new text node is created without explicit style
- **THEN** the card uses background color `#FFF9C4` (yellow), width 280px, and height 160px

---

### Requirement: Cards are positioned relative to camera
Cards SHALL be rendered as HTML overlay elements (not SVG) and SHALL update their visual position and scale when the camera pans or zooms.

#### Scenario: Camera pan updates card position
- **WHEN** the user pans the camera by dragging
- **THEN** all cards move on screen to stay aligned with their world-space coordinates

#### Scenario: Camera zoom scales cards
- **WHEN** the user zooms in or out
- **THEN** all cards scale proportionally, maintaining their position relative to strokes and images on the canvas

---

### Requirement: Cards are resizable
Each card SHALL have a resize handle at its bottom-right corner. Dragging this handle SHALL change the card's width and height freely (no aspect ratio constraint).

#### Scenario: Resize a card by dragging corner handle
- **WHEN** the user drags the bottom-right resize handle of a card
- **THEN** the card's width and height update in real-time following the pointer

#### Scenario: Minimum card size enforced
- **WHEN** the user attempts to resize a card smaller than 200px wide or 80px tall
- **THEN** the card stops shrinking and holds at the minimum dimensions (200×80)

#### Scenario: Resize handle visibility
- **WHEN** the user hovers over a card (not in editing mode)
- **THEN** the resize handle becomes visible at the bottom-right corner

---

### Requirement: Cards support background color selection
Each card SHALL support one of 6 preset background colors. The user SHALL be able to change the card's color from the floating toolbar while editing.

#### Scenario: Change card color
- **WHEN** the user clicks a color dot in the floating toolbar while editing a card
- **THEN** the card's background color updates immediately to the selected color

#### Scenario: Available colors
- **WHEN** the color palette is displayed
- **THEN** it shows exactly 6 options: Yellow (#FFF9C4), Pink (#FCE4EC), Blue (#E3F2FD), Green (#E8F5E9), Purple (#F3E5F5), White (#FFFFFF)

---

### Requirement: Cards are movable with the move tool
Cards SHALL be draggable when the move tool is active, consistent with existing image and stroke move behavior.

#### Scenario: Drag a card to a new position
- **WHEN** the move tool is active and the user drags a card
- **THEN** the card moves to the new position on the canvas

---

### Requirement: Cards are deletable with the eraser tool
Cards SHALL be deletable when the eraser tool is active, consistent with existing eraser behavior on other node types.

#### Scenario: Erase a card
- **WHEN** the eraser tool is active and the user clicks on a card
- **THEN** the card is removed from the board

---

### Requirement: Card data model includes dimensions and style
The `TextNode` type SHALL include `w` (width), `h` (height), and `cardColor` fields in addition to existing fields.

#### Scenario: Load old board data without new fields
- **WHEN** a board is loaded that contains TextNodes without `w`, `h`, or `cardColor` fields
- **THEN** the system applies defaults: w=280, h=160, cardColor='#FFF9C4'

#### Scenario: Save board with card data
- **WHEN** a board with cards is saved
- **THEN** the persisted data includes `w`, `h`, and `cardColor` for each TextNode

