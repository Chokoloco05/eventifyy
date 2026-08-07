# Rapport de développement - Eventifyy

Ce document explique l'évolution du projet Eventifyy à partir de la stack de base, les choix techniques réalisés, les problèmes rencontrés, les solutions appliquées, et le rôle des fichiers importants.

## 1. Point de départ

Le projet est parti d'une stack Better-T-Stack organisée en monorepo Turborepo.

La base initiale contenait surtout :

- une application web Next.js dans `apps/web`;
- une architecture TypeScript partagée;
- une API tRPC dans `packages/api`;
- une base PostgreSQL pilotée par Prisma dans `packages/db`;
- une authentification Better Auth dans `packages/auth`;
- un package UI partagé dans `packages/ui`;
- une configuration Docker minimale pour lancer la base et le serveur web.

À ce stade, l'application était encore très générique. Elle permettait surtout de valider que les briques techniques communiquaient entre elles : web, API, auth, database et Docker.

## 2. Objectif produit

Eventifyy est devenu une plateforme d'événements à Bruxelles avec une règle communautaire forte :

> Pour participer aux événements des autres, un utilisateur doit d'abord créer au moins un événement.

Cette nuance transforme l'application en communauté participative plutôt qu'en simple catalogue de sorties. L'idée est de créer un cercle plus restreint, où chaque membre doit contribuer avant de consommer les événements proposés par les autres.

Les objectifs fonctionnels principaux sont donc :

- explorer des événements à Bruxelles;
- créer un compte et se connecter;
- créer un événement depuis un dashboard;
- réserver ou annuler une participation;
- empêcher la réservation si l'utilisateur n'a pas encore créé d'événement;
- expliquer clairement la philosophie de la communauté;
- proposer une version web et une version mobile Expo;
- lancer l'ensemble avec Docker, y compris une configuration production.

## 3. Architecture actuelle

Le projet reste un monorepo.

```text
eventifyy/
  apps/
    web/             Application Next.js
    native/          Application mobile Expo / React Native
  packages/
    api/             API tRPC et logique métier
    auth/            Configuration Better Auth
    db/              Prisma, client DB et scripts
    env/             Validation des variables d'environnement
    ui/              Composants UI partagés
  Dockerfile
  docker-compose.yml
  docker-compose.prod.yml
  package.json
```

La séparation importante est la suivante :

- `apps/web` gère l'expérience web et les routes Next.js.
- `apps/native` gère l'expérience mobile.
- `packages/api` contient la logique métier réellement partagée.
- `packages/db` décrit les modèles de données.
- `packages/auth` configure les sessions et l'authentification.

Cette structure évite de dupliquer la logique métier entre web et mobile. Les deux clients consomment la même API tRPC.

## 4. Modèle de données

Les modèles principaux sont définis dans :

- `packages/db/prisma/schema/schema.prisma`
- `packages/db/prisma/schema/auth.prisma`

### Utilisateurs et authentification

`auth.prisma` contient les modèles générés autour de Better Auth :

- `User` : utilisateur de l'application;
- `Session` : session active;
- `Account` : compte d'authentification;
- `Verification` : mécanisme de vérification.

Un utilisateur peut organiser des événements et s'inscrire à des événements.

### Événements

`schema.prisma` contient :

- `Event`;
- `Registration`;
- les enums `EventCategory` et `EventStatus`.

Un événement possède :

- un titre;
- une description;
- une catégorie;
- un statut;
- une date;
- un lieu;
- un quartier;
- une latitude et longitude;
- une capacité;
- un prix;
- un organisateur;
- une liste d'inscriptions.

`Registration` relie un utilisateur à un événement. La contrainte :

```prisma
@@unique([eventId, userId])
```

empêche un même utilisateur de s'inscrire deux fois au même événement.

## 5. Logique métier

La logique métier principale est dans :

- `packages/api/src/routers/index.ts`
- `packages/api/src/events.ts`

### `packages/api/src/events.ts`

