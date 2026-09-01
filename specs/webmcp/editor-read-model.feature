Feature: Agent-readable editor state
  As a Lopaka editor user with a WebMCP-capable browser agent
  I want the active screen, selection, layers, warnings, and generated code to be available as structured tools
  So that the agent can understand my design before it proposes or makes a change

  Scenario: Inspecting the active screen
    Given the Lopaka editor is open
    When an agent requests its summary
    Then it receives the platform, display size, background color, and layer count
    And it receives whether the display size is a preset or a custom size
    And it receives a context identifier for the active editor

  Scenario: Inspecting the active selection
    Given the editor has several selected layers
    When an agent requests its summary
    Then it receives the selected layer identifiers in stacking order
    And it receives whether undo and redo are currently available

  Scenario: Listing layers on the active screen
    Given the editor contains visible and hidden layers
    When an agent requests the layer list
    Then it receives each layer's identifier, name, type, stacking index, group, bounds, visibility, lock state, and selection state
    And each layer exposes its identifier as `layerId`
    And each layer includes its user-editable properties
    And each property is present only when the active platform supports it
    And fixed properties are reported as non-editable
    And the result contains a token for the current layer structure

  Scenario: Listing a layer with incomplete bounds
    Given the editor contains a layer without usable bounds
    When an agent requests the layer list
    Then that layer is returned with null bounds

  Scenario: Reading text layer content
    Given the editor contains text layers
    When an agent requests the layer list
    Then each text layer includes its exact current text

  Scenario: Reading one layer in detail
    Given the editor contains a layer
    When an agent requests that layer using its `layerId` from the layer list
    Then it receives the layer's current properties and supported actions
    And the property list is the authoritative exact list for a later update
    And user-authored text in the result is marked as untrusted content

  Scenario: Reading current editor messages
    Given the editor has informational messages and warnings
    When an agent requests its summary
    Then it receives the current informational messages and warnings in display order

  Scenario: Reading the screen after restored layers finish loading
    Given the WebMCP tools were registered before the locally stored layers finished loading
    When an agent requests the screen after its layers are loaded
    Then it receives the current layers and generated code

  Scenario: Generating code for the active screen
    Given the editor has a selected platform
    When an agent requests generated code
    Then it receives the code produced by Lopaka for that screen in the shared result envelope
    And the code reflects the current code generation settings

  Scenario: Viewing the active canvas
    Given the editor has a rendered canvas
    When an agent requests the canvas PNG
    Then it receives an opaque PNG data URL composited over the active project background color
    And it receives the canvas dimensions in native display pixels

  Scenario: Relating generated code to layers
    Given the editor has generated output for several layers
    When an agent requests generated code
    Then the result maps generated code ranges to stable layer identifiers
    And the agent can select a mapped layer using the normal layer-selection tool

  Scenario Outline: Read tools share one result shape
    Given the Lopaka editor is open
    When an agent invokes <tool>
    Then the result uses the shared success or error envelope

    Examples:
      | tool                      |
      | lopaka_get_screen_summary |
      | lopaka_list_layers        |
      | lopaka_generate_code      |
      | lopaka_get_canvas_png     |

  Scenario: Unknown layer identifier
    Given the Lopaka editor is open
    When an agent requests a layer identifier that is not on the screen
    Then the request fails with a "not_found" error
    And the editor state is unchanged
