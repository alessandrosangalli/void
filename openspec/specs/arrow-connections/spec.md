# arrow-connections Specification

## Purpose

TBD - created by archiving change arrow-connections. Update Purpose after archive.

## Requirements

### Requirement: Drawing arrow connections

The system SHALL allow users to create a connection (arrow) between any two existing card elements (text nodes or image nodes) by using a dedicated Arrow tool.

#### Scenario: Successfully drawing an arrow between two text cards

- **WHEN** the user selects the Arrow tool, clicks down on text card A, drags to text card B, and releases the pointer
- **THEN** a permanent visual arrow is created starting from card A and pointing to card B

#### Scenario: Dragging to empty space cancels arrow creation

- **WHEN** the user selects the Arrow tool, clicks down on text card A, drags to empty space, and releases the pointer
- **THEN** no arrow connection is created

---

### Requirement: Dynamic arrow repositioning

The system SHALL dynamically update the start and end coordinates of any arrow connection when the connected cards are moved or resized, so that the arrow remains connected to the closest edge center of each card.

#### Scenario: Moving a connected card updates the arrow coordinates

- **WHEN** the user drags a connected card to a new position on the canvas
- **THEN** the arrow's start or end point moves dynamically to remain snapped to the closest side center of the card

---

### Requirement: Arrow deletion

The system SHALL support deleting connections. Deleting a card MUST automatically remove all connections attached to it. The Eraser tool SHALL also allow deleting a connection by clicking directly on the arrow.

#### Scenario: Deleting a card removes its connections

- **WHEN** the user deletes a card that has incoming or outgoing arrows
- **THEN** all arrows connected to that card are automatically removed from the canvas

#### Scenario: Erasing an arrow directly

- **WHEN** the user selects the Eraser tool and clicks on an arrow connection
- **THEN** the arrow connection is deleted from the canvas

---

### Requirement: Undo and redo connection actions

The system SHALL support undoing and redoing actions related to connections, including the creation and deletion of arrows.

#### Scenario: Undoing arrow creation

- **WHEN** the user creates an arrow connection and then triggers the Undo action
- **THEN** the created arrow connection is removed from the canvas
