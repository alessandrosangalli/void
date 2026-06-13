# rich-text-editing Specification

## Purpose
TBD - created by archiving change sticky-note-cards. Update Purpose after archive.
## Requirements
### Requirement: Rich text editor inside cards
When a card enters editing mode, the system SHALL display a TipTap-based rich text editor inside the card container, replacing the plain textarea.

#### Scenario: Enter editing mode
- **WHEN** the user double-clicks a card or creates a new text node with the text tool
- **THEN** a TipTap rich text editor activates inside the card with cursor focus

#### Scenario: Exit editing mode
- **WHEN** the user clicks outside the card or presses Ctrl+Enter
- **THEN** the editor deactivates and the card displays the formatted content as rendered HTML

#### Scenario: Content persistence
- **WHEN** the user types and formats text in the editor
- **THEN** the content is stored as an HTML string in the TextNode's `content` field

---

### Requirement: Floating formatting toolbar
A floating toolbar SHALL appear above or near the card being edited, providing text formatting controls.

#### Scenario: Toolbar appears on edit
- **WHEN** a card enters editing mode
- **THEN** a floating toolbar appears positioned near the top of the card

#### Scenario: Toolbar disappears on exit
- **WHEN** the card exits editing mode
- **THEN** the floating toolbar disappears

#### Scenario: Toolbar does not block card content
- **WHEN** the floating toolbar is visible
- **THEN** it is positioned above the card so it does not overlap the editable content area

---

### Requirement: Bold formatting
The toolbar SHALL provide a bold toggle button.

#### Scenario: Apply bold to selected text
- **WHEN** the user selects text and clicks the bold button (or presses Ctrl+B)
- **THEN** the selected text becomes bold

#### Scenario: Bold button reflects current state
- **WHEN** the cursor is inside bold text
- **THEN** the bold button appears in an active/pressed state

---

### Requirement: Italic formatting
The toolbar SHALL provide an italic toggle button.

#### Scenario: Apply italic to selected text
- **WHEN** the user selects text and clicks the italic button (or presses Ctrl+I)
- **THEN** the selected text becomes italic

#### Scenario: Italic button reflects current state
- **WHEN** the cursor is inside italic text
- **THEN** the italic button appears in an active/pressed state

---

### Requirement: Underline formatting
The toolbar SHALL provide an underline toggle button.

#### Scenario: Apply underline to selected text
- **WHEN** the user selects text and clicks the underline button (or presses Ctrl+U)
- **THEN** the selected text becomes underlined

---

### Requirement: Font size control
The toolbar SHALL provide a way to change the font size of selected text.

#### Scenario: Change font size
- **WHEN** the user selects text and chooses a font size from the toolbar
- **THEN** the selected text renders at the chosen size

#### Scenario: Available font sizes
- **WHEN** the font size control is displayed
- **THEN** it offers at least: 12px, 14px, 16px (default), 20px, 24px, 32px

---

### Requirement: Text color
The toolbar SHALL provide a text color selector.

#### Scenario: Change text color
- **WHEN** the user selects text and picks a color from the text color control
- **THEN** the selected text renders in the chosen color

#### Scenario: Default text color
- **WHEN** text is typed without explicit color selection
- **THEN** it renders in the default color (#111111)

---

### Requirement: Text alignment
The toolbar SHALL provide alignment controls (left, center, right).

#### Scenario: Align text
- **WHEN** the user places the cursor in a paragraph and clicks an alignment button
- **THEN** the paragraph aligns to the selected direction (left, center, or right)

#### Scenario: Default alignment
- **WHEN** new text is typed
- **THEN** it is left-aligned by default

---

### Requirement: Bullet list
The toolbar SHALL provide a bullet list toggle.

#### Scenario: Create a bullet list
- **WHEN** the user clicks the bullet list button
- **THEN** the current paragraph becomes a bulleted list item

#### Scenario: Remove bullet list
- **WHEN** the user clicks the bullet list button on an existing list item
- **THEN** the list item converts back to a regular paragraph

---

### Requirement: Plain text backwards compatibility
When a card's `content` is plain text (not HTML), the editor SHALL treat it as a single paragraph.

#### Scenario: Load plain text content
- **WHEN** a TextNode has plain text content (from an old board save)
- **THEN** the TipTap editor wraps it in a `<p>` tag and renders it as a paragraph

