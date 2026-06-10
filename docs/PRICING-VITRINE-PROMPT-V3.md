# B LINKS — Prompt Cursor V3 · Page vitrine `/pricing`

> **Objectif** : Refondre `/pricing` pour qu'elle soit **100 % alignée sur l'identité B LINKS déjà existante** (logo, app mobile, catalogue congolais).  
> **Stack** : Next.js App Router + Tailwind CSS — **CSS pur**, pas de Framer Motion / GSAP.  
> **Ne pas toucher** : admin, flux `/subscribe`, backend paiement.

---

## Contexte produit

**B LINKS** est une plateforme de lecture numérique congolaise (Brazzaville / Congo-Brazzaville).  
Public : **étudiants**, **enseignants**, **lecteurs** — paiement **MTN MoMo** et **Airtel Money**, pas de carte bancaire.

La page `/pricing` est la **vitrine + conversion** : convaincre en 5 secondes, pousser vers `/subscribe`.

---

## Ce que les versions précédentes ont raté (à ne JAMAIS refaire)

| ❌ Interdit | Pourquoi |
|------------|----------|
| Fond dark `#050A14`, `#0C1628`, bleu marine sombre | Ce n'est pas l'app B LINKS — l'app est **claire** |
| Logo générique « B » carré sans étoiles | Le vrai logo a une **courbe dynamique + étoiles dorées** |
| Placeholders US (« Lorem », « $9/mo », Stripe vibes) | Public congolais, **XOF/FCFA**, **MTN MoMo** |
| Gradient purple/violet (subscribe actuel) | Hors identité — le violet du tunnel `/subscribe` n'est pas la vitrine |
| `rounded-3xl`, glassmorphism, orbes flous, glow SaaS | Template IA 2023 — pas un studio créatif |
| Inter, Space Grotesk, Poppins comme display | Typo froide générique |
| Inventer des auteurs / témoignages fictifs US | Utiliser les **vrais noms du catalogue mobile** |

---

## Identité visuelle — Source de vérité (déjà dans le repo)

### 1. Logo B LINKS

**Fichier** : `public/images/logo/bibliotech-logo.png`  
**Composant existant** : `src/components/common/BrandMark.tsx`

Caractéristiques visuelles :
- **« B »** avec **courbe dynamique** (pas un B géométrique froid)
- **Étoiles dorées** — vivant, jeune, optimiste
- Le **bleu roi `#1246D6`** vient directement du logo — c'est LA couleur primaire web

**Règle** : Sur `/pricing`, utiliser **`BrandMark`** ou `<Image src="/images/logo/bibliotech-logo.png">` — **jamais** un logo carré inventé (`EditorialLogo` actuel à remplacer).

### 2. App mobile — référence visuelle

**Dossier** : `apps/mobile/`

| Élément | Fichier / constante | Détail |
|---------|---------------------|--------|
| Fond app clair | `#F4F6FB` (surface générale app) | Pas blanc froid `#FFF`, pas dark |
| Bannière hero verte | `HERO_GRADIENTS.green` dans `constants/brandPalette.ts` | `#1A4D38 → #2D6B52 → #4A9B74` — femme qui lit, chaleureux |
| Bannière bleue | `HERO_GRADIENTS.blue` | `#15325A → #1E4A7A → #3B6EA8` |
| Orange signature | `#E07A45` / `#E8621A` (web) | CTA, accents |
| Vert lecture | `#2D6B52`, soft `#E6F4ED` | Badges, bannières culturelles |
| Couvertures livres | `apps/mobile/assets/images/Livre/*` | Visuels chauds, auteurs africains |

**Auteurs réels du catalogue** (à citer sur la vitrine — couvertures, carousel, social proof) :
- **Marie Kabila** — *L'entrepreneuriat au féminin en RDC*
- **Grace Mujinga** — *Marketing digital pour PME*
- **Association F.E.** — ouvrages associatifs
- **Patrick Lumumba**, **Jean-Baptiste Mbuyi**, **Dr. Mukendi** — catalogue académique

Source : `apps/mobile/data/mocks/books.mock.ts`, `components/home/mockData.ts`

### 3. Palette FINALE V3 — ne pas dévier

```css
:root {
  /* Surfaces — comme l'app mobile */
  --app-bg:       #F4F6FB;   /* Fond principal vitrine = fond app */
  --surface:      #FFFFFF;   /* Cards, navbar */
  --surface-warm: #F5F0E8;   /* Sections alternées (ivoire chaud) */
  --green-soft:   #E6F4ED;   /* Badges lecture, accents bannière */
  --blue-soft:    #EEF2FF;   /* Chips, pastilles */

  /* Marque */
  --blue-bold:    #1246D6;   /* Bleu roi — extrait du logo */
  --green:        #2D6B52;   /* Bannière app, culture, ancrage */
  --green-light:  #4A9B74;
  --orange:       #E8621A;   /* CTA signature B LINKS */
  --orange-hover: #C8531A;
  --gold:         #E8B84B;   /* Étoiles du logo — highlights discrets */

  /* Texte */
  --ink:          #0D0D0D;   /* Titres */
  --text:         #1F2937;   /* Corps */
  --muted:        #6B6560;   /* Secondaire warm grey */
  --line:         #E0D8CE;   /* Séparateurs chauds */
}
```