Ce fichier centralise les helpers liés aux événements.

Il contient notamment :

- `EVENT_CATEGORIES` : liste structurée des catégories affichées côté web/mobile;
- `eventSelect` : sélection Prisma commune pour éviter de répéter les champs;
- `getCommunityAccess(userId)` : vérifie si l'utilisateur a publié au moins un événement;
- `withEventMeta(...)` : enrichit un événement avec des informations calculées;
- `listPublicEvents(...)` : liste les événements publics avec filtres.

Les métadonnées ajoutées aux événements sont importantes :

- `attendeeCount`;
- `isFull`;
- `isPast`;
- `isOwnEvent`;
- `isRegistered`;
- `hasCommunityAccess`;
- `lockedReason`;
- `canRegister`.

Ces champs permettent aux interfaces web et mobile d'afficher le bon état sans recoder toute la logique côté client.

### `packages/api/src/routers/index.ts`

Ce fichier expose les routes tRPC.

Les routes importantes sont :

- `healthCheck` : vérifie que l'API répond;
- `eventCategories` : fournit les catégories;
- `events` : liste les événements avec filtres;
- `eventById` : récupère un événement;
- `createEvent` : crée un événement;
- `registerForEvent` : inscrit un utilisateur à un événement;
- `unregisterFromEvent` : annule une réservation;
- `myEvents` : récupère les événements organisés et les réservations de l'utilisateur;
- `communityAccess` : indique si l'utilisateur peut participer.

La route `registerForEvent` est la plus critique. Elle vérifie :

- que l'événement existe;
- que l'événement n'est pas passé;
- que l'utilisateur ne réserve pas son propre événement;
- que l'utilisateur a déjà créé au moins un événement publié;
- que l'événement n'est pas complet;
- que l'inscription ne crée pas de doublon.

La réservation est faite dans une transaction Prisma pour limiter les incohérences.

## 6. Application web

