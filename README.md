# Eventifyy

Eventifyy est une application de decouverte, creation et reservation d'evenements locaux a Bruxelles.

Le projet combine une application web Next.js, une application mobile Expo et des packages partages pour l'API, l'authentification, la base de donnees et l'UI. L'objectif produit est simple : permettre aux membres de trouver des sorties, publier leurs propres evenements et reserver une place dans une communaute ou chacun contribue.

## Fonctionnalites

- Catalogue d'evenements publics a venir.
- Recherche par titre, lieu ou quartier.
- Filtres par categorie : musique, food, tech, sport, art, nightlife et communaute.
- Reservation et annulation de reservation.
- Regle d'acces communautaire : un membre doit publier au moins un evenement avant de pouvoir reserver chez les autres.
- Dashboard protege pour creer un evenement et suivre ses reservations.
- Authentification avec Better Auth.
- API type-safe avec tRPC.
- Application mobile Expo connectee a la meme API.
- Demarrage local ou Docker avec PostgreSQL.

## Stack technique

- TypeScript
- Next.js 16 et React 19 pour l'application web
- Expo / React Native pour l'application mobile
- tRPC et TanStack Query pour les appels API
- Better Auth pour l'authentification
- Prisma et PostgreSQL pour la persistance
- Tailwind CSS et composants shadcn/ui partages
- Turborepo et npm workspaces pour le monorepo
- Docker Compose pour l'environnement local complet

## Structure du projet

```text
eventifyy/
|-- apps/
|   |-- web/        # Application web Next.js
|   `-- native/     # Application mobile Expo
|-- packages/
|   |-- api/        # Routeur tRPC et logique metier
|   |-- auth/       # Configuration Better Auth
|   |-- db/         # Prisma, schema et scripts base de donnees
|   |-- env/        # Validation des variables d'environnement
|   |-- ui/         # Composants UI partages
|   `-- config/     # Configuration TypeScript partagee
|-- docker-compose.yml
|-- docker-compose.prod.yml
|-- Dockerfile
`-- LANCEMENT.md
```

## Prerequis

- Node.js et npm
- Docker, si vous utilisez la base PostgreSQL locale ou le lancement Docker
- Un fichier `apps/web/.env` configure avec les variables serveur

Variables serveur principales :

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/eventifyy
BETTER_AUTH_SECRET=une-cle-secrete-de-32-caracteres-minimum
BETTER_AUTH_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001,http://localhost:8081,http://127.0.0.1:3001,http://127.0.0.1:8081
```

Pour l'app mobile, configurez `apps/native/.env` a partir de `apps/native/.env.example`.

## Installation locale

Installer les dependances :

```bash
npm install
```

Demarrer PostgreSQL avec le service fourni par le package base de donnees :

```bash
npm run db:start
```

Appliquer le schema Prisma :

```bash
npm run db:push
```

Lancer les applications en mode developpement :

```bash
npm run dev
```

L'application web est disponible sur :

```text
http://localhost:3001
```

## Commandes utiles

```bash
npm run dev          # Lance les workspaces en developpement
npm run dev:web      # Lance uniquement l'application web
npm run dev:native   # Lance Expo pour l'application mobile
npm run dev:native:web
npm run build        # Build tous les workspaces
npm run check-types  # Verification TypeScript
npm run db:push      # Applique le schema Prisma
npm run db:migrate   # Lance les migrations Prisma
npm run db:studio    # Ouvre Prisma Studio
npm run db:stop      # Arrete la base locale
```

## Lancement avec Docker

Demarrer l'environnement complet :

```bash
npm run docker:dev
```

Ce mode lance :

- PostgreSQL sur le port `5432`
- l'application web sur `http://localhost:3001`
- Expo sur `http://localhost:8081`

Arreter les services :

```bash
npm run docker:down
```

## Documentation complementaire

- [LANCEMENT.md](./LANCEMENT.md) : notes de lancement local, mobile et Docker.
- [RAPPORT_DEVELOPPEMENT.md](./RAPPORT_DEVELOPPEMENT.md) : rapport de developpement du projet.
