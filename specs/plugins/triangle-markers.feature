Feature: Triangle marker rendering
  As a user editing triangle geometry
  I want edit markers to communicate the current triangle editing mode clearly
  So that resize and vertex editing are easy to distinguish

  Scenario: Triangle resize mode uses square markers
    Given a selected triangle is not in vertex editing mode
    When edit markers are drawn
    Then square markers are rendered
    And corner and edge markers are both shown

  Scenario: Triangle vertex editing uses circular markers
    Given a selected triangle is in vertex editing mode
    When edit markers are drawn
    Then circular markers are rendered instead of square markers
