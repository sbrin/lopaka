Feature: Code generation settings
  Code generation should start with the complete output supported by the selected platform.

  Scenario: Customize the display object name
    Given the selected platform generates calls to a display object
    When the user enters "myDisplay" in "Display object"
    Then drawing and setup commands use "myDisplay"
    And generated helper functions use the same display name
    And text content, comments and image symbols are unchanged
    And the name is remembered separately for each platform

  Scenario: Reset or reject a display object name
    When the user clears the display object name
    Then the platform's default name is used
    When the user enters an invalid identifier or a reserved keyword
    Then "Invalid name" is shown below the input
    And the generated code keeps the last valid name

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
