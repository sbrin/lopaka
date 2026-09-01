Feature: Code generation settings
  Code generation should start with the complete output supported by the selected platform.

  Scenario: Open code settings without saved preferences
    Given the selected platform exposes code generation settings
    And no preferences have been saved for that platform
    When the user opens the code settings
    Then every setting exposed by that platform is enabled
    And settings unsupported by that platform are not shown

  Scenario: Open code settings with saved preferences
    Given the user has changed code settings for the selected platform
    When the user opens the code settings again
    Then the saved choices override the enabled defaults
