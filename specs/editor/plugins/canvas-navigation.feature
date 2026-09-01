Feature: Canvas navigation
  As a Lopaka user
  I want the canvas to stay positioned predictably in the editor viewport
  So that I can keep working when the screen setup changes

  Scenario: Recenter the canvas after changing the display size
    Given the canvas is open in the editor viewport
    When I change the display width or height
    Then the resized canvas is centered in the editor viewport

