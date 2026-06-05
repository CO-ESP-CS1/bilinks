# Intégration API admin — dashboard web (4 parties)

> Contrat détaillé par partie : [backend/docs/admin/](../../backend/docs/admin/)  
> Index : [ADMIN-API-CONTRACT.md](../../backend/docs/ADMIN-API-CONTRACT.md)  
> **Rapport complet (audit + backlog)** : [RAPPORT-INTEGRATION-ADMIN.md](./RAPPORT-INTEGRATION-ADMIN.md)

---

## Découpage en 4 parties

| Partie | Document | Routes | Pages web | Statut intégration |
|--------|----------|--------|-----------|-------------------|
| **1** | [PARTIE-1-REFERENTIELS.md](../../backend/docs/admin/PARTIE-1-REFERENTIELS.md) | Catégories, Auteurs | `/admin/categories`, `/admin/auteurs` | **Terminée** |
| **2** | [PARTIE-2-CATALOGUE.md](../../backend/docs/admin/PARTIE-2-CATALOGUE.md) | Livres, Bibliothèques | `/admin/livres`, `/admin/bibliotheques` | **Terminée** |
| **3** | [PARTIE-3-UTILISATEURS-MODERATION.md](../../backend/docs/admin/PARTIE-3-UTILISATEURS-MODERATION.md) | Users, comments, subs, payments | Utilisateurs, commentaires… | **Terminée** |
| **4** | [PARTIE-4-MONETISATION-GAMIFICATION-STATS.md](../../backend/docs/admin/PARTIE-4-MONETISATION-GAMIFICATION-STATS.md) | Plans, défis, badges, stats | Dashboard, défis… | **Terminée** |

Régénérer toute la doc : `cd backend && npm run docs:admin`

---

## Prérequis développement

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_API_BASE_URL` | Ex. `http://localhost:3000` |
| JWT admin | `POST /auth/password/login` ou token via [`auth-token`](../src/lib/api/auth-token.ts) |

Client : [`src/lib/api/client.ts`](../src/lib/api/client.ts)

---

## Partie 1 — Référentiels (terminée)

### Catégories

| Route | Store | Statut |
|-------|-------|--------|
| `GET /admin/categories` | `fetchCategoriesPersisted` | OK — `{ data, meta }`, filtre `q`, `nb_livres` |
| `POST /admin/categories` | `createCategoryPersisted` | OK — `{ nom, description? }` → 201 `{ id, nom }`, 409 nom unique |
| `PATCH /admin/categories/{id}` | `updateCategoryPersisted` | OK — `{ nom?, description? }` → `{ id, updatedAt }`, 409 |
| `DELETE /admin/categories/{id}` | `softDeleteCategoryPersisted` | OK — `{ deleted_at }`, 409 défi ACTIF |

Fichiers : [`categories-store.ts`](../src/lib/categories-store.ts), `src/app/(admin)/categories/`.

### Auteurs

| Route | Store | Statut |
|-------|-------|--------|
| `GET /admin/auteurs` | `fetchAuteursPersisted` | OK — `{ data, meta }` |
| `POST /admin/auteurs` | `createAuteurPersisted` | OK (nom, prénom, bio) |
| `PATCH /admin/auteurs/{id}` | `updateAuteurPersisted` | OK |
| `DELETE /admin/auteurs/{id}` | `softDeleteAuteurPersisted` | OK |

Fichiers : [`auteurs-store.ts`](../src/lib/auteurs-store.ts), `src/app/(admin)/auteurs/`.

**Notes communes partie 1** : pas de `GET …/{id}` ni restore API ; cache rechargé après mutations ; fallback localStorage sans `NEXT_PUBLIC_API_BASE_URL`.

---

## Partie 2 — Catalogue (terminée)

### Livres

