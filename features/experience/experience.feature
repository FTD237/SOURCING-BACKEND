Feature: Student experience management

  Background:
    Given a student "etu-1" exists

  Scenario: Create a new experience
    When I create an experience for student "etu-1"
    Then the experience is saved successfully
    And the experience is associated with student "etu-1"

  Scenario: List all experiences
    Given several experiences are registered
    When I request the list of all experiences
    Then I receive the complete list with student information

  Scenario: Search for a student's experiences
    Given student "etu-1" has 2 registered experiences
    When I search for experiences of student "etu-1"
    Then I receive 2 experiences linked to this student

  Scenario: Search for experiences of a student with no experience
    Given student "etu-2" has no experience
    When I search for experiences of student "etu-2"
    Then I receive an empty list

  Scenario: View an existing experience
    Given an experience "exp-1" exists
    When I view experience "exp-1"
    Then I receive the details of experience "exp-1"

  Scenario: View a non-existing experience
    When I view experience "exp-unknown"
    Then I receive a "not found" error

  Scenario: Update an existing experience
    Given an experience "exp-1" exists
    When I update the status of experience "exp-1" to "INACTIVE"
    Then experience "exp-1" has the status "INACTIVE"

  Scenario: Update a non-existing experience
    When I update experience "exp-unknown"
    Then I receive a "not found" error

  Scenario: Delete (soft delete) an experience
    Given an experience "exp-1" exists with status "ACTIVE"
    When I delete experience "exp-1"
    Then experience "exp-1" has the status "DELETED"
    And experience "exp-1" has a deletion date set

  Scenario: Delete a non-existing experience
    When I delete experience "exp-unknown"
    Then I receive a "not found" error