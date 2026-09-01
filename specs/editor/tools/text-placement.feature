Feature: Text and text area placement on the viewport
  As a canvas user working at any zoom level or scroll position
  I want new text and text area layers to appear where I am currently looking
  So that I do not have to scroll or hunt for newly created text off-screen

  Scenario: Text is created at the center of the visible viewport
    Given the text tool is active
    And the canvas is scrolled so a specific region is visible
    When the user activates the text tool without dragging
    Then a new text layer is created
    And the text layer is centered on the currently visible viewport, not the full canvas

  Scenario: Text area is created at the center of the visible viewport
    Given the text area tool is active
    And the canvas is scrolled so a specific region is visible
    When the user activates the text area tool without dragging
    Then a new text area layer is created
    And the text area layer is centered on the currently visible viewport, not the full canvas

  Scenario: Text placement stays within the canvas even when the viewport center falls outside it
    Given the visible viewport center falls outside the canvas due to scrolling or zooming
    When a new text or text area layer is created
    Then the layer is placed fully inside the canvas bounds

  Scenario: Text placement falls back to the canvas center when no viewport is available
    Given the editor has not been mounted with a scrollable viewport
    When a new text or text area layer is created
    Then the layer is centered on the full canvas

