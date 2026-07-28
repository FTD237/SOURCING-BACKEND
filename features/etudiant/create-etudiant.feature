Feature: Student creation
  As an administrator
  I want to create a student account
  So that the student receives an account activation email

  Background:
    Given I am logged in as user "admin@school.cm" with id "USER-ADMIN-1"
    And the role "etudiant" exists in the system

  Scenario: Successfully create a student with activation email sent
    Given no user exists with the email "jean.dupont@etu.cm"
    When I create a student with the following information:
      | nom         | Dupont              |
      | prenom      | Jean                |
      | email       | jean.dupont@etu.cm  |
      | matricule   | MAT-2026-001        |
      | promotionId | PROMO-L1            |
    Then the creation should succeed
    And a user should be created with status "EN_ATTENTE_ACTIVATION"
    And a student should be created with status "actif"
    And an activation token should be generated and saved
    And an activation email should be sent to "jean.dupont@etu.cm"
    And the response should contain the created user and student

  Scenario: Creation still succeeds even if sending the activation email fails
    Given no user exists with the email "marie.claire@etu.cm"
    And the mail service is unavailable
    When I create a student with the following information:
      | nom         | Claire               |
      | prenom      | Marie                |
      | email       | marie.claire@etu.cm  |
      | matricule   | MAT-2026-002         |
      | promotionId | PROMO-L2             |
    Then the creation should succeed regardless
    And the user and student should be persisted in the database
    And an error should be logged for the failed email delivery
    But the transaction should not be rolled back

  # ---- Failing cases ----

  Scenario: Creation fails when the email already exists
    Given a user already exists with the email "existing@etu.cm"
    When I attempt to create a student with the email "existing@etu.cm"
    Then the creation should fail with a business conflict error
    And the error message should state "Un utilisateur avec l'email existing@etu.cm existe déjà"
    And no user or student should be created in the database
    And no email should be sent

  Scenario: Creation fails when the "etudiant" role does not exist
    Given no user exists with the email "paul.simo@etu.cm"
    And the role "etudiant" does not exist in the system
    When I attempt to create a student with the email "paul.simo@etu.cm"
    Then the creation should fail with a "notFound" error
    And the error message should indicate that the role "etudiant" does not exist
    And no user or student should be created in the database

  Scenario: Failure and rollback when saving the user fails
    Given no user exists with the email "db.error@etu.cm"
    And the database save operation will fail
    When I attempt to create a student with the email "db.error@etu.cm"
    Then the transaction should be rolled back
    And a "database" error should be returned
    And no user or student should remain in the database
    And no email should be sent

  Scenario: Failure and rollback when generating the activation token fails
    Given no user exists with the email "token.failure@etu.cm"
    And the role "etudiant" exists in the system
    And the activation token generation service fails
    When I attempt to create a student with the email "token.failure@etu.cm"
    Then the transaction should be rolled back
    And no user or student should remain in the database
    And no email should be sent

  Scenario Outline: Creation fails due to missing required fields
    Given no user exists with the email "<email>"
    When I attempt to create a student without providing the "<missing_field>" field
    Then the creation should fail with a validation error
    And the error message should mention the field "<missing_field>"

    Examples:
      | email          | missing_field |
      | test1@etu.cm   | nom           |
      | test2@etu.cm   | prenom        |
      | test3@etu.cm   | email         |
      | test4@etu.cm   | matricule     |
      | test5@etu.cm   | promotionId   |