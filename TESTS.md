# Protocole de test — Sourcing Backend

## 1. Pourquoi deux niveaux de test

Le projet combine deux familles de tests qui ne se substituent pas l'une à l'autre :

| | Tests unitaires (Jest) | Tests Cucumber (BDD/fonctionnels) |
|---|---|---|
| Cible | Une fonction / classe isolée | Un scénario utilisateur complet |
| Dépendances | Toutes mockées (repository, JWT, bcrypt, Redis...) | App Nest réelle (guards, pipes, filtres, DB de test) |
| Vitesse | Millisecondes | Secondes (I/O réel) |
| Ce qu'ils prouvent | La logique métier est correcte | Le comportement bout-en-bout attendu par le métier fonctionne |
| Ce qu'ils ne détectent pas | Un guard/pipe non branché, un mauvais ordre de middlewares | Une régression fine dans un calcul interne |

**Règle** : toute nouvelle règle métier a un test unitaire. Tout comportement observable côté client (route, code HTTP, message d'erreur) a un scénario Cucumber. Les deux se recoupent rarement en pratique — un manque dans l'un ne remplace jamais un manque dans l'autre.

## 2. Structure des dossiers

```
src/
  <module>/
    <module>.service.ts
    <module>.service.spec.ts     # test unitaire, colocalisé
    <module>.controller.ts
    <module>.controller.spec.ts

features/
  <domaine>/
    <scenario>.feature           # Gherkin
    steps/
      <scenario>.steps.ts
  support/
    world.ts                     # CustomWorld + configureApp
    hooks.ts                     # Before/After, setDefaultTimeout
```

## 3. Pyramide de test et couverture attendue

```
        ▲
       /  \        Cucumber (BDD)
      / few \       — parcours critiques uniquement
     /--------\
    / more     \    Tests e2e Jest (test:e2e)
   /------------\    — un contrôleur = un fichier
  /   many       \  Tests unitaires (Jest)
 /----------------\  — chaque service, guard, pipe, helper
```

- **Unitaires** : couverture visée ≥ 80% sur `src/**/*.service.ts`, `src/**/*.guard.ts`, `src/common/**`.
- **e2e Jest** : un test par contrôleur pour les cas nominaux + erreurs de validation.
- **Cucumber** : réservé aux parcours métier à forte valeur (authentification, rate limiting, workflows multi-étapes). Ne pas dupliquer un test unitaire existant en Gherkin.

## 4. Quand écrire quoi — arbre de décision

1. **Je teste un calcul, une transformation, une règle métier isolée** → test unitaire Jest.
2. **Je teste qu'une route retourne le bon statut/payload pour un cas donné, sans scénario métier narratif** → test e2e Jest (`test/*.e2e-spec.ts`).
3. **Je teste un parcours qui a du sens pour un non-développeur ("en tant que client, si je fais X répété, alors Y")** → scénario Cucumber.
4. **Je corrige un bug** → ajouter d'abord le test (unitaire si logique interne, Cucumber si comportement observable) qui aurait dû le détecter, puis corriger.

## 5. Environnement de test

- Les tests Cucumber utilisent `Test.createTestingModule({ imports: [AppModule] }).compile()` — **jamais** `bootstrap()` de `main.ts`. Toute config partagée (pipes, filtres, guards) doit passer par une fonction `configureApp(app)` unique, appelée à la fois par `main.ts` et par `world.ts`, pour éviter toute divergence entre l'app réelle et l'app de test.
- Les dépendances externes réelles (Upstash Redis, base de données) doivent être :
  - soit une instance de test dédiée, isolée de la production,
  - soit mockées si le scénario ne teste pas explicitement l'intégration avec ce service.
- Le timeout par défaut de Cucumber est augmenté via `setDefaultTimeout(...)` dans `features/support/hooks.ts` dès qu'un scénario dépend d'un vrai appel réseau externe.

## 6. Exécution

```bash
pnpm test              # unitaires
pnpm test:e2e           # e2e Jest
pnpm test:cucumber      # scénarios BDD
pnpm test:cov           # couverture unitaire
```

Les trois commandes doivent passer en CI avant tout merge sur la branche principale.

## 7. Revue de code — checklist test

- [ ] Toute nouvelle règle métier a un test unitaire correspondant.
- [ ] Tout nouveau endpoint public a au moins un cas nominal + un cas d'erreur en e2e.
- [ ] Tout comportement transverse (auth, rate limiting, permissions) modifié a son scénario Cucumber mis à jour.
- [ ] Aucun test ne dépend d'un ordre d'exécution ou d'un état laissé par un test précédent.
- [ ] Aucun secret réel (token, mot de passe) n'apparaît en clair dans le code de test.
