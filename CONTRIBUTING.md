# Contributing

Merci de contribuer à ce projet ! Ce document définit les conventions à respecter pour garder une base de code cohérente et maintenable.

---

## Table des matières

- [Prérequis](#prérequis)
- [Branches](#branches)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Environnements cibles](#environnements-cibles)
- [Style de code](#style-de-code)
- [Tests](#tests)

---

## Prérequis

- Node.js ≥ 20
- pnpm ≥ 9
- PostgreSQL 15
- Accès en écriture au dépôt ou fork valide

```bash
pnpm install
cp .env.example .env  # configurer les variables d'environnement
```

---

## Branches

Toute modification passe par une branche dédiée créée depuis `develop`.  
**Ne jamais pousser directement sur `develop` ou `staging`.**

### Nomenclature

```
<type>/<description-courte>
```

| Type | Usage |
|---|---|
| `feat/` | Nouvelle fonctionnalité |
| `fix/` | Correction de bug |
| `refactor/` | Refactoring sans changement de comportement |
| `test/` | Ajout ou amélioration de tests |
| `docs/` | Mise à jour de la documentation |
| `chore/` | Tâches de maintenance, mise à jour des dépendances |
| `security/` | Correction de faille de sécurité |
| `perf/` | Amélioration des performances |

### Exemples

```
feat/rate-limiter
fix/auth-token-expiry
refactor/device-repository
test/user-service-unit
docs/api-endpoints
chore/update-dependencies
security/sanitize-inputs
```

> La description est en kebab-case, courte (3–5 mots max), en français ou en anglais selon la langue du projet.

---

## Commits

Ce projet suit la convention [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[corps optionnel]

[footer(s) optionnel(s)]
```

### Types

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring |
| `test` | Ajout ou modification de tests |
| `docs` | Documentation |
| `chore` | Maintenance, dépendances |
| `style` | Formatage, lint (pas de logique) |
| `perf` | Performance |
| `security` | Sécurité |

### Scopes suggérés

`auth` · `users` · `devices` · `admin` · `core` · `database` · `guards` · `dto` · `config` · `deps`

### Exemples

```
feat(auth): ajouter le guard de rate limiting par IP
fix(users): corriger la pagination sur la liste des utilisateurs
refactor(database): extraire la logique de connexion dans un service dédié
test(auth): ajouter les tests unitaires du RateLimitGuard
docs(api): documenter les endpoints d'authentification
chore(deps): mettre à jour @nestjs/core vers 10.4
security(guards): valider les headers x-forwarded-for
```

> **Un commit = une intention.** Éviter les commits fourre-tout (`fix stuff`, `wip`, `misc`).

---

## Pull Requests

### Processus

1. S'assurer que la branche est à jour avec `develop`
2. Ouvrir une PR avec un titre clair (même convention que les commits)
3. Remplir le template de PR complètement
4. Demander la review d'**au moins un membre** de l'équipe
5. Adresser tous les commentaires avant le merge
6. S'assurer que la CI passe (lint + tests)
7. Le merge est effectué par le reviewer après approbation

### Titre de PR

Même format que les commits :

```
feat(auth): ajouter le guard de rate limiting par IP
```

### Template de PR

```markdown
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
- [ ] Aucune donnée sensible dans le code (secrets, credentials)
- [ ] La documentation a été mise à jour si nécessaire

## Captures / logs (si pertinent)
```

### Règles de review

- Toute PR doit recevoir **au moins une approbation** avant le merge
- Les changements liés à la sécurité requièrent une review dédiée
- Les warnings de lint doivent être résolus (pas de `// eslint-disable` sans justification)
- Tout nouveau code métier doit être couvert par des tests

---

## Environnements cibles

Le projet suit un flux de branches structuré en deux niveaux :

```
feat/* ──┐
fix/*  ──┤──► develop ──► staging ──► main
test/* ──┘
```

### `develop` — Développement actif

- Reçoit les PRs des branches de travail (`feat/`, `fix/`, `test/`, etc.)
- État potentiellement instable, fonctionnalités en cours de développement ou de test
- **Merge autorisé après 1 approbation**

### `staging` — Pré-production

- Reçoit les merges depuis `develop` une fois les fonctionnalités stabilisées et testées
- Reflète l'état le plus fonctionnel du projet hors production
- Utilisé pour les validations finales et les démonstrations
- **Merge depuis `develop` uniquement, après validation de l'équipe**

### `main` — Production

- Branche protégée, ne reçoit que des merges depuis `staging`
- Chaque merge sur `main` correspond à une release taguée

> **Règle générale :** on merge vers `develop` pour intégrer, vers `staging` pour stabiliser, vers `main` pour livrer.

---

## Style de code

- **Langage** : TypeScript strict, pas de `any` non justifié
- **Framework** : NestJS avec modules, guards, interceptors et pipes idiomatiques
- **ORM** : TypeORM — pas de requêtes SQL brutes sauf cas justifié
- **Nommage** :
  - Fichiers : `kebab-case.ts`
  - Classes : `PascalCase`
  - Variables / méthodes : `camelCase`
  - Constantes : `SCREAMING_SNAKE_CASE`
- **Imports** : groupés dans l'ordre — librairies tierces → modules NestJS → imports relatifs
- **Lint** : `pnpm lint` doit passer sans erreur avant chaque PR

---

## Tests

- **Tests unitaires** : obligatoires pour les services, guards et use-cases
- **Tests d'intégration** : recommandés pour les controllers et les modules
- **Framework** : Jest + `@nestjs/testing`
- **Lancer les tests** :

```bash
pnpm test           # tous les tests
pnpm test:watch     # mode watch
pnpm test:cov       # avec couverture de code
```

Les tests doivent être ajoutés dans la même PR que la fonctionnalité ou le correctif qu'ils valident.