**Rythme des sections** : alternance `--app-bg` / `--surface` / `--surface-warm` / **1 seule section accent** (pricing dark `--ink` OU bannière `--green`).

---

## Typographie

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@600;700;800&family=Barlow+Condensed:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
```

| Usage | Font | Style |
|-------|------|-------|
| H1 hero, citations | **Instrument Serif** | italic 400 — éditorial, humain |
| H2 sections | **Barlow Condensed** | 800 uppercase, letter-spacing -0.02em |
| Body | **DM Sans** | 400/500 |
| Labels, nav, badges | **Barlow** | 600 uppercase 10–11px |

**Interdit** : Inter, Roboto, Arial, system-ui comme display.

---

## Architecture fichiers (existant — à refactorer, pas repartir de zéro)

```
src/app/pricing/
  layout.tsx          # fonts + classe .pricing-page
  page.tsx            # Server: fetchPublicPlans() → composants

src/lib/marketing/
  plans-api.ts        # GET /plans public (NEXT_PUBLIC_API_BASE_URL)
  copy.ts             # Textes FR Congo — MTN, Brazzaville, auteurs réels
  theme.ts            # Tokens CSS ci-dessus

src/components/marketing/
  MarketingNavbar.tsx
  MarketingHero.tsx   # Layout asymétrique + vraies couvertures livres
  PartnersSection.tsx
  FeaturesSection.tsx
  PricingSection.tsx  # 2 cards: Découverte + Mensuel (API)
  TestimonialsSection.tsx
  FinalCtaSection.tsx
  MarketingFooter.tsx
  PricingRevealProvider.tsx

src/hooks/useScrollReveal.ts   # IntersectionObserver → .is-visible
```

**API** : `fetchPublicPlans()` → `{ data: [{ id, plan, prix, devise, duree_jours }] }`  
**CTA** : tous les boutons abonnement → `/subscribe` (ne pas recréer CinetPay côté web).

---

## Page complète — Section par section

### 1. NAVBAR — Barre claire, logo réel

- Fond `#FFFFFF`, `border-bottom: 1px solid var(--line)`, sticky, height 56px
- **Logo** : `BrandMark` avec `href="/pricing"` `theme="light"` — **image PNG réelle**
- Droite : « Connexion » (`/signin`, muted) + « S'abonner » (orange, `border-radius: 4px`, Barlow 600 uppercase — **pas pill**)
- Scroll > 40px : `box-shadow: 0 1px 0 var(--line)` uniquement
- Animation mount : `slide-down 0.3s ease-out`

### 2. HERO — Magazine + app mobile

- Fond : **`var(--app-bg)` `#F4F6FB`**
- Layout **asymétrique** 60/40 — pas centré template
- Badge : pastille `--blue-soft`, texte `--blue-bold`, « ✦ Lecture numérique · Congo-Brazzaville »

**H1** (Instrument Serif italic, ~72–80px) :
```
Votre
bibliothèque,        ← mot en --blue-bold
partout avec vous.
```
Animation lignes : fade-up stagger 0.1s / 0.25s / 0.4s

**Sous-titre** (DM Sans 18px, muted) — texte réel :
> Des ouvrages de Marie Kabila, Grace Mujinga et des presses congolaises.  
> Lisez en streaming ou hors-ligne — payez avec **MTN MoMo** ou **Airtel Money**.

**CTA** :
- Primary « Voir les offres → » — `--blue-bold`, radius 4px
- Secondary « Essayer gratuitement » — outline ink → hover ink fill

**Colonne droite — ancrage visuel app** :
- **Carousel / stack de 3 couvertures** réelles (images depuis `apps/mobile/assets/images/Livre/` — copier les JPG/WebP pertinents vers `public/images/marketing/covers/` si besoin)
  - Livre6.jpg → Marie Kabila
  - Livre7.jpg → Grace Mujinga
  - Livre8.jpg → autre titre catalogue
- Card KPI blanche (border `--line`, radius 8px) : « +2 000 ouvrages », chips « Académique · Littérature · Jeunesse »
- Badge « Lecture hors-ligne ✓ » fond `--green-soft`, texte `--green`
- **Tuile orange inclinée** `rotate(-2deg)` : prix mensuel API « 1 500 XOF / mois · MTN MoMo »

### 3. PARTENAIRES — Ligne journal

- Fond blanc, borders top/bottom `--line`
- Gauche : « ILS NOUS FONT CONFIANCE » (Barlow 600 10px uppercase)
- Marquee texte : **Université Marien Ngouabi**, **UCAD**, **Presses académiques congolaises**, **Éditions Femmes Leaders**, **Afrique Numérique Press**
- Séparateur « · », mask fade bords — **pas de logos SVG génériques**

### 4. FEATURES — Grille éditoriale 2×2

