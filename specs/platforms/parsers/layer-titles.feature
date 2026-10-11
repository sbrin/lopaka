Feature: Import layer titles from generated source code
  Scenario: Restore a title exported before a drawing command
    Given generated source code with layer titles enabled
    When the code is imported for the same platform
    Then imported layers retain the titles written in the standalone comments
    And drawing settings before a layer do not consume its title

  Scenario: Import code without titles
    Given source code without layer title comments
    When the code is imported
    Then layers keep the existing default naming behavior

  Scenario: Distinguish titles from text and inline comments
    Given drawing code containing comment characters inside quoted text
    And trailing comments after drawing commands
    When the code is imported
    Then quoted text is preserved
    And trailing comments are not used as layer titles

  Scenario: Restore an LVGL widget title
    Given generated LVGL code with a typed layer title comment
    When the code is imported
    Then the widget keeps its layer title without the exported type prefix
