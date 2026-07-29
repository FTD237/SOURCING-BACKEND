# Convention de sécurité — Sourcing Backend

## 1. Principes généraux

- **Défense en profondeur** : aucune protection unique n'est suffisante (validation + guard + DB constraint), on superpose les couches.
- **Moindre privilège** : un composant n'a accès qu'à ce qui lui est strictement nécessaire (rôle DB, scope JWT, permissions).
- **Fail secure** : en cas d'erreur ou de doute, le système refuse par défaut plutôt que d'autoriser par défaut.
- **Aucun détail interne exposé au client** : messages d'erreur génériques côté utilisateur, détails techniques uniquement dans les logs serveur.
- Toute PR touchant à l'authentification, aux permissions, aux secrets ou aux headers HTTP **requiert une review dédiée** (cf. `CONTRIBUTING.md`).

---

## 2. Écrire du code sécurisé

### 2.1 Validation des entrées

- Toute route reçoit ses données via un DTO avec `class-validator` — jamais de `req.body` non typé/non validé.
- Le `ValidationPipe` global reste configuré avec `whitelist: true` (retire les champs non déclarés) et `transform: true`.
- Ajouter `forbidNonWhitelisted: true` pour les routes sensibles (auth, admin) : rejette explicitement une requête contenant des champs inconnus, plutôt que de les ignorer silencieusement.
- Valider les types précisément : `@IsEmail()`, `@IsUUID()`, `@MinLength()`/`@MaxLength()` — ne jamais se contenter de `@IsString()` seul sur un champ métier sensible (mot de passe, email).

### 2.2 Accès base de données

- TypeORM uniquement — **aucune requête SQL brute** sauf cas documenté et justifié en review.
- Toujours utiliser les paramètres liés du query builder (`.where('email = :email', { email })`), jamais de concaténation de chaînes dans une requête.
- `synchronize: true` interdit en production (déjà correctement conditionné à `NODE_ENV !== 'production'` dans `app.module.ts`) — les migrations passent par TypeORM migrations en prod.

### 2.3 Authentification et mots de passe

