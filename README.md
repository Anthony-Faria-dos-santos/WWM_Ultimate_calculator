> [!IMPORTANT]
> **This project is source-available and community-driven**, licensed under the [Business Source License 1.1](./LICENSE).
> All contributions — code, formulas, data, and bug reports — remain the collective property of their authors under the terms of the BSL 1.1.
> **Non-commercial use is free and open.** Commercial use or proprietary appropriation of this codebase requires a commercial license from the author.strictly prohibited.
>
> **Contributing?** Please read the [Contributing Guide](./CONTRIBUTING.md), follow the [Code of Conduct](./CODE_OF_CONDUCT.md), and report security issues privately via our [Security Policy](./SECURITY.md).
> Only serious, well-documented contributions and bug reports are accepted. Low-effort issues or PRs will be closed without further notice.

<div align="center">

# WWM Ultimate Calculator

**Calculateur de dégâts complet pour [Where Winds Meet](https://www.wherewindsmeetgame.com/)**

Développé pour la guilde **MoonKnights** — Serveur Global OW12

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vitest](https://img.shields.io/badge/Tests-412%20pass-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License: BSL 1.1](https://img.shields.io/badge/License-BSL_1.1-orange?style=flat-square)](https://github.com/Anthony-Faria-dos-santos/WWM_Ultimate_calculator/blob/main/LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-10.30-F69220?style=flat-square&logo=pnpm)](https://pnpm.io/)

</div>

---

## Sommaire

- [Contexte du projet](#contexte-du-projet)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Modèle de données](#modèle-de-données)
- [Système de calcul](#système-de-calcul)
- [Journal de développement](#journal-de-développement)
- [Progression](#progression)
- [Installation](#installation)
- [Scripts](#scripts)
- [Structure du projet](#structure-du-projet)
- [Tests](#tests)
- [Roadmap](#roadmap)
- [Contribuer](#contribuer)
- [Licence](#licence)

---

## Contexte du projet

Where Winds Meet est un MMORPG d'arts martiaux (wuxia) dont le système de combat repose sur des formules de calcul complexes : 9 zones multiplicatives de dégâts, des taux interdépendants (précision, critique, affinité), des talents passifs, des sets d'équipement, et des rotations de compétences.

Aucun outil existant ne couvrait l'ensemble de ces mécaniques de manière fiable. Les calculatrices communautaires se limitaient souvent à un calcul mono-hit ou ignoraient l'interaction entre les zones de dégâts.

Ce projet vise à construire un calculateur complet et vérifiable, capable de simuler des rotations entières et de comparer des builds entre eux. Il sert deux objectifs : fournir un outil utile à la guilde MoonKnights, et démontrer une démarche de développement structurée dans le cadre d'une recherche d'alternance.

---

## Stack technique

Le choix de chaque technologie répond à un besoin identifié en amont.

| Couche | Technologie | Version | Justification |
|--------|-------------|---------|---------------|
| **Framework** | Next.js (App Router) | 16 | SSR, API routes intégrées, routing fichier. Dernière version stable pour le support RSC. |
| **UI Library** | React | 19 | Concurrent features, hooks natifs, écosystème mature. |
| **Langage** | TypeScript (strict) | 5.7 | Typage exhaustif obligatoire sur un projet de calcul. Pas de `any`, interfaces explicites partout. |
| **ORM** | Prisma | 7 | Typage auto-généré, migrations versionnées, driver adapter PostgreSQL natif. |
| **Base de données** | PostgreSQL | 16 | JSONB pour les snapshots de builds, index GIN, fiabilité. Conteneur Docker local. |
| **Auth** | NextAuth v5 (beta) | 5.0-beta.30 | JWT sessions, providers OAuth (Google, Discord) + credentials bcrypt. |
| **State** | Zustand | 5 | Store léger, pas de boilerplate Redux, sélecteurs typés, persistence localStorage. |
| **Data fetching** | React Query | 5 | Cache, mutations, invalidation. Découple la logique serveur du state local. |
| **Validation** | Zod | 4 | Validation runtime des payloads API. Migration de v3 à v4 en Phase 3 (cf. journal). |
| **UI Components** | shadcn/ui + Radix | — | Composants accessibles, non-opinionated, personnalisables via Tailwind. Style New York. |
| **Styling** | Tailwind CSS | 3.4 | Utility-first, tokens CSS custom pour le design system wuxia. |
| **Charts** | Recharts | 2.15 | Composable, compatible React, adapté aux graphiques DPS/distribution. |
| **Tests** | Vitest | 3.0 | Rapide, compatible Vite, API Jest-like. Couverture v8 intégrée. |
| **E2E** | Playwright | 1.58 | Tests navigateur multi-browser, prévu en Phase 5.5. |
| **Package manager** | pnpm | 10.30 | Résolution stricte, symlinks, espace disque réduit. Ni npm ni yarn. |
| **Environnement** | WSL Ubuntu + Docker | — | PostgreSQL 16 en conteneur, développement sous WSL. |

> **Note** — Certaines dépendances sont installées mais pas encore implémentées (Stripe, Resend, Upstash Redis, Anthropic SDK). Les modèles Prisma correspondants existent dans le schema pour ne pas casser les migrations futures, mais aucune route API ne les expose. Leur intégration est planifiée en post-MVP.


---

## Architecture

Le projet suit une architecture en couches stricte. La logique métier est isolée dans `src/lib/` sans aucune dépendance React ou I/O. Les API routes orchestrent les services. Le frontend consomme les API via React Query et maintient son state local via Zustand.

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND  (Phase 4-5)                              │
│  React 19 · Zustand · React Query · shadcn/ui       │
├─────────────────────────────────────────────────────┤
│  API ROUTES  (Phase 3)                              │
│  /api/builds (CRUD)  ·  /api/calculate (6 endpoints)│
│  Validation Zod · Auth NextAuth · Rate limiting     │
├─────────────────────────────────────────────────────┤
│  SERVICES  (Phase 2)                                │
│  CombatService · ComparisonService · Simulation     │
├─────────────────────────────────────────────────────┤
│  CALCULATORS  (Phase 1)                             │
│  17 calculateurs spécialisés · 9 zones de dégâts    │
├─────────────────────────────────────────────────────┤
│  DOMAIN  (Phase 1)                                  │
│  Types TS · Constantes · Formules · Données jeu     │
├─────────────────────────────────────────────────────┤
│  PERSISTENCE  (Phase 3)                             │
│  Prisma 7 · PostgreSQL 16 · Driver adapter PrismaPg │
└─────────────────────────────────────────────────────┘
```

**Principes directeurs :**

- **Séparation stricte** : `src/lib/` ne contient aucun import React. Les calculateurs sont des fonctions pures ou des classes statiques, testables sans environnement navigateur.
- **Façade mince** : `CombatService` orchestre les 17 calculateurs sans dupliquer leur logique. Chaque calculateur a une responsabilité unique.
- **Types comme contrat** : 8 fichiers de types (Character, Skill, Combat, DPS, CombatContext, MartialArts, EquipmentSet, API) définissent les interfaces entre couches. Le frontend consomme les mêmes types que le backend.
- **Données statiques versionnées** : Les données du jeu (187 skills, 33 armes, 13 sets, 37 inner ways) sont stockées en JSON dans `src/data/` et typées via des mappers dans `src/lib/data/`.

---

## Modèle de données

### Base de données (Prisma / PostgreSQL)

Le schéma couvre l'authentification (adapter NextAuth), les builds utilisateur et le tracking d'usage pour les fonctionnalités futures.

```
User ──┬── Account (OAuth providers)
       ├── Session
       ├── Build[] (configs personnage, stats JSON, résultats)
       └── AIUsage[] (tracking futur coaching)

VerificationToken (NextAuth email verification)
RateLimit (MVP, migration Redis prévue)
```

Le modèle `Build` stocke la configuration complète d'un personnage en JSONB : stats, équipement, rotation, buffs actifs et résultats calculés. Ce choix permet de sauvegarder un snapshot exact du calcul sans normaliser une structure qui évolue avec les patchs du jeu. Le champ `shareSlug` (nanoid 8 caractères, index unique) permet le partage public de builds via URL.

Trois tiers utilisateur sont définis dans l'enum `SubscriptionTier` (FREE, PREMIUM, PREMIUM_PLUS) mais la logique d'abonnement n'est pas encore implémentée.

### Données de jeu (JSON statiques)

| Fichier | Contenu | Entrées |
|---------|---------|---------|
| `wwm_dps_data_fr.json` | Compétences, buffs, coefficients | 187 skills, 208 buffs |
| `wwm_weapons_martial_arts.json` | Armes et arts martiaux | 33 armes |
| `wwm_inner_ways.json` | Voies intérieures (passifs) | 37 voies |
| `wwm_gear_sets.json` | Sets d'équipement et bonus | 13 sets |
| `wwm_mystic_arts.json` | Arts occultes | — |
| `wwm_glossary.json` | Terminologie FR/EN/CN | — |

Ces fichiers sont la source de données brute. Les formules de calcul proviennent d'un document de référence séparé, vérifié contre les sources communautaires chinoises (NGA Forums, calculatrice yoka, Bilibili).


---

## Système de calcul

Le moteur de calcul implémente le modèle de dégâts complet de Where Winds Meet, basé sur **9 zones multiplicatives**. Ce modèle a été documenté et vérifié à partir de sources communautaires CN (NGA thread 43152002, calculatrice 燕云调律计算器, Bilibili).

### Formule maîtresse

```
D_final = D_brut × Z_crit × Z_affinité × Z_augmentation × Z_indépendante
                 × Z_réduction × Z_pénétration × Z_définition × Z_approfondissement
```

Au sein d'une même zone, les bonus sont **additifs**. Entre zones, ils sont **multiplicatifs** (同类相加，异类相乘). C'est ce qui rend la diversification entre zones plus efficace que l'empilement dans une seule.

### Les 17 calculateurs

| Calculateur | Responsabilité |
|-------------|---------------|
| `PhysicalPoolCalculator` | Pool d'attaque physique (min/max/moyenne) |
| `ElementalPoolCalculator` | Pool d'attaque élémentaire |
| `PrecisionCalculator` | Taux de touche effectif (hyperbole, cap 95%) |
| `CriticalCalculator` | Taux critique (hyperbole Crit/(Crit+938), cap 80%) |
| `AffinityCalculator` | Taux d'affinité (linéaire, cap 60%, base 1.35x, toujours ATK Max) |
| `CombatRatesCalculator` | Distribution des 4 outcomes (crit/affinité/blanc/éraflure) |
| `normalizeCombinedRates` | Compression quand crit + affinité > 100% (affinité prioritaire) |
| `DamageOutcomeCalculator` | Dégâts par type de coup avec les 9 zones |
| `BonusMultiplierCalculator` | Agrégation des zones 4-5-6-7-8-9 |
| `BonusZoneRouter` | Dispatch talents/sets vers zone de dégâts ou stat modifier |
| `TalentBonusResolver` | Résolution des talents passifs par arme (69 talents, 12 armes) |
| `SetBonusResolver` | Détection sets actifs et résolution bonus (13 sets) |
| `PreCombatStatsModifier` | Application ordonnée : sets flat → sets % → talents BaseStats |
| `BaseStatsCalculator` | Conversion des Cinq Attributs vers stats de combat |
| `ExpectedValueCalculator` | Espérance de dégâts (somme pondérée des 4 outcomes) |
| `RotationDPSCalculator` | DPS sur rotation complète (séquence de skills + cooldowns) |
| `GraduationCalculator` | Note de build E→S+ (% d'optimisation par stat) |
| `HealCalculator` | Calcul de soins (même architecture, coefficients différents) |

### Pipeline de calcul complet

```
Entrée: CharacterConfig + Equipment + Talents + Rotation
    │
    ├─ PreCombatStatsModifier ──── sets flat → sets % → talents BaseStats
    ├─ BonusZoneRouter ─────────── dispatch talents/sets → DamageZones
    ├─ Pool Calculators ────────── ATK physique + élémentaire
    ├─ Rates Calculators ───────── précision, crit, affinité → 4 outcomes
    ├─ DamageOutcome × 9 zones ── dégât par outcome × multiplicateurs
    ├─ ExpectedValue ───────────── espérance pondérée
    └─ RotationDPS ─────────────── Σ(skills × EV) / durée totale → DPS
```

Le `SimulationService` complète ce pipeline avec une simulation Monte Carlo (N itérations configurable) pour obtenir la distribution réelle des dégâts, intervalles de confiance et percentiles.


---

## Journal de développement

Ce journal retrace les décisions techniques prises au fil des phases.

### Phase 1 — Core Backend

**Décision : structure plate pour les calculateurs.** Plutôt que d'organiser par sous-dossier, tout est à plat dans `src/lib/calculators/`. Avec 17 fichiers, la navigation reste gérable et les imports sont directs. Un barrel `index.ts` expose tout.

**Découverte : le modèle 9 zones.** La documentation initiale partait sur 6 catégories de bonus. En croisant les sources CN (NGA forums, calculatrice Excel yoka), le modèle réel s'est avéré être 9 zones multiplicatives distinctes. Cette découverte a entraîné un refactor complet du `BonusMultiplierCalculator` (Phase 1.11) et l'ajout d'un enum `DamageZone`.

**Erreur corrigée : affinité.** La valeur de base était initialement codée à 1.20 (20%). La valeur réelle est **1.35 (35%)**, l'affinité utilise toujours l'ATK Max, et le coup d'affinité est **mutuellement exclusif** avec le critique. Corrections issues de vérifications croisées (NGA, Bilibili, tests in-game communautaires).

**Compression affinité-prioritaire.** Quand `crit + affinité > 100%`, l'affinité conserve sa valeur pleine et c'est le critique qui est compressé. Implémenté dans `normalizeCombinedRates.ts`.

### Phase 2 — Services & DPS

**Façade mince.** `CombatService` ne contient aucune logique de calcul propre. Il orchestre les 17 calculateurs via `calculateWithFullBuild()`. Chaque calculateur reste testable indépendamment.

**BonusZoneRouter.** Dispatch chaque bonus vers la bonne destination : `PreCombatStatsModifier` pour les stats, `BonusMultiplierCalculator` pour les zones. Les stat modifiers de sets ne passent jamais par le router.

**Ordre PreCombat :** sets flat → sets % → talents BaseStats. Les bonus flat s'appliquent avant les pourcentages, les talents en dernier.

**SimulationService : Monte Carlo.** Simulation N itérations pour valider l'espérance calculée. La moyenne simulée converge vers l'espérance — test de cohérence intégré.

### Phase 3 — Database & API

**Prisma 6 → 7.** Prisma 7 exige un driver adapter (`@prisma/adapter-pg`). Singleton avec cache global dans `src/lib/db/client.ts`.

**Zod 3 → 4.** En Zod 3, `.default("pve").optional()` ne fonctionne pas comme attendu. Zod 4 corrige ce comportement. Import via `import * as z from 'zod'`. 17 schémas migrés.

**Contrat API explicite.** 7 interfaces dans `API.types.ts`, partagées entre backend et frontend.

**Auth JWT + bcrypt.** Trois providers (Google, Discord, Credentials). `user.id` et `user.tier` injectés dans le token JWT.

**88 tests ajoutés.** 56 validation Zod, 6 auth, 14 CRUD builds (mocks), 12 calculate (vrais services). Total : 412 tests, 27 fichiers.

### Phase 4 — Frontend Integration (en cours)

**Design system : mode sombre uniquement.** Fond sombre désaturé (`#0A0E14`), accents dorés (`#D4A853`) et jade (`#4ECDC4`). Tokens HSL dans `globals.css`. Trois polices : Cinzel (titres), Inter (body), JetBrains Mono (stats).

**Stores Zustand.** `useCalculatorStore` (données personnage, résultats, comparaison) et `useUIStore` (sidebar, drawer, onglets mobile). Persistence localStorage via `zustand/persist`.

**Hooks React Query.** `useCalculate` (mutations 6 endpoints), `useBuilds` (queries CRUD avec pagination). Découplage logique serveur / state local.

### Sécurisation du repository

**Migration de licence GPL v3 → BSL 1.1.** Pour protéger le projet contre une appropriation commerciale par des tiers tout en conservant l'accès libre pour un usage non-commercial, la licence a été changée de GPLv3 en Business Source License 1.1. Les contributions existantes et futures restent sous BSL 1.1.

**Outillage de sécurité mis en place.** Trois outils complémentaires couvrent les vecteurs de risque principaux : **Dependabot** surveille les GitHub Actions pour les CVE sur les workflows CI ; **Renovate Bot** gère les mises à jour des dépendances npm/pnpm (PR automatiques, groupées par écosystème, avec fenêtre de fusion configurable) ; **GitGuardian** scanne chaque commit pour détecter les secrets exposés accidentellement. La branche `main` est protégée (revue obligatoire).

**Workflows GitHub Actions.** Deux workflows ont été ajoutés : `codeql.yml` (analyse statique de sécurité du code TypeScript, déclenchement sur push/PR + scan hebdomadaire) et `ci.yml` (build et tests sur Node 20.x et 22.x, exécuté à chaque PR pour prévenir les régressions).


---

## Progression

### Phase 1 — Core Backend

- [x] Types métier (7 fichiers : Character, Skill, Combat, DPS, CombatContext, MartialArts, EquipmentSet)
- [x] Constantes et formules (GAME_CONSTANTS, FORMULAS)
- [x] 17 calculateurs (pools, rates, outcomes, DPS, graduation, bonus zones, resolvers)
- [x] 2 services (CombatService, ComparisonService)
- [x] Utils (validation, formatting)
- [x] 296 tests unitaires, couverture > 95%
- [x] Refactor 6 → 9 zones multiplicatives (DamageZone enum)
- [x] Données jeu typées (12 armes, 69 talents, 13 sets)
- [x] Fix CVE : ajv >=6.14.0, qs >=6.14.2

### Phase 2 — Services & DPS

- [x] Pipeline complet CombatService.calculateWithFullBuild (talents + sets + stats)
- [x] BonusZoneRouter (dispatch talents/sets → zones ou stat modifiers)
- [x] SimulationService Monte Carlo (N itérations, CI, percentiles)
- [x] Tests intégration pipeline + simulation (28 tests)
- [x] Audit : 0 `any`, JSDoc FR complet, barrels propres, 324/324 tests

### Phase 3 — Database & API

- [x] Prisma Client singleton (PrismaPg driver adapter)
- [x] Schema raffiné (objective, rotation, shareSlug, level=85 pour OW12)
- [x] Migration `init_phase3` (6 tables, 17 index)
- [x] NextAuth v5 JWT (Google, Discord, Credentials bcrypt)
- [x] Types API (7 interfaces contrat frontend↔backend)
- [x] 17 schémas Zod (migration Zod 3 → 4)
- [x] Routes Builds CRUD (pagination, ownership, shareSlug, views)
- [x] Routes Calculate (6 endpoints publics)
- [x] Middleware sécurité (headers)
- [x] Seed data (user test + build démo)
- [x] 88 tests API (validation, auth, builds, calculate)

### Phase 4 — Frontend Integration (en cours)

- [x] Design system tokens + shadcn/ui + fonts + layout
- [x] Stores Zustand (calculatorStore, uiStore)
- [x] React Query hooks (useCalculate, useBuilds)
- [ ] Pages et routing (Landing, Calculator, Dashboard, Auth)
- [ ] Providers wrapper (QueryProvider, SessionProvider)
- [ ] Helpers frontend (formatters, transformers, constants)
- [ ] Tests stores + hooks

### Phase 5 — UX/UI & Production

- [ ] Landing page wuxia (hero parallax, features, schools carousel)
- [ ] Composants calculateur (Equipment Grid, Stats Panel, DPS Dashboard)
- [ ] Comparison Panel + swap équipement
- [ ] Rotation Builder (drag & drop)
- [ ] Dashboard utilisateur (builds grid)
- [ ] Auth pages (NextAuth)
- [ ] Build sharing (public viewer)
- [ ] Responsive mobile
- [ ] Animations scroll + parallax
- [ ] Performance (code splitting, React Query caching)
- [ ] SEO (metadata, OG images)
- [ ] Tests E2E Playwright
- [ ] CI/CD GitHub Actions
- [ ] Déploiement Vercel + Railway

> Pour la liste détaillée des tâches ouvertes aux contributions, voir [TODO.md](./TODO.md).


---

## Installation

**Prérequis** : Node.js >= 20, pnpm >= 10, Docker (pour PostgreSQL).

```bash
# Cloner le repository
git clone https://github.com/Anthony-Faria-dos-santos/WWM_Ultimate_calculator.git
cd WWM_Ultimate_calculator

# Installer les dépendances
pnpm install

# Configurer l'environnement
cp .env.example .env
# Editer .env avec vos variables (DATABASE_URL, NEXTAUTH_SECRET, OAuth credentials)

# Lancer PostgreSQL via Docker
docker run -d --name wwm-postgres \
  -e POSTGRES_USER=wwm \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=wwm_calculator \
  -p 5432:5432 \
  postgres:16

# Reporter les valeurs dans votre .env (cf. .env.example)

# Générer le client Prisma et appliquer les migrations
pnpm db:generate
pnpm db:migrate

# Seed des données de test
pnpm db:seed

# Lancer le serveur de développement
pnpm dev
```

---

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement (Next.js) |
| `pnpm build` | Build production (génère Prisma + compile Next.js) |
| `pnpm start` | Serveur production |
| `pnpm lint` | Lint ESLint |
| `pnpm type-check` | Vérification TypeScript (tsc --noEmit) |
| `pnpm test` | Tests Vitest (watch mode) |
| `pnpm test:coverage` | Tests avec rapport de couverture (v8) |
| `pnpm validate:translations` | Vérifie que seuls les champs traduction sont modifiés |
| `pnpm db:generate` | Génération du client Prisma |
| `pnpm db:migrate` | Appliquer les migrations Prisma |
| `pnpm db:seed` | Seed données de test |
| `pnpm db:studio` | Interface Prisma Studio |


---

## Structure du projet

```
wwm-ultimate-calculator/
├── .github/
│   └── ISSUE_TEMPLATE/          # Bug report, feature request templates
├── prisma/
│   ├── schema.prisma            # 6 modèles, 17 index
│   └── seed.ts                  # User test + build démo
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # NextAuth route handler
│   │   │   ├── builds/              # CRUD builds (GET, POST, PUT, DELETE)
│   │   │   └── calculate/           # 6 endpoints (damage, rotation, expected, compare, marginal, graduation)
│   │   ├── globals.css          # Design system tokens (HSL)
│   │   ├── layout.tsx           # Root layout + fonts
│   │   └── page.tsx             # Landing page
│   ├── data/                    # JSON données jeu (10 fichiers)
│   ├── lib/
│   │   ├── auth/                # NextAuth config, types session, helpers
│   │   ├── calculators/         # 17 calculateurs + barrel
│   │   ├── constants/           # GAME_CONSTANTS, FORMULAS
│   │   ├── data/                # Mappers TypeScript pour les JSON (armes, sets, constantes)
│   │   ├── db/                  # Prisma Client singleton
│   │   ├── hooks/               # React Query hooks (useCalculate, useBuilds)
│   │   ├── services/            # CombatService, ComparisonService, SimulationService
│   │   ├── stores/              # Zustand (calculatorStore, uiStore)
│   │   ├── types/               # 8 fichiers de types (domain + API)
│   │   ├── utils/               # Validation, formatting
│   │   └── validation/          # 17 schémas Zod
├── tests/
│   ├── api/                     # 88 tests (validation, auth, builds, calculate)
│   ├── calculators/             # Tests unitaires des 17 calculateurs
│   ├── services/                # Tests intégration (pipeline, simulation)
│   ├── utils/                   # Tests utilitaires
│   └── fixtures/                # Données de test partagées
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── TODO.md                      # Tâches ouvertes aux contributions
├── docs/
│   └── contributing/
│       └── TRANSLATION_GUIDE.md # Guide pour les traducteurs
├── scripts/
│   └── validate-translations.py # Validation des contributions i18n
├── .env.example
├── vitest.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Tests

**412 tests** répartis sur **27 fichiers**, 0 échec.

| Catégorie | Fichiers | Tests | Couverture |
|-----------|----------|-------|------------|
| Calculateurs | 17 | 296 | > 95% |
| Services (intégration) | 4 | 28 | Pipeline complet |
| API (validation, auth, CRUD, calculate) | 4 | 88 | Mocks Prisma + NextAuth |
| Utilitaires | 2 | — | Validation, formatting |

**Stratégie de test par phase :**

- **Phase 1-2** : tests unitaires purs. Chaque calculateur testé individuellement avec des fixtures partagées. Cas limites systématiques (valeurs zéro, caps atteints, overflow).
- **Phase 3** : tests unitaires avec mocks. Prisma, NextAuth et NextRequest sont mockés. Les routes `calculate` utilisent les vrais services (pas de mock) pour valider la cohérence bout en bout.
- **Phase 5.5 (planifié)** : tests E2E Playwright avec vraie base PostgreSQL.

```bash
pnpm test                # Tous les tests
pnpm test:coverage       # Avec couverture
```


---

## Roadmap

### v0.1 — MVP (en cours)

- [x] Moteur de calcul complet (9 zones, 17 calculateurs)
- [x] API REST (CRUD builds + 6 endpoints calcul)
- [x] Auth (OAuth + credentials)
- [ ] Interface calculateur (3 colonnes, equipment grid, DPS dashboard)
- [ ] Comparaison d'équipement en temps réel
- [ ] Rotation builder (drag & drop)
- [ ] Dashboard builds utilisateur
- [ ] Déploiement

### v1.0 — Release

- [ ] Landing page wuxia (parallax, schools carousel)
- [ ] Responsive mobile complet (tabs bottom navigation)
- [ ] Tests E2E Playwright
- [ ] CI/CD GitHub Actions
- [ ] SEO et OG images
- [ ] Performance (code splitting, lazy loading)

### v2.0 — Évolutions

- [ ] Multi-langue (FR, EN, CN)
- [ ] Import de builds depuis le jeu
- [ ] API publique documentée
- [ ] Classements DPS communautaires
- [ ] Bot Discord MoonKnights
- [ ] Coaching par IA (analyse de build)
- [ ] Système d'abonnement (Stripe)

---

## Contribuer

Les contributions sont les bienvenues. Avant de commencer :

1. Lire le [Contributing Guide](./CONTRIBUTING.md) pour le workflow (fork, branch, PR vers `dev`)
2. Consulter le [TODO.md](./TODO.md) pour les tâches ouvertes et leur priorité
3. Pour les traductions : lire le [Translation Guide](./docs/contributing/TRANSLATION_GUIDE.md)
4. Respecter le [Code of Conduct](./CODE_OF_CONDUCT.md)
5. Signaler les failles de sécurité via la [Security Policy](./SECURITY.md), jamais en issue publique

Les issues labellisées `good first issue` et `help wanted` sont un bon point d'entrée.

---

## Notes

- Le projet cible le serveur **Global OW12** (level cap 85). Le support du serveur CN OW15 (level cap 100) est prévu via un système de configuration multi-serveur.
- Les formules de calcul sont documentées dans un fichier de référence dédié (v2.0, 29 sections), vérifié contre 12 sources communautaires avec un niveau de confiance 4-5/5 sur chaque formule.
- Conventional Commits en anglais sur toutes les branches. Merges en `--no-ff` systématique pour conserver l'historique des feature branches.

---

## Licence

This project is licensed under the [GNU General Public License v3.0](./LICENSE).
Copyright © 2026 Anthony Faria Dos Santos — all forks and derivative works must remain open source under the same terms.