Les fichiers web importants sont :

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/home-client.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/dashboard/dashboard.tsx`
- `apps/web/src/app/community/page.tsx`
- `apps/web/src/components/header.tsx`
- `apps/web/src/app/loading.tsx`
- `apps/web/src/app/error.tsx`

### Page d'accueil

`page.tsx` est devenu un Server Component. Il récupère une première liste d'événements côté serveur pour améliorer le rendu initial.

`home-client.tsx` gère l'interactivité :

- recherche;
- filtres par catégorie;
- affichage des événements;
- participation;
- annulation;
- états de chargement;
- erreurs;
- mises à jour optimistes.

La map a été retirée temporairement, car elle ajoutait de la complexité sans être encore stable. L'interface est maintenant centrée sur le produit Eventifyy : découvrir, filtrer, réserver, créer.

### Dashboard

`dashboard/page.tsx` protège la page côté serveur avec Better Auth.

`dashboard/dashboard.tsx` contient :

- le formulaire de création d'événement;
- la liste des événements organisés;
- la liste des réservations;
- l'état d'accès à la communauté.

La carte "Accès communauté" indique si l'utilisateur a déjà contribué en créant un événement.

### Page communauté

`apps/web/src/app/community/page.tsx` explique la logique sociale du produit :

- contribuer avant de participer;
- éviter les utilisateurs passifs;
- construire une communauté plus sélective;
- donner du sens à la contrainte métier.

Cette page est importante pour justifier le positionnement du produit et pas seulement la règle technique.

## 7. Application mobile

Les fichiers mobiles importants sont :

- `apps/native/app/index.tsx`
- `apps/native/app/dashboard.tsx`
- `apps/native/app/login.tsx`
- `apps/native/app/community.tsx`
- `apps/native/app/_layout.tsx`
- `apps/native/utils/trpc.ts`
- `apps/native/utils/server-url.ts`
- `apps/native/lib/auth-client.ts`
- `apps/native/components/screen.tsx`

### Accueil mobile

`apps/native/app/index.tsx` reprend la logique principale de l'accueil web :

- statut API;
- liste des événements;
- recherche;
- filtres;
- partage natif via `Share`;
- participation;
- annulation;
- blocage si l'utilisateur n'a pas créé d'événement.

Le mobile utilise aussi des mises à jour optimistes avec TanStack Query.

### Dashboard mobile

`apps/native/app/dashboard.tsx` permet de :

- créer un événement;
- choisir une catégorie;
- choisir un quartier bruxellois prédéfini;
- consulter ses réservations;
- consulter ses événements organisés;
- se déconnecter.

### Pull-to-refresh

Le composant `apps/native/components/screen.tsx` supporte le pull-to-refresh. Cela répond au problème rencontré où l'application mobile ne pouvait pas être actualisée simplement.

### Connexion API depuis Android emulator

`apps/native/utils/server-url.ts` et les variables Docker utilisent :

```text
http://10.0.2.2:3001
```

Sur Android emulator, `localhost` ne désigne pas la machine hôte. `10.0.2.2` est l'adresse spéciale qui permet à l'émulateur de joindre le serveur lancé sur le PC.

## 8. Authentification et sécurité

L'authentification est configurée dans :

- `packages/auth/src/index.ts`

Better Auth utilise Prisma et PostgreSQL pour stocker les utilisateurs, comptes et sessions.

Les routes protégées passent par :

- `protectedProcedure` côté tRPC;
- `auth.api.getSession(...)` côté Next.js.

### Invalidation des sessions au redémarrage

Une contrainte de sécurité a été ajoutée :

> Quand l'application est désactivée puis relancée, l'utilisateur doit se reconnecter.

Pour cela, un script a été ajouté :

- `packages/db/scripts/clear-sessions.mjs`

Ce script supprime uniquement les sessions :

```sql
DELETE FROM "session";
```

Il ne supprime pas :

- les utilisateurs;
- les événements;
- les réservations;
- les comptes.

Le script est exécuté automatiquement au démarrage Docker du web, en dev et en prod.

Le script est aussi tolérant si la table `session` n'existe pas encore, ce qui évite un crash sur une base fraîche.

## 9. Docker et environnements

Deux modes Docker existent maintenant.

### Développement

`docker-compose.yml`

Services :

- `web` sur `http://localhost:3001`;
- `mobile` sur `http://localhost:8081`;
- `postgres` sur `localhost:5432`.

Commande :

```bash
npm run docker:dev
```

Ce mode utilise le volume :

```text
eventifyy_eventifyy_postgres_data
```

C'est la base pratique pour développer et garder les données de test.

### Production locale

`docker-compose.prod.yml`

Services :

- `web` en bundle production sur `http://localhost:3001`;
- `mobile` Expo sur `http://localhost:8081`;
- `postgres-prod` sur `localhost:5433`.

Commande :

```bash
npm run docker:prod
```

Ce mode utilise le volume :

```text
eventifyy_eventifyy_postgres_prod_data
```

La DB prod locale est séparée de la DB dev. C'est volontaire : cela permet de tester un environnement propre sans risquer les données de développement.

## 10. Problèmes rencontrés et solutions

### 1. Confusion entre DB dev et DB prod

Problème :

Après le lancement du mode prod, le compte utilisateur semblait avoir disparu.

Cause :

Le mode prod utilise une base séparée. Le compte existait encore dans la DB dev, mais pas dans la DB prod.

Solution :

Clarification des deux volumes Docker :

- dev : `eventifyy_eventifyy_postgres_data`;
- prod : `eventifyy_eventifyy_postgres_prod_data`.

On a vérifié que le volume dev contenait toujours l'utilisateur.

### 2. Docker prod avec base vide

Problème :

Le serveur prod pouvait démarrer avec une base qui n'avait pas encore les tables Prisma.

Solution :

Le `Dockerfile` prod exécute maintenant :

```bash
npm --workspace @eventifyy/db run db:push
```

