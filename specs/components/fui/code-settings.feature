Feature: Code generation settings
  Code generation should start with the complete output supported by the selected platform.

  Scenario: Open code settings without saved preferences
    Given the selected platform exposes code generation settings
    And no preferences have been saved for that platform
    When the user opens the code settings
    Then the existing code inclusion settings exposed by that platform are enabled
    And exporting images as header files is disabled by default
    And settings unsupported by that platform are not shown

  Scenario: Open code settings with saved preferences
    Given the user has changed code settings for the selected platform
    When the user opens the code settings again
    Then the saved choices override the enabled defaults

  Scenario: Export image data as separate headers
    Given a C or C++ platform supports inline image declarations
    And the screen contains images used by the generated code
    When the user enables "Include image files" in Code Settings
    Then each generated image asset is available for individual download
    And the download list is titled "Images" without an explanatory paragraph
    And the main code includes the corresponding header files instead of inline image data
    And drawing commands reference the same symbols declared in those headers
    And shared image data produces one header and one include

  Scenario: Switch back to inline image data
    Given exporting images as header files is enabled
    When the user disables exporting images as header files
    Then image arrays are embedded in the main code again

  Scenario: Omit image declarations
    Given exporting images as header files is enabled
    When the user disables "Declare images"
    Then image includes and downloadable image headers are omitted

  Scenario: Keep downloads synchronized with the screen
    Given exporting images as header files is enabled
    When an image is changed or removed or the platform is changed
    Then the downloadable headers match the current generated code
