## ADDED Requirements

### Requirement: Undo canvas actions
The system SHALL support undoing the last state-changing action performed by the user on the board, including drawing a stroke, adding or modifying a text card, or uploading an image.

#### Scenario: Undo a stroke drawing
- **WHEN** the user draws a stroke and then presses Ctrl+Z
- **THEN** the last stroke is removed from the board

#### Scenario: Undo a card text update
- **WHEN** the user edits a card's text and then presses Ctrl+Z
- **THEN** the card's text reverts to its state before the edit

---

### Requirement: Redo canvas actions
The system SHALL support redoing actions that have been undone, restoring them to the board state.

#### Scenario: Redo an undone action
- **WHEN** the user undoes an action using Ctrl+Z and then presses Ctrl+Y
- **THEN** the undone action is re-applied to the board
