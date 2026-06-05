# Rapport d'intégration API admin — dashboard web

> **Date** : juin 2026  
> **Périmètre** : `apps/web` ↔ routes `backend` (`/admin/*`)  
> **Matrice technique détaillée** : [ADMIN-INTEGRATION.md](./ADMIN-INTEGRATION.md)  
> **Contrat backend** : [ADMIN-API-CONTRACT.md](../../backend/docs/ADMIN-API-CONTRACT.md)

---

## Synthèse exécutive

| Indicateur | Valeur |
|------------|--------|
| Routes admin backend (Swagger) | **46** (+ 1 bonus : `PATCH /admin/libraries/{id}/unarchive`) |
| Routes déclarées dans `ADMIN_ROUTES` | **47** chemins |
| Stores `*-store.ts` branchés | **12** domaines — **100 % des routes exposées** |
| Pages menu latéral | **13** entrées |
| Pages entièrement sur API (si `NEXT_PUBLIC_API_BASE_URL` + JWT) | **~11** |
| Pages partiellement sur API | **3** |
| Pages sans route API (mock / statique / local) | **3** |

**Conclusion** : toutes les routes admin du contrat sont **implémentées dans les stores**. L'écart restant concerne surtout l'**UI** : quelques écrans affichent encore des mocks, des filtres client-only, ou des actions locales non exposées par l'API.

---

## Architecture d'intégration

```
apps/web/
├── src/lib/api/
│   ├── routes.ts          # ADMIN_ROUTES — chemins HTTP réels
│   ├── client.ts          # fetch + JWT
│   ├── admin-types.ts     # types réponse API
│   └── adapters.ts        # mapping API → modèles UI
├── src/lib/*-store.ts     # fetch*Persisted / create*Persisted
├── src/lib/admin/
│   ├── validators.ts      # corps JSON / query params
│   └── admin-integration.test.ts  # 14 tests Vitest
└── src/app/(admin)/       # pages Next.js
```

**Mode API** : `NEXT_PUBLIC_API_BASE_URL` défini + session JWT admin (`POST /auth/password/login`).

**Mode démo** : sans URL API → fallback `localStorage` / `mock-data`.

---

## Matrice des 46 routes — consommation

### Partie 1 — Référentiels (8 routes) ✅

| Route | Store | Page UI |
|-------|-------|---------|
| `GET/POST/PATCH/DELETE /admin/categories` | `categories-store` | `/admin/categories` |
| `GET/POST/PATCH/DELETE /admin/auteurs` | `auteurs-store` | `/admin/auteurs` |

### Partie 2 — Catalogue (12 routes) ✅

| Route | Store | Page UI |
|-------|-------|---------|
| `GET/POST/PATCH /admin/books` | `livres-store` | `/admin/livres` |
| `PATCH /admin/books/{id}/archive` | `archiveLivrePersisted` | `/admin/livres` |
| `POST …/authors`, `POST …/categories` | `assignBook*` | formulaires livre |
| `GET/POST/PATCH /admin/libraries` | `libraries-store` | `/admin/bibliotheques` |
| `PATCH …/archive`, `PATCH …/unarchive` | archive / unarchive | `/admin/bibliotheques` |
| `POST …/books`, `DELETE …/books/{bookId}` | add / remove books | modal bibliothèque |

### Partie 3 — Utilisateurs & modération (11 routes) ✅

| Route | Store | Page UI |
|-------|-------|---------|
| `GET/POST /admin/users` | `users-store` | `/admin/utilisateurs`, `/admin/administrateurs` |
| `GET /admin/users/{id}` | `fetchUserDetailPersisted` | `/admin/utilisateurs/[id]`, `/admin/utilisateurs/[id]/abonnement` |
| `PATCH …/ban`, `PATCH …/unban` | ban / unban | liste + fiche profil |
| `GET/PATCH/DELETE /admin/comments` | `comments-store` | `/admin/commentaires` |
| `GET /admin/subscriptions` | `subscriptions-store` | `/admin/abonnements` |
| `PATCH …/cancel` | `cancelSubscriptionPersisted` | `/admin/abonnements` |
| `GET /admin/payments` | `payments-store` | `/admin/paiements` |

### Partie 4 — Monétisation, gamification, stats (15 routes) ✅

