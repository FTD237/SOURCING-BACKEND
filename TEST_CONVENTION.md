# Conventions de rédaction — Tests unitaires & Cucumber

## Partie A — Tests unitaires (Jest)

### A.1 Nommage et emplacement

- Fichier colocalisé avec la source : `foo.service.ts` → `foo.service.spec.ts`.
- Jamais de suffixe `.test.ts` (le projet utilise `.spec.ts`, cf. `testRegex` dans `package.json`).

### A.2 Structure AAA (Arrange / Act / Assert)

```ts
describe('AuthService', () => {
  describe('login', () => {
    it('lève une BadRequestException si le mot de passe est incorrect', async () => {
      // Arrange
      const user = buildFakeUser({ password: await bcrypt.hash('correct', 10) });
      userRepository.findOne.mockResolvedValue(user);

      // Act
      const act = () => authService.login(user.email, 'wrong');

      // Assert
      await expect(act()).rejects.toThrow(BadRequestException);
    });
  });
});
```

- Un `describe` par classe/méthode, un `it` par comportement (pas par ligne de code).
- Le titre du `it` décrit un **comportement observable**, jamais l'implémentation : ✅ `"lève une exception si l'email n'existe pas"`, ❌ `"teste la ligne 12"`.

### A.3 Mocking

- Toute dépendance externe (repository TypeORM, `JwtService`, `bcrypt`, Redis) est mockée — un test unitaire ne touche jamais un vrai réseau ni une vraie base.
- Utiliser `jest.fn()` / `createMock` de manière explicite, pas de mock global implicite non documenté.
- Un mock ne doit renvoyer que ce qui est nécessaire au cas testé — éviter les objets fictifs surchargés de champs inutiles.

### A.4 Une assertion, une intention

- Préférer plusieurs `it` ciblés à un seul `it` avec 5 `expect` qui testent des choses différentes.
- Exception : plusieurs `expect` sont acceptables s'ils vérifient la **même** intention sous plusieurs angles (ex : statut ET corps de la même réponse).

### A.5 Données de test

- Utiliser des builders/factories (`buildFakeUser(overrides)`) plutôt que des objets dupliqués dans chaque test.
- Ne jamais utiliser une vraie donnée de production ou un secret réel, même factice — utiliser des constantes explicitement nommées `TEST_...` ou `FAKE_...`.

### A.6 Ce qu'on ne teste PAS en unitaire

- Le câblage des guards/pipes globaux (`configureApp`) — c'est le rôle des tests e2e/Cucumber.
- Le comportement réel d'une librairie tierce (ex : `bcrypt.compare` fonctionne — on mocke son retour, on ne teste pas bcrypt lui-même).

---

## Partie B — Tests Cucumber (BDD)

### B.1 Langue et style Gherkin

- Le `.feature` est rédigé en anglais (cohérence avec les mots-clés Gherkin `Given/When/Then`), sauf si l'équipe métier lit directement les scénarios en français — dans ce cas, choisir une langue **et s'y tenir sur tout le fichier**, jamais un mélange.
- Un scénario = une phrase métier compréhensible par une personne non technique. Éviter les détails d'implémentation (pas de nom de route, de header HTTP ou de nom de colonne DB dans le Gherkin).

```gherkin
Feature: Rate limiting on authentication endpoints

  Scenario: Blocking excessive login attempts from the same IP
    Given a client makes 10 login attempts within 1 minute
    When the client makes an 11th login attempt
    Then the response status should be 429
    And the response should contain a rate limit error message
```

### B.2 Un fichier de steps par domaine fonctionnel

```
features/
  auth/
    rate-limiting.feature
    steps/
      rate-limiting.steps.ts
  devices/
    ...
```

- Ne pas créer un fichier de steps par scénario : regrouper par domaine (ex : tous les steps `auth` ensemble), pour permettre la réutilisation des `Given`/`When` entre scénarios.

### B.3 Steps — texte vs regex

- Utiliser l'expression Cucumber (`{int}`, `{string}`) par défaut — plus lisible.
- Passer à une regex uniquement quand l'expression Cucumber ne peut pas exprimer le motif nécessaire (ex : alternance `st|nd|rd|th` — les parenthèses d'une expression Cucumber signifient "texte optionnel", pas "l'un ou l'autre").
- **Le nombre de captures dans le texte du step doit toujours correspondre exactement au nombre de paramètres de la fonction** (hors `this`). Une capture non utilisée doit être retirée du texte (rendue non capturante `(?:...)` en regex, ou supprimée du texte en expression Cucumber) plutôt que laissée en paramètre mort.

### B.4 Factoriser la logique, pas le Gherkin

- Toute action HTTP répétée (ex : tentative de login) passe par une fonction utilitaire partagée (`attemptLogin(world)`), jamais dupliquée dans chaque step.
- Le `World` (`CustomWorld`) porte l'état partagé entre steps d'un même scénario (`app`, `response`) — jamais de variable globale au niveau du module de steps.

### B.5 Typage strict — pas de `any` implicite

- `import request from 'supertest';` (avec `esModuleInterop: true`) — jamais `import * as request`.
- Toute valeur issue d'une librairie non strictement typée pour ce point d'usage (ex : `getHttpServer()`) est explicitement castée vers le type attendu (`as App` importé depuis `supertest/types`), jamais laissée en `any` implicite.
- Le corps de réponse HTTP (`response.body`) est typé localement via une interface dédiée au step (`interface LoginErrorBody { message?: string }`) plutôt que laissé en `any`.

### B.6 Configuration de l'app de test

- L'app Cucumber est construite via `Test.createTestingModule({ imports: [AppModule] }).compile()`, puis passée à la fonction partagée `configureApp(app)` (guards, pipes, filtres) — **jamais** de duplication manuelle de la config entre `main.ts` et `world.ts`.
- `Before`/`After` (dans `features/support/hooks.ts`) initialisent et ferment l'app à chaque scénario — pas de réutilisation d'instance entre scénarios, pour éviter les fuites d'état (ex : compteurs de rate limiting).

### B.7 Timeouts

- Timeout par défaut augmenté explicitement (`setDefaultTimeout(...)`) dès qu'un scénario dépend d'un vrai appel réseau externe (Redis, DB), plutôt que d'ajouter un timeout au cas par cas dans chaque step.

### B.8 Secrets et données sensibles

- Aucun mot de passe réel, même factice, écrit en clair et répété dans plusieurs fichiers — centraliser dans une constante nommée explicitement (`TEST_INVALID_PASSWORD`), idéalement surchargeable par variable d'environnement.

### B.9 Checklist avant merge d'un nouveau scénario Cucumber

- [ ] Le `.feature` se lit comme une phrase métier, sans détail technique.
- [ ] Chaque step a un nombre de captures cohérent avec sa signature de fonction.
- [ ] Aucune action HTTP n'est dupliquée entre steps — passage par une fonction partagée.
- [ ] Aucun `any` implicite (vérifié par `pnpm lint`).
- [ ] Le scénario passe de façon reproductible (pas de dépendance à un état résiduel d'un run précédent).
