Feature: U8g2 draw color switching
  As a user creating U8g2 projects
  I want to control the drawing color for U8g2 drawing layers
  So that I can compose overlapping shapes in both the display's white and black colors

  Scenario: Drawing color controls are available for drawing layers
    Given a U8g2 project is open
    And a drawing layer is selected
    Then the inspector provides White and Black drawing color controls

  Scenario: New drawing layers use White drawing color by default
    Given a U8g2 project is open
    When a drawing layer is created
    Then the drawing color is set to White

  Scenario: Generated code only switches draw color when it changes between layers
    Given a U8g2 project has layers using White then Black then White drawing color, in that order
    When the user generates source code
    Then a setDrawColor call is emitted before the first White layer
    And a setDrawColor call is emitted before the Black layer
    And a setDrawColor call is emitted before the second White layer
    And no setDrawColor call is emitted between consecutive layers that share the same drawing color

