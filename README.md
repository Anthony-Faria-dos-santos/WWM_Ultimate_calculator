<div align="center">

# WWM Ultimate Calculator

**Calculateur de dégâts complet pour [Where Winds Meet](https://wherewindsmeet.com/)**

Développé pour la guilde **MoonKnights** — Serveur Global OW12

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Tests-412%20pass-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## Sommaire

- [Contexte](#contexte)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Modèle de données](#modèle-de-données)
- [Système de calcul](#système-de-calcul)
- [Tests](#tests)
- [Progression](#progression)
- [Journal de développement](#journal-de-développement)
- [Installation](#installation)
- [Scripts](#scripts)
- [Licence](#licence)

---

## Contexte

Where Winds Meet est un MMORPG d'arts martiaux (wuxia) dont le système de combat repose sur des formules de calcul complexes : 9 zones multiplicatives de dégâts, des taux interdépendants (précision, critique, affinité), des talents passifs, des sets d'équipement, et des rotations de compétences.

Aucun outil existant ne couvrait l'ensemble de ces mécaniques de manière fiable. Ce projet vise à construire un calculateur complet et vérifiable, capable de simuler des rotations entières et de comparer des builds entre eux. Il sert deux objectifs : fournir un outil utile à la guilde MoonKnights, et démontrer une démarche de développement structurée dans le cadre d'une recherche d'alternance.

## Stack technique

| Couche | Technologie | Version | Justification |
|--------|-------------|---------|---------------|
| **Framework** | Next.js (App Router) | 16 | SSR, API routes intégrées, routing fichier |
| **UI Library** | React | 19 | Concurrent features, hooks natifs, écosystème mature |
| **Langage** | TypeScript (strict) | 5.7 | Typage exhaustif sur un projet de calcul. Pas de `any`, interfaces explicites. |
| **ORM** | Prisma | 7 | Typage auto-généré, migrations versionnées, driver adapter PostgreSQL natif |
| **Base de données** | PostgreSQL | 16 | JSONB pour les snapshots de builds, index GIN. Conteneur Docker local. |
| **Auth** | NextAuth v5 (beta) | 5.0-beta.30 | JWT sessions, providers OAuth (Google, Discord) + credentials bcrypt |
| **State** | Zustand | 5 | Store léger, sélecteurs typés, persistence localStorage |
| **Data fetching** | React Query | 5 | Cache, mutations, invalidation |
| **Validation** | Zod | 4 | Validation runtime des payloads API. Migration v3→v4 en Phase 3. |
| **UI** | shadcn/ui + Tailwind CSS | 3.4 | Composants accessibles, utility-first |
| **Charts** | Recharts | 2.15 | Composable, compatible React |
| **Tests** | Vitest | 3.0 | Compatible Vite, couverture v8 |
| **Package manager** | pnpm | 10.30 | Résolution stricte, symlinks |

## Architecture

```
┌─────────────────────────────────────────────────────┐
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

**Principes :** séparation stricte (`src/lib/` = zéro React), façade mince (CombatService orchestre sans dupliquer), types comme contrat (8 fichiers partagés entre couches).

## Modèle de données

Le modèle `Build` stocke la configuration complète d'un personnage en JSONB : stats, équipement, rotation, buffs actifs et résultats calculés. Le champ `shareSlug` (nanoid 8 caractères, index unique) permet le partage public de builds via URL.

```
User ──┬── Account (OAuth providers)
       ├── Session
       ├── Build[] (configs personnage, stats JSON, résultats)
       └── AIUsage[] (tracking futur)
```

Données de jeu en JSON statiques (187 skills, 33 armes, 13 sets, 37 inner ways) dans `src/data/`, typées via mappers dans `src/lib/data/`.

## Système de calcul

### Formule maîtresse (9 zones multiplicatives)

```
D_final = D_brut × Z_crit × Z_affinité × Z_augmentation × Z_indépendante
                 × Z_réduction × Z_pénétration × Z_définition × Z_approfondissement
```

Au sein d'une même zone, les bonus sont **additifs**. Entre zones, ils sont **multiplicatifs**.

### Pipeline de calcul

```
Entrée: CharacterConfig + Equipment + Talents + Rotation
    ├─ PreCombatStatsModifier ──── sets flat → sets % → talents BaseStats
    ├─ BonusZoneRouter ─────────── dispatch talents/sets → DamageZones
    ├─ Pool Calculators ────────── ATK physique + élémentaire
    ├─ Rates Calculators ───────── précision, crit, affinité → 4 outcomes
    ├─ DamageOutcome × 9 zones ── dégât par outcome × multiplicateurs
    ├─ ExpectedValue ───────────── espérance pondérée
    └─ RotationDPS ─────────────── Σ(skills × EV) / durée totale → DPS
```

## Tests

**412 tests** sur **27 fichiers**, 0 échec.

| Catégorie | Fichiers | Tests | Détail |
|-----------|----------|-------|--------|
| Calculateurs | 17 | 296 | Couverture > 95% |
| Services (intégration) | 4 | 28 | Pipeline complet, Monte Carlo |
| API (validation, auth, CRUD, calculate) | 4 | 88 | Mocks Prisma + NextAuth |

## Progression

### Phase 1 — Core Backend

- [x] Types métier (7 fichiers)
- [x] Constantes et formules
- [x] 17 calculateurs
- [x] 2 services (CombatService, ComparisonService)
- [x] 296 tests, couverture > 95%
- [x] Refactor 6 → 9 zones multiplicatives
- [x] Données jeu typées (12 armes, 69 talents, 13 sets)

### Phase 2 — Services & DPS

- [x] Pipeline complet CombatService.calculateWithFullBuild
- [x] BonusZoneRouter
- [x] SimulationService Monte Carlo
- [x] Tests intégration (28 tests)
- [x] Audit : 0 `any`, JSDoc FR complet, 324/324 tests

### Phase 3 — Database & API

- [x] Prisma Client singleton (PrismaPg driver adapter)
- [x] Schema raffiné (objective, rotation, shareSlug, level=85)
- [x] NextAuth v5 JWT (Google, Discord, Credentials bcrypt)
- [x] 17 schémas Zod (migration Zod 3 → 4)
- [x] Routes Builds CRUD (pagination, ownership, shareSlug, views)
- [x] Routes Calculate (6 endpoints publics)
- [x] Middleware sécurité, seed data
- [x] 88 tests API

### Phase 4 — Frontend Integration (prochaine)

- [ ] Design system (tokens wuxia, fonts, shadcn/ui)
- [ ] Stores Zustand
- [ ] React Query hooks
- [ ] Pages et routing
- [ ] Composants calculateur

## Journal de développement

### Phase 1

**Découverte : le modèle 9 zones.** La documentation initiale partait sur 6 catégories de bonus. En croisant les sources CN, le modèle réel s'est avéré être 9 zones multiplicatives. Refactor complet du `BonusMultiplierCalculator` (Phase 1.11).

**Erreur corrigée : affinité.** Valeur de base 1.20 → 1.35, utilise toujours ATK Max, mutuellement exclusif avec le critique.

**Compression affinité-prioritaire.** Quand `crit + affinité > 100%`, l'affinité conserve sa valeur pleine et le critique est compressé.

### Phase 2

**Façade mince.** `CombatService` orchestre les 17 calculateurs sans logique propre.

**BonusZoneRouter.** Dispatch talents/sets vers stats ou zones. Les stat modifiers de sets ne passent pas par le router.

**Monte Carlo.** Simulation N itérations pour valider l'espérance. La moyenne converge vers l'espérance calculée.

### Phase 3

**Prisma 6 → 7.** Prisma 7 exige un driver adapter (`@prisma/adapter-pg`). Singleton avec cache global.

**Zod 3 → 4.** En Zod 3, `.default("pve").optional()` ne fonctionne pas. Zod 4 corrige ce comportement. Import via `import * as z from 'zod'`.

**Contrat API explicite.** 7 interfaces dans `API.types.ts`, partagées entre backend et frontend.

**Auth JWT + bcrypt.** Trois providers (Google, Discord, Credentials). `user.id` et `user.tier` injectés dans le token JWT.

**88 tests ajoutés.** 56 validation Zod, 6 auth, 14 CRUD builds (mocks), 12 calculate (vrais services).

**Report E2E.** Validation fonctionnelle complète reportée en Phase 5.5 avec Playwright.

## Installation

```bash
pnpm install
cp .env.example .env
# Configurer DATABASE_URL, NEXTAUTH_SECRET, OAuth credentials

# PostgreSQL via Docker
docker run -d --name wwm-postgres \
  -e POSTGRES_USER=wwm -e POSTGRES_PASSWORD=wwm_secret -e POSTGRES_DB=wwm_calculator \
  -p 5432:5432 postgres:16

pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build production (Prisma generate + Next.js) |
| `pnpm type-check` | Vérification TypeScript |
| `pnpm test` | Tests Vitest (watch mode) |
| `pnpm test:coverage` | Tests avec couverture v8 |
| `pnpm db:generate` | Génération client Prisma |
| `pnpm db:migrate` | Appliquer les migrations |
| `pnpm db:seed` | Seed données de test |

## Licence

[MIT](LICENSE) — Anthony Faria Dos Santos, 2026

Développé pour la guilde **MoonKnights** et la communauté Where Winds Meet.