- Mots de passe hashés avec `bcrypt`, jamais stockés ni loggés en clair.
- Le message d'erreur de login reste générique : `"Email ou mot de passe incorrect"` — ne jamais indiquer si c'est l'email qui n'existe pas ou le mot de passe qui est faux (évite l'énumération de comptes).
- JWT : secret fort (≥ 32 caractères aléatoires), jamais commité, expiration systématique (`JWT_EXPIRE_IN`), aucune donnée sensible dans le payload (jamais de mot de passe, jamais de token d'un autre service).
- Prévoir une stratégie de révocation si un token est compromis (liste noire, ou passage à des tokens courts + refresh token).

### 2.4 Autorisation

- Un guard dédié par niveau de permission (rôle, propriétaire de la ressource) — ne jamais vérifier une permission uniquement côté frontend.
- Principe du moindre privilège pour les rôles métier (`role.entity.ts`) : un rôle n'a que les permissions strictement nécessaires à son usage.
- Vérifier l'appartenance de la ressource (ex : un utilisateur ne peut modifier que ses propres données) en plus du rôle global.

### 2.5 Gestion des erreurs

- Toute exception métier passe par `ExceptionFactory` / `GlobalExceptionFilter` — jamais de `try/catch` qui renvoie directement `error.message` ou `error.stack` au client.
- En production, aucune stack trace, requête SQL ou chemin de fichier ne doit apparaître dans une réponse HTTP.
- Logger le détail technique complet côté serveur, renvoyer un message générique + un identifiant de corrélation côté client si besoin de support.

### 2.6 Secrets et configuration

- Aucun secret (mot de passe, clé API, token) n'est commité, même dans un fichier `.env.example` (utiliser des placeholders explicites du type `CHANGE_ME`).
- `.env*` réels sont dans `.gitignore` (déjà en place).
- Chaque environnement (dev/staging/prod) a ses propres secrets, jamais partagés.
- Un secret compromis (même accidentellement commité puis supprimé) est considéré compromis définitivement — il doit être **révoqué et régénéré**, pas seulement retiré de l'historique Git.

### 2.7 Logs

- Ne jamais logger : mots de passe, tokens JWT, headers d'autorisation, numéros de carte, données personnelles sensibles.
- Les logs d'erreur restent utiles au diagnostic (stack trace, requête) mais **côté serveur uniquement**, jamais renvoyés au client.

### 2.8 Dépendances

- `pnpm audit` exécuté avant merge de toute nouvelle dépendance ou mise à jour majeure.
- Le lockfile (`pnpm-lock.yaml`) est toujours commité et à jour.
- Toute dépendance ajoutée est justifiée dans la description de la PR (`chore(deps): ...`).

### 2.9 Anti-brute-force / rate limiting

- Toute route d'authentification ou d'action sensible (login, reset de mot de passe, création de compte) est protégée par un guard de rate limiting dédié, en plus du rate limiting global.
- L'IP cliente utilisée pour le rate limiting (`x-forwarded-for`) n'est fiable que si l'application est bien derrière un reverse proxy de confiance qui fixe ce header — sinon il est falsifiable par le client (voir section 3.6).

---

## 3. Sécuriser l'application

### 3.1 Headers HTTP de sécurité

- Utiliser `helmet` pour les headers standards (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc.) — **actuellement absent du projet**, à ajouter (voir section 5).

### 3.2 CORS

- `app.enableCors()` sans configuration autorise **toutes les origines** — à restreindre explicitement à la liste des domaines front autorisés en production (voir section 5).

### 3.3 HTTPS / TLS

- Le trafic public passe systématiquement par HTTPS (géré au niveau du reverse proxy/plateforme d'hébergement si l'app Node n'écoute pas directement en TLS).
- `Strict-Transport-Security` activé en production (via helmet) pour forcer HTTPS côté client une fois la première connexion établie.

### 3.4 Base de données

- Connexion SSL forcée en production (déjà en place : `ssl: isProduction`).
- Le rôle DB utilisé par l'application a le minimum de droits nécessaires (pas de superuser Postgres en prod).
- Les credentials DB ne transitent jamais en clair dans les logs applicatifs (attention aux erreurs TypeORM qui peuvent inclure la chaîne de connexion).

### 3.5 Rate limiting global

- Toute configuration de rate limiting déclarée dans le code (`ThrottlerModule`, guard custom) doit être effectivement branchée et active — une configuration déclarée mais non appliquée ne protège rien et induit en erreur à la lecture du code.
- Le guard de rate limiting global est appliqué via `app.useGlobalGuards(...)` dans `configureApp`, de sorte que l'app réelle et l'app de test partagent toujours la même protection.

### 3.6 Confiance dans les proxys / headers

- Toute app déployée derrière un reverse proxy (nginx, load balancer cloud) configure `app.set('trust proxy', ...)` (Express) pour que `req.ip` et `x-forwarded-for` soient fiables uniquement depuis ce proxy, jamais falsifiables directement par un client externe.

### 3.7 Surface d'attaque exposée

- Swagger (`api/docs`) : décider explicitement s'il reste accessible en production ou s'il est désactivé/protégé par authentification en dehors de l'environnement de développement.
- Toute route de debug ou d'administration non destinée au public est protégée par un guard d'authentification, jamais accessible par obscurité seule.

### 3.8 CI/CD et scan de vulnérabilités

- Secrets CI (`JWT_SECRET_TEST`, credentials Upstash/DB de test) stockés uniquement dans `Settings → Secrets and variables → Actions`, jamais en clair dans les workflows.
- Une étape d'analyse statique de sécurité (SAST) fait partie du pipeline CI, exécutée sur chaque PR.
- Dependabot ou équivalent est activé pour être notifié des vulnérabilités connues dans les dépendances.

---

## 4. Checklist de revue sécurité (PR)

- [ ] Aucune donnée sensible (secret, token, mot de passe) en clair dans le code ou les logs.
- [ ] Toute nouvelle route sensible est protégée par le(s) guard(s) approprié(s) (auth + rate limiting si pertinent).
- [ ] Les messages d'erreur renvoyés au client ne révèlent aucun détail interne (stack, requête SQL, existence d'un compte).
- [ ] Toute nouvelle dépendance est justifiée et auditée (`pnpm audit`).
- [ ] Les DTOs valident strictement les champs attendus (types, formats, longueurs).
- [ ] Les headers de sécurité (CORS, helmet) restent cohérents avec la nouvelle route ajoutée.

