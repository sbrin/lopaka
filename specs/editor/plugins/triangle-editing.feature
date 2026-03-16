Feature: Triangle edit mode switching
  As a canvas user
  I want triangles to switch between resize and vertex editing explicitly
  So that the default selection flow matches polygons and I can edit geometry only when intended

  Scenario: Selecting a triangle keeps it in resize mode by default
    Given a triangle layer is selected
    When edit handles are shown
    Then resize handles are shown for the triangle bounds
    And edge resize handles are shown for the triangle bounds
    And triangle vertex editing is disabled

  Scenario: Double click enables triangle vertex editing
    Given a single triangle layer is selected
    When the user double clicks the triangle
    Then triangle vertex editing is enabled
    And triangle vertex handles are shown instead of resize handles

  Scenario: Escape exits triangle vertex editing before clearing selection
    Given a triangle layer is selected
    And triangle vertex editing is enabled
    When the user presses Escape
    Then triangle vertex editing is turned off
    And the triangle remains selected

  Scenario: Selecting another layer exits triangle vertex editing
    Given a triangle layer is selected
    And triangle vertex editing is enabled
    When the user selects a different layer
    Then triangle vertex editing is turned off

  Scenario: Shift keeps triangle resize proportional
    Given a triangle layer is selected in resize mode
    When the user drags a triangle resize handle while holding Shift
    Then the triangle keeps its proportions during resize

  Scenario: Option resizes the triangle from the center
    Given a triangle layer is selected in resize mode
    When the user drags a triangle resize handle while holding Option
    Then the triangle resizes around its center
