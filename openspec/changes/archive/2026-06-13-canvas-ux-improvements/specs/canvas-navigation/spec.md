## ADDED Requirements

### Requirement: Spacebar enters panning mode
The system SHALL support entering a temporary panning mode while the user holds the Spacebar. In this mode, the cursor SHALL change to a grab cursor, and dragging with the left mouse button SHALL pan the camera.

#### Scenario: Hold spacebar to pan
- **WHEN** the user holds down the Spacebar and drags the canvas with the left mouse button
- **THEN** the camera pans, moving the viewport correspondingly

#### Scenario: Release spacebar to exit panning mode
- **WHEN** the user releases the Spacebar
- **THEN** the cursor and interaction mode revert to the active tool

---

### Requirement: Keyboard shortcut to reset camera
The system SHALL support resetting the camera's zoom and pan position to their default values when the user presses Shift+1.

#### Scenario: Press Shift+1 to reset camera
- **WHEN** the user presses Shift+1
- **THEN** the camera's zoom is set to 1 and pan position is set to x=0, y=0
