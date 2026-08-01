# Lancer le projet

Notes simples pour relancer le projet. A adapter au fur et a mesure.

## Prerequis

- Node.js / npm installes
- Docker lance si la base PostgreSQL locale est utilisee
- Fichier `apps/web/.env` configure

## Premiere installation

```bash
npm install
```

Demarrer la base de donnees locale :

```bash
npm run db:start
```

Appliquer le schema Prisma :

```bash
npm run db:push
```

## Lancer le projet

```bash
npm run dev
```

Puis ouvrir :

```text
http://localhost:3001
```

Cette commande lance tous les workspaces en mode dev, dont `web` et `native`.

## Lancer seulement l'app web

```bash
npm run dev:web
```

## Lancer l'app mobile

Installer les nouvelles dependances si besoin :

```bash
npm install
```

Creer `apps/native/.env` a partir de `apps/native/.env.example`, puis lancer Expo :

```bash
npm run dev:native
```

Pour tester sur Android Studio :

1. Lancer un emulateur depuis Android Studio.
2. Lancer le web :

```bash
npm run dev:web
```

3. Dans `apps/native/.env`, utiliser :

```env
EXPO_PUBLIC_SERVER_URL=http://10.0.2.2:3001
```

4. Relancer le mobile :

```bash
npm run dev:native
```

5. Dans le terminal Expo, appuyer sur `a`.

Pour que le mobile parle au web depuis un telephone, remplacer `localhost` dans `EXPO_PUBLIC_SERVER_URL` par l'adresse IP locale de la machine.

Le mobile contient maintenant :

- accueil avec status API
- login / sign up
- dashboard protege
- client tRPC
- client auth Better Auth

Pour verifier sans telephone, lancer la version web Expo :

```bash
npm run dev:native:web
```

Option tunnel Expo, a ajouter plus tard si necessaire :

```bash
npx expo start --tunnel
```

## Lancer avec Docker

Depuis la racine :

```bash
npm run docker:dev
```

Cela lance :

- PostgreSQL
- l'app web sur `http://localhost:3001`
- Expo mobile sur `http://localhost:8081`

Pour arreter :

```bash
npm run docker:down
```

## Commandes utiles

```bash
npm run check-types
npm run build
npm run db:studio
npm run db:stop
```