| Route | Store / UI | Statut |
|-------|------------|--------|
| `GET /admin/books` | `fetchLivres` | OK — inclut `couverture_url`, `annee_publication`, `nombre_pages` ; mappés vers `couvertureUrl` UI |
| `POST /admin/books` | `createLivrePersisted` — multipart : `file`/`couverture`, `titre`, `type_livre`, `url_externe_livre`, `is_downloadable`, `isbn`, `resume`, `langue`, `annee_publication`, `nombre_pages` → 201 `{ id, titre, type_livre, statut }` ; 409 ISBN | OK |
| `PATCH /admin/books/{id}` | `updateLivrePersisted` — multipart sans `type_livre` ; `file`/`couverture` (INTERNE) → 200 `{ id, updatedAt }` ; 409 ISBN | OK |
| `PATCH /admin/books/{id}/archive` | `archiveLivrePersisted` | OK — `{ id, statut }`, 404 si livre introuvable |
| `POST /admin/books/{id}/authors` | `assignBookAuthorsPersisted` — `{ auteur_ids }` → 200 `{ auteurs[] }`, remplace tout | OK |
| `POST /admin/books/{id}/categories` | `assignBookCategoriesPersisted` — `{ categorie_ids }` → 200 `{ categories[] }`, remplace tout | OK |
| `POST /admin/libraries/{id}/books` | via `addBooksToLibraryPersisted` à la création | OK |

Fichiers : [`livres-store.ts`](../src/lib/livres-store.ts), `src/app/(admin)/livres/`. Formulaires : auteurs en UUID (`MultiSelect`), fichier obligatoire à la création.

### Bibliothèques

| Route | Store | Statut |
|-------|-------|--------|
| `GET /admin/libraries` | `fetchLibrariesPersisted` | OK |
| `POST /admin/libraries` | `createLibraryPersisted` | OK |
| `PATCH /admin/libraries/{id}` | `updateLibraryPersisted` | OK |
| `PATCH /admin/libraries/{id}/archive` | `archiveLibraryPersisted` | OK |
| `PATCH /admin/libraries/{id}/unarchive` | `unarchiveLibraryPersisted` | OK |
| `POST /admin/libraries/{id}/books` | `addBooksToLibraryPersisted` + UI carte INTERNE | OK — `{ livre_ids }`, réponse `{ added }` |

Fichiers : [`libraries-store.ts`](../src/lib/libraries-store.ts), `src/app/(admin)/bibliotheques/`.

**Notes partie 2** : désarchivage livre non exposé côté API ; bibliothèques : archive + désarchive en UI (`unarchive` symétrique à `archive`) ; `statut` livre non envoyé au `POST` ; pas de `DELETE` bibliothèque.

---

## Partie 3 — Utilisateurs & modération (terminée)

### Utilisateurs

| Route | Store | Statut |
|-------|-------|--------|
| `GET /admin/users` | `fetchUsersPersisted` → `utilisateurs/page.tsx` | OK — `statut`/`role`/`q`/`page`/`limit`, `{ data, meta }`, champs liste + abonnement_actif |
| `GET /admin/users/{id}` | `fetchUserDetailPersisted` → `utilisateurs/[id]/page.tsx` | OK — auth/personne, abonnements[], paiements[], compteurs activité |
| `POST /admin/users` | `createAdminPersisted` → `administrateurs/page.tsx` | OK — corps `nom`/`prenom`/`email`/`password` (≥8), 201 `{ id, email, role, statut }`, 409 email |
| `PATCH /admin/users/{id}/ban` | `banUserPersisted` / `toggleUserBanPersisted` | OK — `{ raison? }`, 200 `{ id, statut }`, 400 auto-ban, UI raison |
| `PATCH /admin/users/{id}/unban` | `unbanUserPersisted` / `toggleUserBanPersisted` | OK — sans corps, 200 `{ id, statut }`, `statut` → ACTIF ; liste + fiche profil |

Fichiers : [`users-store.ts`](../src/lib/users-store.ts), `src/app/(admin)/utilisateurs/`.

**Notes** : pas de PATCH profil ni DELETE compte ; création USER désactivée si API configurée ; statut `PENDING` affiché tel quel.

### Commentaires

| Route | Store | Statut |
|-------|-------|--------|
| `GET /admin/comments` | `fetchCommentsPersisted` | OK |
| `PATCH /admin/comments/{id}/moderate` | `moderateCommentPersisted` | OK — `{ raison }` |
| `DELETE /admin/comments/{id}` | `deleteCommentPersisted` | OK — hard delete |

Fichier : [`comments-store.ts`](../src/lib/comments-store.ts), `src/app/(admin)/commentaires/`.

### Abonnements (liste admin)

