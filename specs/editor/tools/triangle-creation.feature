Feature: Triangle creation from a single click
  As a canvas user
  I want a quick click to create a visible triangle at the clicked point
  So that accidental zero-size geometry does not appear in a corner

  Scenario: Single click creates a default-sized triangle at the pointer
    Given the triangle tool is active
    When the user presses and releases the pointer without dragging
    Then the new triangle layer becomes active immediately
    And the new triangle layer is selected immediately
    And a small triangle is created at the clicked point
    And the triangle uses a default size of 5 by 5 pixels
    And the triangle is created as a symmetric default triangle
    And the triangle does not appear at the canvas origin unless that is where the user clicked
