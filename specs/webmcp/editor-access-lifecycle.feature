Feature: Editor agent access and lifecycle
  As a Lopaka user with a WebMCP-capable browser agent
  I want agent access to follow the open editor and its current state
  So that I can ask the agent to work immediately without letting it act on stale state

  Scenario: The open editor is the agent context
    Given the Lopaka editor is open
    When an agent requests the current Lopaka context and capabilities
    Then the context identifies the active editor
    And it reports the active platform and display size
    And editor read and mutation tools are advertised
    And the result carries a context identifier for the active editor

  Scenario: Editing needs no separate permission step
    Given the Lopaka editor is open
    When the agent discovers Lopaka tools
    Then mutation tools are advertised together with read tools
    And the user does not need to enable a separate Lopaka permission

  Scenario: Current state is read at invocation time
    Given WebMCP tools were registered when the editor loaded
    And the user changed the platform or display size afterwards
    When the agent requests the current Lopaka context
    Then the result reports the current platform and display size

  Scenario: Mutation rejects a stale editor context
    Given the agent read the editor context
    And the user switched the platform before the mutation
    When the agent invokes a mutation with the previous context identifier
    Then the request fails with a "stale_context" error
    And the editor state is unchanged

  Scenario: Structural mutation rejects stale layer structure
    Given the agent read the active layer structure
    And the user added, removed, reordered, grouped, or ungrouped a layer
    When the agent invokes a structural mutation with the previous structure token
    Then the request fails with a "stale_layer_state" error
    And the current layer structure is unchanged

  Scenario: Tools are unregistered when the editor page is left
    Given Lopaka tools are registered for the open editor
    When the user navigates away from that page
    Then those tools are no longer available to the agent

  Scenario: WebMCP is unavailable
    Given the browser does not expose WebMCP
    When the Lopaka editor loads
    Then the editor continues to work through its normal UI
    And no WebMCP capability is advertised

  Scenario: Tool results use one structured envelope
    Given a Lopaka WebMCP tool is available
    When the agent invokes that tool
    Then the result identifies success or a stable error
    And a successful result contains structured data
    And every Lopaka tool uses the same result envelope

  Scenario: Read tools describe untrusted content
    Given a read tool can return layer names, layer text, or generated code
    When the agent discovers that tool
    Then the tool is marked read-only
    And its result is marked as containing untrusted content

  Scenario: Invalid input is rejected atomically
    Given the Lopaka editor is open
    When an agent supplies an unknown field or an out-of-range value
    Then the request fails with an "invalid_input" error identifying the field
    And no part of the requested change is applied

  Scenario: Unsupported platform capability is rejected
    Given the active platform does not support a requested layer capability
    When the agent requests that capability
    Then the request fails with an "unsupported_for_platform" error
    And the editor state is unchanged

  Scenario: A rejected request leaves no history entry
    Given the editor has an undo history
    When an agent request fails with any error
    Then no new undo entry is created
