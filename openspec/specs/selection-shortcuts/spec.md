# selection-shortcuts Specification

## Purpose
TBD - created by archiving change canvas-ux-improvements. Update Purpose after archive.
## Requirements
### Requirement: Node selection
The system SHALL support selecting a single node (text card or image) when clicked using the move tool. A sutil visual outline/border SHALL be rendered around the selected node to indicate focus.

#### Scenario: Select a node
- **WHEN** the user clicks an image or a text card with the move tool active
- **THEN** that node becomes the selected node and renders a visual outline

#### Scenario: Deselect a node
- **WHEN** the user clicks on the empty canvas space with the move tool active
- **THEN** the active selection is cleared and the visual outline is removed

---

### Requirement: Delete shortcut
The system SHALL support deleting the currently selected node when the user presses Backspace or Delete.

#### Scenario: Delete selected node via keyboard
- **WHEN** a node is selected and the user presses Backspace or Delete
- **THEN** the selected node is removed from the board

---

### Requirement: Duplicate shortcut
The system SHALL support duplicating the currently selected node when the user presses Ctrl+D. The duplicated node SHALL be spawned slightly offset from the original node's position.

#### Scenario: Duplicate selected node via keyboard
- **WHEN** a node is selected and the user presses Ctrl+D
- **THEN** a new node is created with the same properties and content, shifted by 20px horizontally and vertically

