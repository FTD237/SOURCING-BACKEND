Feature: Rate limiting on authentication endpoints

  Scenario: Blocking excessive login attempts from the same IP
    Given a client makes 10 login attempts within 1 minute
    When the client makes a 11th login attempt
    Then the response status should be 429
    And the response should contain a rate limit error message