Feature: Polygon code generation
  As a user exporting embedded graphics code
  I want polygon layers to generate a dedicated helper function
  So that polygon drawing is emitted consistently in the exported source

  Scenario: Polygon layers are emitted through a helper function
    Given a polygon layer
    When the user generates source code
    Then the generated source defines a helper function for the polygon
    And the polygon helper function draws the polygon using line segments
    And the main drawing flow calls that polygon helper function

  Scenario: Polygon helper function names are derived from the layer name in a compatible form
    Given a polygon layer with a name that cannot be used directly as a function name
    When the user generates source code
    Then the generated polygon helper function name uses a compatible form of the layer name
    And the main drawing flow calls that same helper function
