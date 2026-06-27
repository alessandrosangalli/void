## MODIFIED Requirements

### Requirement: Font size control

The toolbar SHALL provide a way to change the font size of selected text. All custom font sizes applied SHALL scale proportionally with the canvas zoom level.

#### Scenario: Change font size

- **WHEN** the user selects text and chooses a font size from the toolbar
- **THEN** the selected text renders at the chosen size scaled proportionally by the canvas zoom factor

#### Scenario: Available font sizes

- **WHEN** the font size control is displayed
- **THEN** it offers at least: 12px, 14px, 16px (default), 20px, 24px, 32px
