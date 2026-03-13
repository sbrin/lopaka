Feature: Polygon editing and escape flow
  As a canvas user
  I want polygon editing to preserve committed work while letting me step back safely
  So that I can create and refine polygons without losing context

  Scenario: Escape removes only the preview vertex during polygon creation
    Given the user is creating a polygon with multi-click placement
    And the polygon has committed vertices plus one preview vertex
    When the user presses Escape
    Then only the preview vertex is removed
    And all committed vertices remain
    And polygon creation mode is exited

  Scenario: First Escape exits polygon vertex editing without clearing selection
    Given a polygon is selected
    And polygon vertex editing is enabled
    When the user presses Escape
    Then polygon vertex editing is turned off
    And the polygon remains selected

  Scenario: Second Escape clears selection after vertex editing is already off
    Given a polygon is selected
    And polygon vertex editing is disabled
    When the user presses Escape
    Then the selection is cleared

  Scenario: Right click deletes a polygon vertex
    Given a polygon is in vertex editing mode
    When the user right-clicks a vertex marker
    Then that vertex is removed
    And the polygon geometry is rebuilt

  Scenario: Vertex deletion keeps a two-point polygon
    Given a polygon is in vertex editing mode
    And removing one vertex would leave exactly two points
    When the user right-clicks that vertex marker
    Then the layer remains in the document
    And the remaining shape stays selectable

  Scenario: Vertex deletion removes a one-point polygon
    Given a polygon is in vertex editing mode
    And removing one vertex would leave only one point
    When the user right-clicks that vertex marker
    Then the polygon layer is removed

  Scenario: Vertex deletion does not clear surrounding selection state
    Given a polygon is selected
    Or a polygon is selected as part of a wider grouped editing context
    When the user right-clicks a polygon vertex marker
    Then selection stays unchanged unless the polygon layer itself is removed