- Fond `--surface-warm` ou `--app-bg`
- Label orange « FONCTIONNALITÉS »
- H2 Barlow Condensed : « Tout ce qu'il faut / pour lire sereinement. » (point orange)

Cards blanches, gap 2px, radius 4px max, numéros watermark 01–04 :

| # | Titre | Texte (Congo) |
|---|-------|---------------|
| 01 | Streaming & hors-ligne | Téléchargez vos manuels UMNG et relisez dans le bus, même sans réseau. |
| 02 | Catalogue académique | Thèses, ouvrages de Marie Kabila, Grace Mujinga, presses locales. |
| 03 | Paiement MTN MoMo | Payez en **XOF** depuis votre numéro **+242 06…** — pas de Visa requis. |
| 04 | Progression synchronisée | Reprenez votre lecture sur mobile ou tablette, où vous l'avez laissée. |

Hover : `--blue-soft` (bleu) / `--green-soft` ou `--orange-pale` (orange) — **pas de glow**.

### 5. PRICING — Seule section sombre (contraste)

- Fond `--ink` `#0D0D0D`
- H2 Instrument Serif italic cream : « Choisissez votre formule. »
- Sous-titre : « MTN MoMo · Airtel Money · Sans carte bancaire »

**2 cards** max-width 860px :

**Découverte** — fond `rgba(255,255,255,0.04)`, border subtile, prix « 0 gratuit »  
**Mensuel (featured)** — fond **`--blue-bold` SOLIDE** (pas gradient), `translateY(-12px)` desktop  
- Badge orange « ✦ LE PLUS CHOISI » — pas shimmer  
- Prix depuis **`GET /plans`** (fallback 1 500 XOF si API down)  
- Bouton blanc → hover cream  

Note : « Questions ? Écrivez-nous sur WhatsApp »

### 6. TÉMOIGNAGES — Voix congolaises

Fond `--app-bg`. Citations **plausibles** pour le public cible :

| Auteur | Rôle | Citation (exemple) |
|--------|------|-------------------|
| Marie K. | Étudiante en droit, Brazzaville | « Mes cours UMNG, mes PDF et mes romans — tout au même endroit. » |
| Prof. Nzamba | Enseignant-chercheur | « Mes étudiants s'abonnent avec MTN MoMo en deux minutes. » |
| Grace M. | Lectrice, Pointe-Noire | « Je lis Grace Mujinga et d'autres autrices congolaises dans le taxi. » |

Style : Instrument Serif italic, guillemet décoratif `--blue-soft`, nom en `--orange`.

### 7. CTA FINAL — Bande orange pleine

- Fond `--orange` (solide, pas gradient)
- H2 Instrument Serif blanc : « Commencez à lire aujourd'hui. »
- Sous-titre : « Rejoignez les lecteurs de Brazzaville et de Pointe-Noire. »
- Bouton blanc, texte orange, radius 4px — **pas de scale/glow**

### 8. FOOTER — Ink sobre

- Fond `--ink`, logo clair, « Plateforme de lecture numérique · Congo »
- Liens : Offres · S'abonner · Connexion admin

---

## Animations — minimalistes

```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(-1deg); }
}
@keyframes scroll-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slide-down {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

`useScrollReveal` : threshold `0.12`, rootMargin `0px 0px -40px 0px`, classe **`is-visible`**.

```css
@media (prefers-reduced-motion: reduce) {
  .pricing-page *, .pricing-page *::before, .pricing-page *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Checklist avant merge

- [ ] Fond principal `#F4F6FB` (pas dark, pas `#F5F0E8` seul partout — alternance)
- [ ] Logo **PNG réel** avec étoiles dorées — pas logo carré inventé
- [ ] Couvertures livres **Marie Kabila / Grace Mujinga** visibles dans le hero
- [ ] Texte mentionne **MTN MoMo**, **Airtel**, **Brazzaville**, **XOF**
- [ ] Prix mensuel depuis **`GET /plans`**
- [ ] CTA → **`/subscribe`** uniquement
- [ ] Admin **non modifié**
- [ ] Responsive 375 / 768 / 1280+, `overflow-x: hidden`
- [ ] Aucune font Inter / purple gradient / rounded-3xl / orbes flous

---

## Résultat attendu

Une page qui ressemble à **l'app B LINKS passée en grand format web** : claire, culturelle, ancrée au Congo, avec le logo vivant et les couvertures qu'on reconnaît déjà.  
Quelqu'un doit penser : *« C'est la même marque que sur mon téléphone »* — pas ThemeForest, pas Linear.app, pas un SaaS américain.

---

## Commande Cursor suggérée

```
Refonds src/app/pricing et src/components/marketing/* selon docs/PRICING-VITRINE-PROMPT-V3.md.
Utilise BrandMark + bibliotech-logo.png, fond #F4F6FB, couvertures Marie Kabila/Grace Mujinga,
palette #1246D6 + #2D6B52 + #E8621A, textes Congo/MTN MoMo, GET /plans, CTA /subscribe.
Supprime EditorialLogo et tout style dark SaaS restant.
```