| Route | Store | Page UI |
|-------|-------|---------|
| `GET/POST/PATCH /admin/plans` | `plans-store` | `/admin/abonnements` |
| `GET/POST/PATCH /admin/challenges` | `challenges-store` | `/admin/defis` |
| `PATCH …/cancel`, `GET …/participants` | cancel + modal | `/admin/defis` |
| `GET/POST/PATCH /admin/badges` | `badges-store` | `/admin/defis` |
| `GET /admin/stats/dashboard` | `stats-store` | `/admin` (dashboard) |
| `GET /admin/stats/users` | `fetchStatsUsers` | dashboard + `/admin/statistiques` |
| `GET /admin/stats/books` | `fetchStatsBooks` | `/admin/statistiques` |
| `GET /admin/stats/search-terms` | `fetchSearchTermsStats` | `/admin/statistiques` |

### Auth (requis)

| Route | Usage |
|-------|-------|
| `POST /auth/password/login` | Connexion admin JWT |

---

## Pages admin — état de consommation API

### Entièrement branchées (mode API + JWT)

| Page | Routes consommées |
|------|-------------------|
| `/admin/categories` | CRUD catégories |
| `/admin/auteurs` | CRUD auteurs |
| `/admin/livres` | Liste, filtres, CRUD, archive |
| `/admin/livres/[id]/modifier` | PATCH livre + assign auteurs/catégories |
| `/admin/bibliotheques` | CRUD + archive/unarchive + livres |
| `/admin/utilisateurs` | GET liste + ban/unban |
| `/admin/utilisateurs/[id]` | GET détail + ban/unban |
| `/admin/utilisateurs/[id]/abonnement` | GET détail (`abonnements[]`, `paiements[]`) |
| `/admin/commentaires` | GET + modérer + supprimer |
| `/admin/abonnements` | Plans + abonnements + annulation |
| `/admin/paiements` | GET liste |
| `/admin/defis` | Défis + badges + participants |

### Partiellement branchées

| Page | API | Reste mock / local |
|------|-----|-------------------|
| `/admin` (dashboard) | `stats/dashboard`, alertes paiements/commentaires, plans, subs | Graphique abonnements mock si pas de session ; activité récente non exposée |
| `/admin/statistiques` | `stats/books`, `stats/users`, `stats/search-terms`, KPI dashboard | Mode démo : graphiques mock |
| `/admin/administrateurs` | `GET /admin/users?role=ADMIN`, `POST /admin/users` | Édition / suspension / suppression = localStorage uniquement |

### Hors périmètre API

| Page | Statut |
|------|--------|
| `/admin/notifications` | **100 % mock** — bannière « Hors périmètre API », création désactivée en mode API |
| `/admin/support` | Page statique (mailto, liens doc) |
| `/admin/profile`, `/admin/account-settings` | Profil admin local (`admin-auth.ts`) |

### Détail via cache liste (pas de `GET /{id}` dédié)

| Page | Comportement |
|------|--------------|
| `/admin/livres/[id]` | `fetchLivres()` + `getLivreById` (pas de route détail livre côté API) |
| `/admin/categories/[id]`, `/admin/auteurs/[id]` | Idem via liste paginée |

---

## Menu latéral vs API

```
Menu (13 entrées)
├── Tableau de bord      → API partielle
├── Livres               → API OK
├── Auteurs              → API OK
├── Catégories           → API OK
├── Utilisateurs         → API OK (actions limitées)
├── Administrateurs      → API partielle (liste + création)
├── Abonnements          → API OK
├── Paiements            → API OK (lecture)
├── Bibliothèques        → API OK
├── Défis & Badges       → API OK
├── Commentaires         → API OK
├── Notifications        → ❌ HORS PÉRIMÈTRE API
└── Statistiques         → API OK (graphiques dérivés de routes existantes)
```

---

## Travail réalisé — corrections majeures

### Intégration initiale (4 parties du contrat)

- `ADMIN_ROUTES`, adaptateurs, validateurs, types
- 12 stores branchés sur les 46 routes admin
- Filtres API : `statut`, `role`, `q`, `page`, `limit` sur les listes
- Plans en **XOF**, défis `objectif_valeur` numérique, livres EXTERNE
- Tests Vitest : `admin-integration.test.ts` (14 tests)

### Vague correctifs utilisateurs

- `PATCH /admin/users/{id}/ban` : `{ raison? }`, garde-fou auto-ban, UI raison
- `PATCH /admin/users/{id}/unban` : sans corps, action liste + fiche profil
- `toggleUserBanPersisted` : bascule selon `statut` courant (plus de dépendance au cache paginé)

