Feature: Polygon marker rendering
  As a user editing polygon geometry
  I want edit markers to communicate the current editing mode clearly
  So that I can distinguish vertex editing from normal resize handles and target pixels precisely

  Scenario: Normal resize mode uses square markers
    Given a selected resizable layer is not in polygon vertex editing mode
    When resize markers are drawn
    Then square markers are rendered

  Scenario: Polygon vertex editing uses circular markers
    Given a selected polygon is in vertex editing mode
    When edit markers are drawn
    Then circular markers are rendered instead of square markers

  Scenario: All markers are enlarged by two pixels
    Given edit markers are drawn
    When marker geometry is calculated
    Then each marker is larger than the standard handle size

  Scenario: Polygon vertex markers align to the center of the scaled pixel cell
    Given a selected polygon is in vertex editing mode
    And the canvas scale is greater than one
    When vertex markers are drawn
    Then each marker is centered on the edited pixel cell
