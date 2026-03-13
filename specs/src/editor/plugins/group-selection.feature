Feature: Group-first selection and drill-in editing
  As a canvas user
  I want grouped layers to select as a unit by default
  So that I can move groups quickly and only drill into individual members when I explicitly ask to

  Scenario: Single click selects the whole group
    Given a group contains multiple layers
    And no group member is isolated for direct editing
    When the user clicks any layer in the group
    Then all layers in that group become selected

  Scenario: Double click isolates one layer inside the group
    Given a whole group is selected
    When the user double clicks one layer in that group
    Then only that layer remains selected
    And the group enters per-layer editing mode

  Scenario: Polygon inside group does not jump straight to vertex editing
    Given a group is selected
    And one member of the group is a polygon
    When the user double clicks the polygon for the first time
    Then only that polygon remains selected
    And polygon vertex editing does not start yet

  Scenario: Vertex editing only starts after polygon isolation
    Given only a polygon is selected from its group
    When the user double clicks the polygon again
    Then polygon vertex editing is enabled

  Scenario: Triangle inside group does not jump straight to vertex editing
    Given a group is selected
    And one member of the group is a triangle
    When the user double clicks the triangle for the first time
    Then only that triangle remains selected
    And triangle vertex editing does not start yet

  Scenario: Triangle vertex editing only starts after isolation
    Given only a triangle is selected from its group
    When the user double clicks the triangle again
    Then triangle vertex editing is enabled