### Backlog juin 2026 (terminé)

| Point | Fichier(s) | Résultat |
|-------|------------|----------|
| Abonnement utilisateur | `utilisateurs/[id]/abonnement/page.tsx` | Branché sur `fetchUserDetailPersisted` |
| Liste administrateurs | `administrateurs/page.tsx` | `GET /admin/users?role=ADMIN` ; bugs TS corrigés |
| Graphiques statistiques | `statistiques/page.tsx` | KPI dashboard, donut statut compte, courbe inscriptions ; bug `setUsersStats` corrigé |
| Notifications | `notifications/page.tsx` | Bannière hors périmètre, création désactivée en mode API |
| Documentation | `ADMIN-INTEGRATION.md` | Matrice mise à jour |

---

## Limites connues (API inchangée côté backend)

| Sujet | Impact UI |
|-------|-----------|
| Pas de `POST` USER admin | Création utilisateur désactivée en mode API |
| Pas de `PATCH` profil user | Édition utilisateur désactivée |
| Pas de `DELETE` compte user | Suppression désactivée en mode API |
| Pas de `GET /admin/books/{id}` | Fiche livre via cache liste |
| Pas de route notifications admin | Page notifications = démo localStorage |
| Pas de stats « catégories livres » / « abonnements par mois » | Graphiques dérivés de `stats/users` ou mock en mode démo |
| Filtres `abonnement_actif`, opérateur paiement, catégorie livres | Filtres **client-side** uniquement |
| Édition admin (suspendre, supprimer) | localStorage uniquement — pas d'API |

---

## Filtres et écarts mineurs

| Zone | Détail |
|------|--------|
| Plans | Libellé `nom` UI non persisté (seul code `plan` à la création) |
| Filtre abonnement utilisateur | `abonnement_actif` : filtre client uniquement |
| Filtre type abonnement | `type_renouvellement` : filtre client uniquement |
| Opérateur paiements | Filtre client uniquement |
| Catégorie livres (liste) | Filtre client (pas de query API dédiée) |
| Livres EXTERNE | Création OK ; édition PATCH limitée côté UI |
| Bibliothèques | Pas de DELETE global ; `removeBook` branché en UI |
| Défis | Badge non modifiable à l'édition |
| Plans | Suppression = PATCH `statut: INACTIF` |

---

## Tests et validation

```bash
# Tests d'intégration admin (validateurs, routes)
cd apps/web && npx vitest run src/lib/admin/admin-integration.test.ts

# Vérification TypeScript
cd apps/web && npx tsc --noEmit
```

**14 tests** passent dans `admin-integration.test.ts` (juin 2026).

---

## Prérequis développement

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_API_BASE_URL` | Ex. `http://localhost:3000` |
| JWT admin | `POST /auth/password/login` ou `NEXT_PUBLIC_ADMIN_BEARER_TOKEN` |

Swagger live : `http://localhost:3000/api/docs` — filtre **Admin —**.

Régénérer la doc contrat : `cd backend && npm run docs:admin`

---

## Bilan final

| Question | Réponse |
|----------|---------|
| Toutes les routes admin sont-elles consommées dans le code ? | **Oui** — 46/46 (+ unarchive) dans les stores |
| Toutes les interfaces consomment-elles l'API ? | **Presque** — 3 pages hors périmètre, 3 partielles |
| L'intégration est-elle terminée ? | **Oui** pour le contrat API ; UI à ~95 % |

### Priorités restantes (optionnel)

1. Brancher édition/suspension admin sur de futures routes API (si ajoutées côté backend)
2. Ajouter `GET /admin/books/{id}` côté backend pour fiche livre directe
3. Route admin notifications si le produit l'exige
4. Corriger erreur TS préexistante sur `abonnements/page.tsx` (`Input` `readOnly`)

---

## Fichiers de référence

| Fichier | Rôle |
|---------|------|
| [ADMIN-INTEGRATION.md](./ADMIN-INTEGRATION.md) | Matrice route ↔ store ↔ page |
| [routes.ts](../src/lib/api/routes.ts) | Chemins HTTP |
| [admin-integration.test.ts](../src/lib/admin/admin-integration.test.ts) | Tests contrat |
| [backend/docs/ADMIN-ROUTES-SWAGGER.md](../../backend/docs/ADMIN-ROUTES-SWAGGER.md) | Index Swagger 46 routes |
