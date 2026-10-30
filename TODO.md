# Etapes de développement de Taleway

## Développement

### Back-end

- [X] TESTS : Ecrire les tests de `/auth`
- [X] API : POST    /auth
- [X] API : POST    /auth/verify
- [X] API : POST    /auth/profile
- [X] TESTS : Réécrire `.http` dans `vitest`
- [X] API : POST    /stories
- [X] API : GET     /stories/SLUG
- [X] API : DELETE  /stories/SLUG
- [X] API : PUT     /stories/SLUG
- [X] TESTS : Ecrire les tests de `/stories`
- [X] TESTS : Ecrire les tests de `/stories/SLUG`
- [X] API : GET     /stories
  params :        category, author, title
  filter string used :    "@author", "#tag", ":category", "title"
- [X] TESTS : Ajouter des tests pour API -> GET `/stories`
- [X] API : GET     /profile/stories
- [X] API : GET     /profile/ID
- [X] TESTS : Ecrire les tests de `/profile`
- [X] API : GET     /bookmark/SLUG
- [X] API : DELETE  /bookmark/SLUG
- [X] TESTS : Ecrire les tests de `/bookmark/SLUG`
- [X] API : POST    /bookmark
- [X] TESTS : Ajouter des tests pour API -> POST `/bookmark`
- [X] API : GET     /profile/settings
- [X] API : PUT     /profile/settings
- [X] TESTS : Ajouter des tests pour API -> GET/PUT `/profile/settings`
- [X] Rajouter un anti-spam au niveau de l'API (rate-limit)
- [X] API : POST    /auth/logout
- [X] TESTS : Ajouter des tests pour API -> POST `/auth/logout`
- [X] Refactor !!!!

  - Supabase user
  - Rate limit
- [X] Commentaires !!!!
- [X] API : DELETE  /profile/ID
- [X] TESTS : Ajouter des tests pour API -> DELETE `/profile/ID`
- [X] Ajouter messages d'erreurs personnalisés pour les validations Zod

### Front-end

- [ ] Préparer composants (boutons, champs, etc...)
- [ ] Ajouter une page de connexion/inscription fonctionnelle pour :

  - synchro entre plusieurs appareil
  - sauvegarde bookmark permanent
  - création de romans interactif (essaie éditeur sans sauvegarde gratuit)
  - lecture de livres payants (extrait gratuit)
  - ajout de réaction (like, commentaire, follow)
- [ ] Migrer le corps du site (xyflow + panneau + debug mode + lecteur -> mode composant)
- [ ] Ajouter page d'accueil avec CTO et romans
- [ ] Ajouter page de profil et de paramètres
- [ ] Ajouter 3 romans interactifs fonctionnels (enquête, romance, horreur)
- [ ] Mentions légales + politique de confidentialité + CGU claires
- [ ] Créer les apps OAuth : [Discord](https://discord.com/developers/applications) + [Google](https://console.cloud.google.com/apis/credentials)
- [ ] Ajouter les variables dans le .env
- [ ] Mettre en recette (Upstash, Supabase, Resend, Vercel)
- [ ] Tester !
- [ ] Mettre en production

## Lancement silencieux

- [ ] Créer tuto FR sur Youtube
- [ ] 10-30 auteurs à la main (Discord, Reddit, Forums, ...)
- [ ] Permettre l'importation d'histoire (Twine, Twee 3, Harlowe, SugarCube, Ink) (conversion native ou pas ?)

## Lancement public

- [ ] Annonces communautaires (Reddit, X, Product Hunt, ...) + "trailer"
- [ ] Discuter avec auteurs actifs

## Monétisation

- [ ] Outil premium de confort (stats, thèmes, ...)
- [ ] Création micro-entreprise
- [ ] Ecriture des CGV
- [ ] Préparation des factures
- [ ] Mise en prod

## Montée en gamme

- [ ] Passage de micro-entreprise à SAS
- [ ] Arrivée d'une collaboratrice ?

## Visée internationale

- [ ] Ajouter langues (locales)
