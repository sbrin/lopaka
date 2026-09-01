Feature: Agent access to the editor asset library
  As a Lopaka user working with an agent
  I want the agent to find, inspect, and place editor assets
  So that icons and imported images can be added without simulating UI clicks

  Scenario: Search every current asset source
    Given the Lopaka editor is open
    When the agent searches the asset library
    Then matching built-in icons from the bundled icon packs are returned
    And matching images imported into the current session are returned
    And every result has a stable asset identifier, collection, dimensions, and supported placement properties

  Scenario: Preview an asset
    Given the agent found an icon or imported image
    When the agent requests its preview
    Then a PNG data URL and its dimensions are returned

  Scenario: Place an asset at explicit coordinates
    Given the agent found an asset and knows its dimensions
    When the agent adds it at Canvas coordinates 12, 8
    Then the asset is added with its top-left corner at 12, 8
    And the new layer is selected
    And the addition is one undoable editor action
    And the result contains the created layer identifier and current structure token

  Scenario: Centre an asset when coordinates are omitted
    Given the agent found an asset
    When the agent adds it without coordinates
    Then the asset is centred on the active Canvas

  Scenario: Reject incomplete or invisible placement
    Given the agent found an asset
    When the agent supplies only one coordinate or places the asset completely outside the Canvas
    Then the request is rejected
    And no layer is added

  Scenario: Tint a supported asset while placing it
    Given a monochrome asset and platform expose an editable color property
    When the agent adds the asset with color "#33aaFF"
    Then the layer is added with color "#33AAFF"

  Scenario: Preserve an RGB image's original colors
    Given an RGB image does not expose a tint color property
    When the agent tries to add it with a color
    Then the request is rejected
    And the image is not added or recolored

  Scenario: Reject an asset the active platform cannot draw
    Given the active platform does not support image layers
    When the agent adds an asset
    Then the request fails with an "unsupported_for_platform" error
    And no layer is added

  Scenario: Reject a stale asynchronous addition
    Given the agent starts loading an asset
    When the platform changes before loading completes
    Then the request returns "stale_context"
    And no partial layer is added

  Scenario: Use produced identifiers without translation
    Given the agent found and added an asset
    When the agent passes the returned layer identifier to the layer read tool
    Then the newly added layer is returned

  Scenario: Importing a new image stays a user workflow
    Given the Lopaka editor is open
    When the agent requests available capabilities
    Then importing a new image file is identified as a direct user action
    And already imported images are available to the agent as assets
