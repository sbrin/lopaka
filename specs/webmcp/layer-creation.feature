Feature: Agent layer creation
  As a Lopaka editor user with a browser agent
  I want every supported editor tool to create its corresponding layer through one structured contract
  So that the agent can build a complete screen without simulating pointer input

  Background:
    Given the Lopaka editor is open

  Scenario: Capabilities publish exactly the creatable layer types
    When an agent reads capabilities and the layer-creation schema
    Then both contracts expose the same layer type values
    And each layer type exposes exact `creationProperties` matching its discriminated creation branch
    And the values include "paint"
    And the values do not include "image" or "icon"
    And image import remains a separate editor workflow

  Scenario Outline: Create a platform-supported layer
    Given the active platform supports <type>
    When an agent creates a <type> layer with valid properties
    Then one <type> layer is added to the screen
    And the created layer is selected
    And the result contains its identifier and normalized properties
    And the result contains the next layer structure token
    And the creation can be undone as one change

    Examples:
      | type      |
      | text      |
      | text area |
      | rectangle |
      | panel     |
      | circle    |
      | ellipse   |
      | line      |
      | triangle  |
      | polygon   |
      | button    |
      | switch    |
      | slider    |
      | checkbox  |
      | paint     |

  Scenario: Reject a layer unsupported by the active platform
    Given the active platform does not support a requested layer type
    When an agent tries to create that layer
    Then the request fails with an "unsupported_for_platform" error
    And no layer is created

  Scenario: Create a bounded shape
    Given the active platform supports rectangles
    When an agent creates a rectangle with x, y, width, and height
    Then the rectangle bounds use those normalized display coordinates

  Scenario: Create a line from endpoints
    Given the active platform supports lines
    When an agent creates a line with two endpoint coordinates
    Then the line connects those exact points

  Scenario: Create a triangle from its editable coordinates
    Given the active platform supports triangles
    When an agent supplies x1, y1, x2, y2, x3, and y3
    Then the triangle uses those vertices and reports its calculated bounds

  Scenario: Create a polygon from vertices
    Given the active platform supports polygons
    When an agent supplies at least three ordered vertices
    Then the polygon is completed using that vertex order

  Scenario: Reject an incomplete polygon
    Given the active platform supports polygons
    When an agent supplies fewer than three vertices
    Then the request fails with an "invalid_input" error
    And no preview or incomplete polygon remains

  Scenario: Keep fixed and raster geometry out of creation contracts
    Given the active platform supports checkbox and paint layers
    When an agent supplies width or height for either type
    Then the request fails with an "invalid_input" error
    And no layer or history entry is created

  Scenario: Create a text layer with exact content
    Given the active platform supports text
    When an agent creates text with content, font, position, color, and rotation supported by the platform
    Then the layer displays the exact content using the requested supported properties

  Scenario: Create a text area with multiline content
    Given the active platform supports text areas
    When an agent creates a text area with multiline content and bounds
    Then the full content and bounds are preserved

  Scenario Outline: Create a default-sized widget
    Given the active platform supports <widget>
    When an agent creates a <widget> without geometry
    Then Lopaka creates it with the same default size and centered placement as the editor UI

    Examples:
      | widget   |
      | panel    |
      | button   |
      | switch   |
      | slider   |
      | checkbox |

  Scenario: Create a paint layer without drawing
    Given the active platform supports paint layers
    When an agent creates a paint layer
    Then an empty paint layer is selected and ready for a paint stroke

  Scenario: Reject unknown creation properties
    When an agent creates a layer with a property that the type does not support
    Then the request fails with an "invalid_input" error identifying that property
    And no layer is created

  Scenario: Reject creation for a stale editor context
    Given the user changed the platform after the agent read the editor context
    When the agent creates a layer using the previous context identifier
    Then the request fails with a "stale_context" error
    And no layer is created

  Scenario: Created layers persist locally
    Given the agent created a layer
    When the browser reloads the editor on the same platform
    Then the created layer is restored from local storage