| Route | Store | Statut |
|-------|-------|--------|
| `GET /admin/subscriptions` | `fetchSubscriptionsPersisted` | OK |
| `PATCH /admin/subscriptions/{id}/cancel` | `cancelSubscriptionPersisted` | OK — `{ raison }` obligatoire |

Fichier : [`subscriptions-store.ts`](../src/lib/subscriptions-store.ts) — section abonnements de `abonnements/page.tsx` (plans = partie 4).

### Paiements

| Route | Store | Statut |
|-------|-------|--------|
| `GET /admin/payments` | `fetchPaymentsPersisted` | OK — lecture seule |

Fichier : [`payments-store.ts`](../src/lib/payments-store.ts), `src/app/(admin)/paiements/`.

---

## Partie 4 — Plans, gamification & stats (terminée)

### Plans tarifaires

| Route | Store | Statut |
|-------|-------|--------|
| `GET /admin/plans` | `fetchPlansPersisted` | OK — ACTIF + INACTIF, `{ data[] }` ou tableau, champs `plan`/`prix`/`devise`/`duree_jours`/`statut` |
| `POST /admin/plans` | `createPlanPersisted` | OK — corps `plan`/`prix` (≥100)/`devise`/`duree_jours`, sans `statut` ; 201 objet plan ; 400 prix ; 409 doublon `plan` |
| `PATCH /admin/plans/{id}` | `updatePlanPersisted` | OK — corps partiel `prix`/`duree_jours`/`statut` ; 200 `{ id, prix, statut }` ; 400 prix ; 404 plan |

Fichier : [`plans-store.ts`](../src/lib/plans-store.ts), section plans dans `abonnements/page.tsx`. Codes : `HEBDOMADAIRE` | `MENSUEL` | `ANNUEL` uniquement.

### Défis

| Route | Store | Statut |
|-------|-------|--------|
| `GET /admin/challenges` | `fetchChallengesPersisted` + filtre UI `statut` | OK — `{ data, meta }`, `page`/`limit` |
| `POST /admin/challenges` | `createChallengePersisted` | OK — corps aligné OpenAPI, 201 `{ id }` |
| `PATCH /admin/challenges/{id}` | `updateChallengePersisted` | OK — ACTIF, `{ titre?, description?, date_fin?, objectif_valeur? }` → `{ id, updatedAt }` |
| `PATCH /admin/challenges/{id}/cancel` | `cancelChallengePersisted` | OK — `{ statut, nb_utilisateurs_echoues }`, 404 si défi introuvable |
| `GET /admin/challenges/{id}/participants` | `fetchChallengeParticipantsPersisted` | OK — filtre `statut`, pagination `page`/`limit`, modal UI |

Fichier : [`challenges-store.ts`](../src/lib/challenges-store.ts), `defis/page.tsx`.

### Badges

| Route | Store | Statut |
|-------|-------|--------|
| `GET /admin/badges` | `fetchBadgesPersisted` | OK — `{ data, meta }`, `nb_utilisateurs` → `nbAttribues` |
| `POST /admin/badges` | `createBadgePersisted` | OK — `multipart/form-data` : `icone`* (fichier → Cloudinary), `nom`* (≤150), `couleur`* (`#RRGGBB`), `points`* (entier ≥0), `description` ; **201** `{ id, icone }` ; **409** nom dupliqué |
| `PATCH /admin/badges/{id}` | `updateBadgePersisted` | OK — `multipart/form-data` partiel : `nom?`, `couleur?`, `points?`, `description?`, `icone?` (fichier) ; **200** `{ id, updatedAt }` (+ `icone` si remplacée) ; **404** / **409** |

Fichiers : [`badges-store.ts`](../src/lib/badges-store.ts), onglet **Badges** de [`defis/page.tsx`](../src/app/(admin)/defis/page.tsx) — liste, création et édition (upload icône).

### Statistiques

| Route | Store / page | Statut |
|-------|----------------|--------|
| `GET /admin/stats/dashboard` | `fetchDashboardStats` → `page.tsx` | OK — KPI + `top_5_livres`, JWT requis, pas de query |
| `GET /admin/stats/users` | `fetchStatsUsers` → `statistiques/page.tsx`, `page.tsx` | OK — `periode` 7j\|30j\|90j\|365j, inscriptions + répartitions + taux |
| `GET /admin/stats/books` | `fetchStatsBooks` → `statistiques/page.tsx` | OK — `sort`/`page`/`limit`, `{ data[], meta }`, champs livre + stats |
| `GET /admin/stats/search-terms` | `fetchSearchTermsStats` → `statistiques/page.tsx` | OK — `periode` 7j\|30j, `no_results`, `{ data[], top_sans_resultats[] }` |

