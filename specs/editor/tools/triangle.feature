Feature: Triangle tool
  As a designer
  I want a versatile triangle tool
  So that I can create and refine geometric shapes precisely

  Scenario: Point-and-click triangle creation
    Given the triangle tool is active
    When the user clicks on the canvas
    Then a symmetric 5x5 triangle is created at the clicked coordinates
    And the new triangle layer is selected for immediate editing

  Scenario: Proportional and centered resizing
    Given a triangle layer is selected
    When the user drags a resize handle while holding Shift
    Then the triangle maintains its original aspect ratio
    When the user drags a resize handle while holding Option
    Then the triangle resizes around its center point

  Scenario: Vertex editing mode
    Given a triangle layer is selected
    When the user double-clicks the triangle
    Then circular vertex handles are displayed
    And the user can move individual vertices to reshape the triangle
    When the user presses Escape
    Then the tool returns to bounding-box resize mode with square markers
