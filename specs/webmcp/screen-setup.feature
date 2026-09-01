Feature: Agent control of platform, display, and local screen state
  As a Lopaka user with a browser agent
  I want the agent to read and change the target platform, display size, and screen background
  So that I can set up the screen I am designing for by asking for it in words

  Background:
    Given the Lopaka editor is open

  Scenario: Read the setup options
    When an agent reads the screen setup options
    Then every selectable platform is listed with its identifier, name, and description
    And each platform states whether it is monochrome and which display sizes it offers
    And the supported range for a custom display size is stated

  Scenario: Read the current setup
    When an agent reads the current screen setup
    Then the active platform, display size, background color, and layer count are stated
    And whether the display size is a preset or a custom size is stated

  Scenario: Change the display size to a listed preset
    When an agent sets a display size the active platform offers
    Then the canvas uses that display size
    And the layers on the screen are preserved

  Scenario: Display selector follows an externally changed preset
    Given the display selector shows one preset size
    When an agent changes the active display to another listed preset
    Then the display selector shows the newly active preset

  Scenario: Set a custom display size
    When an agent sets a width and height that no listed display offers
    Then the canvas uses exactly that display size
    And the screen reports that its display size is custom

  Scenario Outline: Reject an invalid display size
    When an agent sets a display size that is <invalid size>
    Then the request fails with an "invalid_input" error
    And the display size is unchanged

    Examples:
      | invalid size                  |
      | below the supported range     |
      | above the supported range     |
      | not a whole number of pixels  |

  Scenario: Change the screen background color
    When an agent sets a background color the active platform allows
    Then the canvas uses that background color
    And the editor UI reflects the new background immediately

  Scenario: Reject an invalid background color
    When an agent sets a background value that is not a color
    Then the request fails with an "invalid_input" error
    And the background color is unchanged

  Scenario: Switch the target platform
    When an agent switches to another supported platform
    Then the editor targets that platform
    And the locally stored layers for that platform are loaded
    And generated code uses that platform

  Scenario: Reject an unsupported platform
    When an agent switches to a platform Lopaka does not provide
    Then the request fails with an "unsupported_for_platform" error
    And the active platform is unchanged

  Scenario: A context read after a platform switch reports the new platform
    Given an agent switched the platform
    When the agent requests the current Lopaka context
    Then the context identifies the new platform
    And a mutation using the previous context identifier is rejected as stale

  Scenario: Setup changes persist locally
    Given an agent changed the platform, display size, or background color
    When the browser reloads the editor
    Then the restored editor uses those settings

  Scenario: Clearing the screen stays a user action
    When the agent requests available capabilities
    Then clearing the whole screen is identified as a direct user action