Fichier : [`stats-store.ts`](../src/lib/stats-store.ts), [`statistiques/page.tsx`](../src/app/(admin)/statistiques/page.tsx). En mode API : **plus de fallback mock** — listes/graphiques vides sans JWT ou base vide.

### Notifications

| Route | Statut |
|-------|--------|
| `GET/POST /admin/notifications` | **Hors périmètre** — non exposé par le backend |

Page [`notifications/page.tsx`](../src/app/(admin)/notifications/page.tsx) : liste vide en mode API, bannière explicative (notifications système créées côté serveur uniquement).

---

## Intégration admin — synthèse

Les **4 parties** du contrat admin sont branchées côté web (fallback mock/localStorage sans `NEXT_PUBLIC_API_BASE_URL`).

Régénérer la doc : `cd backend && npm run docs:admin`

---

## État audit 2026 (front ↔ back)

### Aligné (payload / réponse)

| Domaine | Statut |
|---------|--------|
| Catégories, Auteurs | OK — `ADMIN_ROUTES`, corps JSON conforme |
| Livres INTERNE | OK — multipart + `auteur_ids` / `categorie_ids` / `livre_ids` |
| Bibliothèques | OK — CRUD + archive |
| Users ban/unban | OK — ban `{ raison? }` ; unban sans corps ; réponse `{ id, statut }` |
| Comments, Payments | OK — moderate/delete, GET liste |
| Subscriptions cancel | OK — `{ raison }` min 3 caractères |
| Plans | OK — POST/PATCH champs API ; GET `{ data }` |
| Défis, Badges | OK — POST avec cibles selon `type` ; badge multipart |
| Stats (dashboard, users, books) | OK sur pages branchées |

### Corrigé — vague 2 (re-audit)

| Zone | Correction |
|------|------------|
| **Plans devise** | Envoi et affichage **XOF** (aligné backend) |
| **Défis objectif** | Champ numérique `objectif_valeur` en mode API |
| **Filtres liste API** | `fetch*Persisted` reçoit `statut` / `q` / `plan` depuis les pages (users, comments, payments, subs, books) |
| **Livres liste** | Affichage « — » via [catalog-display.ts](../src/lib/catalog-display.ts) ; filtres `statut` + `q` côté API |
| **Livres EXTERNE** | Formulaire + [book-payload.ts](../src/lib/admin/book-payload.ts) : `type_livre=EXTERNE`, `url_externe_livre`, pas de `file` |

### Mineur / backlog (inchangé côté API)

| Zone | Détail |
|------|--------|
| Plans | Libellé `nom` UI non persisté (seul code `plan` à la création) |
| Filtre abonnement utilisateur | `abonnement_actif` : filtre client uniquement |
| Filtre type abonnement | `type_renouvellement` : filtre client uniquement |
| Opérateur paiements | Filtre client uniquement |
| Catégorie livres | Filtre client (pas de query API dédiée) |
| Notifications | **Hors périmètre API** — liste vide en mode API, plus de mock fictif |
| Abonnement utilisateur | `utilisateurs/[id]/abonnement` → `GET /admin/users/{id}` |
| Administrateurs liste | `GET /admin/users?role=ADMIN` (lecture seule en mode API) |

---

## Limites connues (API inchangée)

| Sujet | Détail |
|-------|--------|
| Livres EXTERNE | Création OK (URL + `is_downloadable=false`) ; édition PATCH limitée côté UI |
| Utilisateurs | Pas de POST USER ni PATCH profil ; POST = admin uniquement |
| Commentaires | Pas de republication après modération |
| Bibliothèques | Pas de DELETE ; archivage uniquement ; `removeBook` non branché |
| Défis | Badge non modifiable à l’édition |
| Plans | Suppression = PATCH `statut: INACTIF` |
| Liste livres | Pas de `couverture_url` / année / pages dans le GET list |
