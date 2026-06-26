## MODIFIED Requirements

### Requirement: Drawing arrow connections

The system SHALL allow users to create a connection (arrow) between any two existing card elements (text nodes or image nodes) by using a dedicated Arrow tool. The user can optionally drag from a specific anchor point (top, right, bottom, left) on the source card to a specific anchor point on the target card to fix the arrow to those sides.

#### Scenario: Successfully drawing an arrow between two text cards with specific anchor points

- **WHEN** the user selects the Arrow tool, hovers over card A, clicks down on the top anchor dot, drags to the bottom anchor dot of card B, and releases the pointer
- **THEN** a permanent visual arrow is created starting from the top side of card A and pointing to the bottom side of card B

#### Scenario: Dragging to empty space cancels arrow creation

- **WHEN** the user selects the Arrow tool, clicks down on text card A, drags to empty space, and releases the pointer
- **THEN** no arrow connection is created

---

### Requirement: Dynamic arrow repositioning

The system SHALL dynamically update the start and end coordinates of any arrow connection when the connected cards are moved or resized. If specific anchor points (sides) were chosen during creation, the arrow MUST remain connected to the centers of those specific sides. If no specific anchors were chosen, the arrow MUST dynamically snap to the closest edge center of each card.

#### Scenario: Moving a card with specific anchor points maintains those anchors

- **WHEN** the user moves a card connected with a specific anchor (e.g. top side)
- **THEN** the arrow's connection point remains fixed to the center of the top side of the card, regardless of the relative position of the other card
