Feature: Agent layer editing
  As a Lopaka editor user with a browser agent
  I want the agent to change and remove layers that already exist on the screen
  So that it can correct and refine a design instead of only adding to it

  Background:
    Given the Lopaka editor is open with several layers

  Scenario: Read the editable properties of a layer
    When an agent reads one layer using its `layerId` from the layer list
    Then the result lists each editable property with its current value and range
    And unsupported or fixed properties are absent from the editable update set
    And the result lists the layer operations the agent may perform

  Scenario: Update uses the exact properties read from the layer
    Given the agent has read a layer's authoritative property list
    When an agent sends a dynamic update keyed by `layerId`
    Then every accepted property is one of the properties reported for that layer
    And the update returns the normalized layer state

  Scenario: Update accepts top-level coordinates for a text layer
    Given the agent has read a text layer with editable `x` and `y` properties
    When an agent sends `x` and `y` as top-level fields in `lopaka_update_layer`
    Then the text layer's top-left bounds move to those coordinates
    And the update succeeds without a nested `properties` object
    And the canvas and inspector reflect the update immediately

  Scenario Outline: Change one property of an existing layer
    Given a layer exposes an editable <property>
    When an agent sets <property> to a valid value
    Then the layer reports that value
    And the change can be undone as one step

    Examples:
      | property |
      | x        |
      | y        |
      | text     |
      | color    |
      | fill     |

  Scenario: Change several properties of one layer together
    When an agent sets the position and size of a layer in one request
    Then the layer reports all of those values
    And the change can be undone as one step

  Scenario: Rename a layer
    When an agent sets a new name for a layer
    Then the layers list reports that name

  Scenario: Change the font of a text layer
    Given a text layer is on the screen
    When an agent sets a font the active platform provides
    Then the layer reports that font
    And the layer bounds reflect the new font

  Scenario: Reject an unknown font
    Given a text layer is on the screen
    When an agent sets a font the active platform does not provide
    Then the request fails with an "unsupported_for_platform" error
    And the layer keeps its previous font

  Scenario: Reject a property the layer does not have
    When an agent sets a property that the target layer does not expose
    Then the request fails with an "invalid_input" error
    And the layer is unchanged

  Scenario: Reject a value outside the supported range
    Given a layer exposes a property with a minimum and maximum
    When an agent sets a value outside that range
    Then the request fails with an "invalid_input" error
    And the layer is unchanged

  Scenario: Reject an edit to a read-only property
    When an agent sets a property the editor reports as fixed
    Then the request fails with an "invalid_input" error
    And the layer is unchanged

  Scenario: Reject an edit to a locked layer
    Given a layer is locked
    When an agent changes one of its properties
    Then the request fails with an "invalid_input" error
    And the layer is unchanged

  Scenario: Reject an edit to an unknown layer
    When an agent changes a property of an unknown layer identifier
    Then the request fails with a "not_found" error

  Scenario: Delete one layer
    Given the agent has the current layer structure token
    When an agent deletes one layer by identifier
    Then that layer is no longer on the screen
    And the remaining layers keep their order and grouping
    And the result contains the next layer structure token
    And the deletion can be undone as one step
    And the canvas and layer list reflect the deletion immediately

  Scenario: Delete several layers together
    Given the agent has the current layer structure token
    When an agent deletes several layers in one request
    Then none of those layers are on the screen
    And the deletion can be undone as one step

  Scenario: Delete rejects stale layer structure
    Given the agent read the active layer structure
    And the user added, removed, reordered, grouped, or ungrouped a layer
    When the agent deletes a layer with the previous structure token
    Then the request fails with a "stale_layer_state" error
    And every layer remains on the screen

  Scenario: Delete rejects an unknown layer
    Given the agent has the current layer structure token
    When an agent deletes a list containing an unknown identifier
    Then the request fails with a "not_found" error
    And every layer remains on the screen

  Scenario: Delete rejects a locked layer
    Given a layer is locked
    And the agent has the current layer structure token
    When an agent deletes that layer
    Then the request fails with an "invalid_input" error
    And every layer remains on the screen

  Scenario: Agent edits are saved locally like user edits
    When an agent changes or deletes a layer
    Then the resulting screen state is stored locally for the active platform