avant de lancer Next en production.

### 3. Expo Go sur Android emulator

Problème :

Expo Go affichait "Something went wrong" ou ne rejoignait pas correctement l'API.

Causes principales :

- `localhost` ne fonctionne pas de la même manière dans Android emulator;
- le service mobile n'était pas toujours lancé dans le stack prod;
- les origines CORS ne couvraient pas toutes les URLs nécessaires.

Solutions :

- ajout de `mobile` dans `docker-compose.prod.yml`;
- ajout de `EXPO_PUBLIC_SERVER_URL=http://10.0.2.2:3001`;
- ajout de `REACT_NATIVE_PACKAGER_HOSTNAME=10.0.2.2`;
- extension de `CORS_ORIGIN` pour Expo et Android emulator;
- vérification du bundle Android via Metro.

### 4. Accents affichés incorrectement

Problème :

Certains textes semblaient afficher des caractères cassés dans PowerShell.

Cause :

PowerShell peut afficher du mojibake avec des fichiers UTF-8 sans BOM. Le contenu source réel était correct lors de la vérification avec Node.

Solution :

Contrôle automatisé des fichiers mobiles pour détecter les séquences typiques de mojibake UTF-8.

### 5. Map trop complexe trop tôt

Problème :

L'idée initiale d'une map centrale façon Snap Map était intéressante, mais elle ajoutait beaucoup de dépendance à des fournisseurs externes et une complexité importante.

Décision :

La map a été retirée temporairement. L'application se concentre maintenant sur :

- l'exploration;
- la création;
- la réservation;
- la logique communautaire.

La map pourra revenir plus tard comme amélioration, mais elle ne bloque plus le coeur du produit.

## 11. Vérifications effectuées

Avant le commit `993adfa`, les vérifications suivantes ont été réalisées :

```bash
npm run check-types
npm --workspace native run check-types
npm --workspace web run build
```

Résultats :

- type-check global OK;
- type-check mobile OK;
- build Next.js production OK;
- API health check OK;
- page login web OK;
- Expo Metro OK;
- bundle Android Expo OK;
- encodage mobile OK;
- nettoyage des sessions testé.

Endpoints validés :

```text
http://localhost:3001/api/trpc/healthCheck
http://localhost:3001/login
http://localhost:8081/status
```

## 12. Rapport avec le barème

### Web

Points forts actuels :

- interface responsive;
- pages organisées;
- interactions de recherche, filtres, réservation et annulation;
- loading states et error boundary;
- API tRPC typesafe;
- validation des inputs avec Zod;
- routes protégées;
- auth fonctionnelle;
- DB PostgreSQL via Docker;
- Docker Compose dev et prod;
- production bundle Next.js;
- SSR sur les pages importantes;
- logique métier centralisée.

Points encore améliorables :

- tests automatisés;
- vraie stratégie de cache plus avancée;
- meilleur seed de données pour la DB prod;
- monitoring ou logs applicatifs plus propres.

### Mobile

Points forts actuels :

- app Expo fonctionnelle;
- même logique métier que le web;
- auth;
- dashboard;
- création d'événement;
- réservation;
- annulation;
- pull-to-refresh;
- partage natif;
- connexion Android emulator documentée par configuration.

Points encore améliorables :

- test réel plus régulier sur Expo Go;
- meilleure gestion des erreurs offline;
- vraie feature mobile plus différenciante à terme, par exemple notifications, géolocalisation ou caméra.

## 13. Fichiers clés et rôles

### Racine

- `package.json` : scripts principaux du monorepo.
- `Dockerfile` : définit les images web dev, web prod et mobile.
- `docker-compose.yml` : environnement dev.
- `docker-compose.prod.yml` : environnement prod local.
- `LANCEMENT.md` : notes pratiques pour relancer le projet.

### Web

