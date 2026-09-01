Feature: Agent layer selection and organization
  As a Lopaka editor user with a browser agent
  I want the agent to select and organize layers on the screen
  So that it can prepare a design while I retain control of destructive and history actions

  Background:
    Given the Lopaka editor is open with several layers

  Scenario: Select one layer
    When an agent selects one layer using its `layerId` from the layer list
    Then that layer is the only selected layer
    And reading the layers returns that exact selection

  Scenario: Select several layers exactly
    When an agent supplies several layer identifiers as the complete selection
    Then exactly those layers are selected
    And reading the layers returns those selected identifiers in stacking order

  Scenario: Add and remove layers from the selection
    Given one layer is selected
    When an agent adds another layer and removes the first by identifier
    Then only the added layer remains selected

  Scenario: Select a contiguous stacking range
    When an agent selects a range between two layer identifiers
    Then every layer between those identifiers is selected
    And layers inside collapsed UI groups are included

  Scenario: Select a whole group
    Given several layers belong to one group
    When an agent selects that group
    Then every group member is selected

  Scenario: Clear selection
    Given layers are selected
    When an agent clears the selection
    Then no layer is selected

  Scenario: Selection contains an unknown layer
    When an agent selects a list containing an unknown identifier
    Then the request fails with a "not_found" error
    And the previous selection is unchanged

  Scenario Outline: Change a non-destructive layer state
    Given a layer is <before>
    When an agent makes it <after>
    Then the layer is <after>
    And its other state is unchanged

    Examples:
      | before   | after    |
      | visible  | hidden   |
      | hidden   | visible  |
      | unlocked | locked   |
      | locked   | unlocked |

  Scenario: Reorder one layer with current structure
    Given the agent has the current layer structure token
    When it moves a layer before another layer
    Then the stacking order reflects that move
    And every layer remains present exactly once
    And the result contains the next structure token

  Scenario: Reorder all layers explicitly
    Given the agent has the current layer structure token
    When it supplies every layer identifier in a new stacking order
    Then the layer list uses that order
    And no layer is lost or duplicated

  Scenario: Reject an incomplete layer order
    Given the agent has the current layer structure token
    When it supplies an order that omits or repeats a layer identifier
    Then the request fails with an "invalid_input" error
    And the stacking order is unchanged

  Scenario: Move a layer into a group
    Given a named group exists
    And the agent has the current layer structure token
    When it places an ungrouped layer at a position inside the group
    Then the layer joins that group at the requested position

  Scenario: Move a layer out of a group
    Given a layer belongs to a group
    And the agent has the current layer structure token
    When it places the layer at a root stacking position
    Then the layer becomes ungrouped at that position

  Scenario: Create a group
    Given two or more layers exist
    And the agent has the current layer structure token
    When it groups them using a valid group name
    Then those layers belong to that group
    And no other layer changes group

  Scenario: Ungroup layers
    Given layers belong to a group
    And the agent has the current layer structure token
    When it ungroups those layers
    Then they remain in their current stacking positions without a group

  Scenario: User changes structure before the agent
    Given the agent has an older layer structure token
    When it requests reorder, group, or ungroup
    Then the request fails with a "stale_layer_state" error
    And the user's current layer structure is preserved

  Scenario: Undo and redo remain user-controlled
    Given the user or agent has made an editor change
    When the agent requests available capabilities
    Then undo and redo are identified as direct user actions

  Scenario: Destructive and copy actions remain user-controlled
    Given layers exist on the screen
    When the agent requests available capabilities
    Then cut, duplicate, and paste are identified as direct user actions
