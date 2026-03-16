Feature: Flipper Zero platform
  As a developer for Flipper Zero
  I want an editor environment that matches my device's hardware
  So that I can design and preview interfaces with 1:1 accuracy

  Scenario: Display and visual profile
    Then the editor provides specialized Flipper Zero and One screen sizes
    And the canvas displays the signature orange background
    And the session default color is set to black

  Scenario: Native font support
    Then the inspector provides the built-in Flipper Zero fonts:
      | FontPrimary    |
      | FontSecondary  |
      | FontKeyboard   |
      | FontBigNumbers |

  Scenario: Triangle tool capabilities on Flipper
    Given the current platform is Flipper Zero
    And a triangle layer is selected
    Then the inspector provides three-point vertex coordinate inputs
    And the inspector provides a toggle for Inverted (XOR) drawing
