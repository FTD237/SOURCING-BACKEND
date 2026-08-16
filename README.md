# Sourcing Backend

Backend API du projet **sourcing-backend**, construit avec [NestJS](https://nestjs.com/).

##  Stack technique

- **Framework** : NestJS 11
- **Langage** : TypeScript
- **Base de données** : PostgreSQL via TypeORM
- **Authentification** : JWT (Passport) + bcrypt
- **Stockage fichiers** : AWS S3 (upload/download via presigned URLs)
- **Emails** : Nodemailer + Handlebars (templates)
- **Rate limiting** : Upstash Redis + Upstash Ratelimit
- **Documentation API** : Swagger (`@nestjs/swagger`)
- **Sécurité HTTP** : Helmet
- **Validation** : class-validator / class-transformer
- **Tests** : Jest (unitaires) et Cucumber (BDD/e2e)

##  Prérequis

- Node.js (version compatible avec les dépendances `@types/node ^22`)
- pnpm `11.7.0` (gestionnaire de paquets du projet)
- Une instance PostgreSQL
- Un bucket AWS S3 (si la fonctionnalité d'upload est utilisée)
- Une instance Upstash Redis (pour le rate limiting)

##  Installation

```bash
pnpm install
```

## ⚙️ Configuration

Créer un fichier `.env` à la racine du projet avec les variables nécessaires, par exemple :

```env
NODE_ENV=development

# Base de données
DATABASE_HOST=
DATABASE_PORT=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# Email
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

> Adapter les noms de variables à ceux réellement utilisés dans le code source (`ConfigModule`).

## ▶️ Lancer le projet

```bash
# Développement (avec watch)
pnpm start:dev

# Développement (sans watch)
pnpm start

# Debug
pnpm start:debug

# Production
pnpm build
pnpm start:prod
```

##  Tests

```bash
# Tests unitaires
pnpm test

# Tests unitaires en mode watch
pnpm test:watch

# Couverture de code
pnpm test:cov

# Tests e2e
pnpm test:e2e

# Tests BDD (Cucumber)
pnpm test:cucumber
```

##  Qualité de code

```bash
# Linter (avec correction automatique)
pnpm lint

# Formatage (Prettier)
pnpm format
```

##  Structure du projet (NestJS standard)

```
src/
├── modules/        # Modules métier (auth, users, etc.)
├── common/         # Filtres, guards, interceptors, decorators partagés
├── config/         # Configuration de l'application
└── main.ts         # Point d'entrée de l'application
```

##  Documentation API

Une fois l'application lancée, la documentation Swagger est généralement disponible sur :

```
http://localhost:<PORT>/api
```

(adapter le chemin selon la configuration réelle de Swagger dans `main.ts`)

##  Licence

opyright (c) 2026 FTD — usage privé/interne uniquement.
