Feature: Text layer stays within canvas bounds
  As a user positioning text on the canvas
  I want text to stay fully visible while I drag it or nudge it with arrow keys
  So that I cannot accidentally lose text off the edge of the screen

  Scenario: Dragging text past the left or top edge keeps it inside the canvas
    Given a text layer is selected
    When the user drags the text past the left or top edge of the canvas
    Then the text layer stops at the canvas edge instead of moving further off-screen

  Scenario: Dragging text past the right or bottom edge keeps it inside the canvas
    Given a text layer is selected
    When the user drags the text past the right or bottom edge of the canvas
    Then the text layer stops at the canvas edge instead of moving further off-screen

  Scenario: Nudging text with arrow keys keeps it inside the canvas
    Given a text layer is selected
    When the user nudges the text with arrow keys toward any edge of the canvas
    Then the text layer stops at the canvas edge instead of moving further off-screen

  Scenario: Setting the x or y position directly keeps text inside the canvas
    Given a text layer is selected
    When the user sets the text layer's x or y position to a value outside the canvas
    Then the position is clamped to keep the text fully inside the canvas

