Feature: Polygon tool
  As a designer
  I want a multi-vertex polygon tool
  So that I can create complex custom shapes with precise control

  Scenario: Multi-click creation and escape flow
    Given the polygon tool is active
    When the user places multiple vertices with clicks
    And a preview vertex follows the pointer
    When the user presses Escape
    Then only the preview vertex is removed while committed vertices remain
    And polygon creation is finalized

  Scenario: Vertex editing and removal
    Given a polygon is selected
    When the user double-clicks the polygon
    Then vertex editing mode is activated
    When the user right-clicks a vertex marker
    Then that vertex is removed and the shape is rebuilt
    But the layer remains as long as at least two vertices exist

  Scenario: UI markers for precision
    Given a polygon is selected
    Then square markers are shown for bounding-box resizing
    When vertex editing is active
    Then circular markers are shown for direct point manipulation

  Scenario: Code generation as helper functions
    When the user generates source code for a polygon
    Then a dedicated helper function is created in the output
    And the helper function name is sanitized for C-style compatibility
    And the main drawing loop calls this function to render the shape
