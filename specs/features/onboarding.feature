Feature: Onboarding Experience
  As a new user
  I want a guided introduction to Lopaka
  So that I can start creating embedded graphics quickly

  Scenario: First-visit onboarding tour is shown
    Given I have never visited Lopaka before
    When I open the editor
    Then the onboarding tour should appear automatically
    And a starter template should be loaded on the canvas

  Scenario: Onboarding tour can be completed
    Given the onboarding tour is visible
    When I click "Next" through all steps
    Then the tour should complete
    And the onboarding should not appear again on future visits

  Scenario: Onboarding tour can be skipped
    Given the onboarding tour is visible
    When I click "Skip"
    Then the tour should close
    And the onboarding should not appear again on future visits

  Scenario: Returning user does not see onboarding
    Given I have previously completed or skipped onboarding
    When I open the editor
    Then the onboarding tour should not appear
    And the editor should load with my previous session state

  Scenario: Starter template loads on first visit
    Given I am visiting Lopaka for the first time
    When the editor initializes
    Then a "Hello World" template should be loaded
    And the canvas should display text elements
    And the generated code panel should show valid output