- `apps/web/src/app/page.tsx` : page d'accueil côté serveur.
- `apps/web/src/app/home-client.tsx` : logique interactive de l'accueil.
- `apps/web/src/app/dashboard/page.tsx` : protection serveur du dashboard.
- `apps/web/src/app/dashboard/dashboard.tsx` : interface dashboard.
- `apps/web/src/app/community/page.tsx` : page de philosophie communautaire.
- `apps/web/src/app/loading.tsx` : fallback de chargement.
- `apps/web/src/app/error.tsx` : boundary d'erreur.
- `apps/web/src/components/header.tsx` : navigation principale.
- `apps/web/src/components/sign-in-form.tsx` : connexion.
- `apps/web/src/components/sign-up-form.tsx` : inscription.

### Mobile

- `apps/native/app/index.tsx` : accueil mobile.
- `apps/native/app/dashboard.tsx` : dashboard mobile.
- `apps/native/app/login.tsx` : login mobile.
- `apps/native/app/community.tsx` : page communauté mobile.
- `apps/native/app/_layout.tsx` : navigation Expo Router.
- `apps/native/utils/trpc.ts` : client tRPC mobile.
- `apps/native/utils/server-url.ts` : résolution de l'URL API selon plateforme.
- `apps/native/lib/auth-client.ts` : client Better Auth mobile.
- `apps/native/components/screen.tsx` : layout mobile avec pull-to-refresh.

### API

- `packages/api/src/routers/index.ts` : routes tRPC.
- `packages/api/src/events.ts` : helpers et logique événementielle partagée.
- `packages/api/src/context.ts` : contexte API avec session auth.
- `packages/api/src/index.ts` : configuration tRPC.

### Database

- `packages/db/prisma/schema/schema.prisma` : modèles Event et Registration.
- `packages/db/prisma/schema/auth.prisma` : modèles Better Auth.
- `packages/db/src/index.ts` : client Prisma.
- `packages/db/scripts/clear-sessions.mjs` : invalidation des sessions au démarrage.

### Auth et env

- `packages/auth/src/index.ts` : configuration Better Auth.
- `packages/env/src/server.ts` : variables serveur.
- `packages/env/src/web.ts` : variables web.
- `packages/env/src/native.ts` : variables mobile.

## 14. État actuel du projet

Le dernier commit important est :

```text
993adfa Raise Eventifyy app baseline
```

Il contient :

- la logique communautaire;
- la page communauté web;
- la page communauté mobile;
- la séparation entre home serveur et client web;
- les états loading/error;
- le Docker prod;
- le mobile dans Docker prod;
- l'invalidation des sessions au démarrage;
- les corrections Expo Android emulator.

Le projet est maintenant dans un état cohérent pour une première démonstration complète :

- web utilisable;
- mobile utilisable via Expo;
- API partagée;
- auth;
- DB persistante;
- logique métier Eventifyy;
- Docker dev et prod.

## 15. Prochaines améliorations possibles

Pour aller plus loin, les étapes les plus utiles seraient :

1. Ajouter un seed de données propre pour la DB prod.
2. Ajouter des tests unitaires sur `registerForEvent`.
3. Ajouter des tests d'intégration tRPC.
4. Ajouter une vraie feature mobile différenciante : notifications, caméra, géolocalisation ou partage enrichi.
5. Réintégrer une map plus tard, seulement quand le coeur métier est stable.
6. Ajouter une page détail événement.
7. Ajouter un statut visible pour les événements annulés.
8. Ajouter une modération ou validation des événements pour renforcer le côté cercle sélectif.
9. Documenter précisément une procédure de démo pour le jury.

## 16. Résumé personnel

Eventifyy n'est plus seulement une stack technique. Le projet a maintenant une intention produit claire :

- créer une communauté d'événements à Bruxelles;
- forcer la contribution avant la participation;
- proposer une expérience web et mobile cohérente;
- garder une architecture typesafe et partagée.

La partie la plus importante du projet n'est pas la map. La vraie valeur actuelle est la logique communautaire, parce qu'elle donne une identité au produit et justifie les règles métier.
