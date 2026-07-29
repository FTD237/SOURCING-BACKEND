## Description
<!-- Résumé des changements et contexte -->

## Type de changement
- [ ] feat — nouvelle fonctionnalité
- [ ] fix — correction de bug
- [ ] refactor — refactoring
- [ ] test — ajout de tests
- [ ] docs — documentation
- [ ] chore — maintenance

## Checklist
- [ ] Le code respecte les conventions du projet
- [ ] Les tests ont été ajoutés ou mis à jour
- [ ] `pnpm lint` passe sans erreur
- [ ] `pnpm test` passe sans erreur
- [ ] Aucune donnée sensible dans le code
- [ ] La documentation a été mise à jour si nécessaire

## Checklist de revue sécurité (PR)

- [ ] Aucune donnée sensible (secret, token, mot de passe) en clair dans le code ou les logs.
- [ ] Toute nouvelle route sensible est protégée par le(s) guard(s) approprié(s) (auth + rate limiting si pertinent).
- [ ] Les messages d'erreur renvoyés au client ne révèlent aucun détail interne (stack, requête SQL, existence d'un compte).
- [ ] Toute nouvelle dépendance est justifiée et auditée (`pnpm audit`).
- [ ] Les DTOs valident strictement les champs attendus (types, formats, longueurs).
- [ ] Les headers de sécurité (CORS, helmet) restent cohérents avec la nouvelle route ajoutée.

### Checklist avant merge d'un nouveau scénario Cucumber

- [ ] Le `.feature` se lit comme une phrase métier, sans détail technique.
- [ ] Chaque step a un nombre de captures cohérent avec sa signature de fonction.
- [ ] Aucune action HTTP n'est dupliquée entre steps — passage par une fonction partagée.
- [ ] Aucun `any` implicite (vérifié par `pnpm lint`).
- [ ] Le scénario passe de façon reproductible (pas de dépendance à un état résiduel d'un run précédent).
- 
## Revue de code — checklist test

- [ ] Toute nouvelle règle métier a un test unitaire correspondant.
- [ ] Tout nouveau endpoint public a au moins un cas nominal + un cas d'erreur en e2e.
- [ ] Tout comportement transverse (auth, rate limiting, permissions) modifié a son scénario Cucumber mis à jour.
- [ ] Aucun test ne dépend d'un ordre d'exécution ou d'un état laissé par un test précédent.
- [ ] Aucun secret réel (token, mot de passe) n'apparaît en clair dans le code de test.

## Captures / logs (si pertinent)

