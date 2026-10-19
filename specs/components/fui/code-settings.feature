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
    And the main code includes the corresponding header files instead of inline image data
    And drawing commands reference the same symbols declared in those headers
    And shared image data produces one header and one include

  Scenario: Choose header export after enabling image declarations
    Given "Declare images" is disabled
    Then "Include image files" is hidden
    When the user enables "Declare images"
    Then "Include image files" is visible and remains disabled
    And image data stays inline until the user enables "Include image files"
    When the user enables "Include image files"
    Then generated image headers are available for download
    When the user disables "Declare images"
    Then "Include image files" is disabled and hidden

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

  Scenario: Export MicroPython image modules
    Given a MicroPython screen contains images
    When the user enables "Include image files"
    Then each used image is available as a Python module
    And the generated code imports its bitmap data from that module

  Scenario: Export ESPHome image files
    Given an ESPHome screen contains images
    When the user enables "Include image files"
    Then each used image is available as a PNG file
    And the generated YAML references the downloaded filename
    And drawing commands reference the corresponding image ID
