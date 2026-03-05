> [!IMPORTANT]
> **This project is open source and community-driven**, licensed under the [GNU General Public License v3.0](./LICENSE).
> All contributions — code, formulas, data, and bug reports — remain the collective property of their authors under the terms of the GPL v3.
> Any fork or derivative work **must remain open source** under the same license. Commercial use or proprietary appropriation of this codebase is strictly prohibited.
>
> **Contributing?** Please read the [Contributing Guide](./CONTRIBUTING.md), follow the [Code of Conduct](./CODE_OF_CONDUCT.md), and report security issues privately via our [Security Policy](./SECURITY.md).
> Only serious, well-documented contributions and bug reports are accepted. Low-effort issues or PRs will be closed without further notice.

<div align="center">

# WWM Ultimate Calculator

**Calculateur de dégâts complet pour [Where Winds Meet](https://www.wherewindsmeetgame.com/)**

Développé pour la guilde **MoonKnights** — Serveur Global OW12

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-324%20pass-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0)

</div>

---

## Contexte

Where Winds Meet est un MMORPG wuxia dont le système de combat repose sur des formules complexes : 9 zones multiplicatives de dégâts, des taux interdépendants (précision, critique, affinité), des talents passifs, des sets d'équipement, et des rotations de compétences. Aucun outil existant ne couvrait l'ensemble de ces mécaniques de manière fiable. Ce projet vise à construire un calculateur complet et vérifiable, capable de simuler des rotations entières et de comparer des builds entre eux.

## Stack technique

| Couche | Technologie | Version | Justification |
|--------|-------------|---------|---------------|
| Framework | Next.js (App Router) | 16 | SSR, API routes intégrées, routing fichier |
| UI Library | React | 19 | Hooks natifs, écosystème mature |
| Langage | TypeScript (strict) | 5.7 | Typage exhaustif sur un projet de calcul. Pas de `any`. |
| ORM | Prisma | 7 | Typage auto-généré, migrations versionnées, driver adapter PostgreSQL |
| Base de données | PostgreSQL | 16 | JSONB pour les builds, conteneur Docker local |
| State | Zustand | 5 | Store léger, sélecteurs typés, persistence localStorage |
| Validation | Zod | 3 | Validation runtime des payloads API |
| UI | shadcn/ui + Tailwind CSS | 3.4 | Composants accessibles, utility-first |
| Charts | Recharts | 2.15 | Composable, compatible React |
| Tests | Vitest | 3.0 | Compatible Vite, couverture v8 |
| Package manager | pnpm | 10.30 | Résolution stricte, symlinks |

## Architecture

Architecture en couches stricte. La logique métier dans `src/lib/` n'a aucune dépendance React ou I/O.

```
┌──────────────────────────────────────┐
│  SERVICES                            │
│  CombatService · ComparisonService   │
│  SimulationService (Monte Carlo)     │
├──────────────────────────────────────┤
│  CALCULATORS  (17 calculateurs)      │
│  9 zones de dégâts multiplicatives   │
├──────────────────────────────────────┤
│  DOMAIN                              │
│  Types TS · Constantes · Formules    │
│  Données jeu (armes, talents, sets)  │
└──────────────────────────────────────┘
```

## Système de calcul

Le moteur de calcul implémente le modèle de dégâts complet de Where Winds Meet, basé sur **9 zones multiplicatives**. Ce modèle a été documenté et vérifié à partir de sources communautaires CN (NGA thread 43152002, calculatrice yoka, Bilibili).

### Formule maîtresse

```
D_final = D_brut × Z_crit × Z_affinité × Z_augmentation × Z_indépendante
                 × Z_réduction × Z_pénétration × Z_définition × Z_approfondissement
```

Au sein d'une même zone, les bonus sont **additifs**. Entre zones, ils sont **multiplicatifs**. C'est ce qui rend la diversification entre zones plus efficace que l'empilement dans une seule.

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

Le `SimulationService` complète ce pipeline avec une simulation Monte Carlo (N itérations configurable) pour obtenir la distribution réelle des dégâts, intervalles de confiance et percentiles.

## Tests

**324 tests** sur 23 fichiers, 0 échec, couverture > 95%.

| Catégorie | Tests | Détail |
|-----------|-------|--------|
| Calculateurs | 296 | Chaque calculateur testé individuellement, cas limites |
| Services (intégration) | 28 | Pipeline complet, Monte Carlo, comparaison |

## Progression

### Phase 1 — Core Backend

- [x] Types métier (7 fichiers)
- [x] Constantes et formules
- [x] 17 calculateurs (pools, rates, outcomes, DPS, graduation, bonus zones, resolvers)
- [x] 2 services (CombatService, ComparisonService)
- [x] Utils (validation, formatting)
- [x] 296 tests unitaires, couverture > 95%
- [x] Refactor 6 → 9 zones multiplicatives (DamageZone enum)
- [x] Données jeu typées (12 armes, 69 talents, 13 sets)

### Phase 2 — Services & DPS

- [x] Pipeline complet CombatService.calculateWithFullBuild (talents + sets + stats)
- [x] BonusZoneRouter (dispatch talents/sets → zones ou stat modifiers)
- [x] SimulationService Monte Carlo (N itérations, CI, percentiles)
- [x] Tests intégration pipeline + simulation (28 tests)
- [x] Audit : 0 `any`, JSDoc FR complet, barrels propres, 324/324 tests

### Phase 3 — Database & API (prochaine)

- [ ] Prisma Client singleton + schema raffiné
- [ ] NextAuth v5 (Google, Discord, Credentials)
- [ ] API Routes (CRUD builds + 6 endpoints calcul)
- [ ] Validation Zod
- [ ] Tests API

## Journal de développement

### Phase 1

**Découverte : le modèle 9 zones.** La documentation initiale partait sur 6 catégories de bonus. En croisant les sources CN (NGA forums, calculatrice Excel yoka), le modèle réel s'est avéré être 9 zones multiplicatives distinctes. Refactor complet du `BonusMultiplierCalculator` et ajout d'un enum `DamageZone`.

**Erreur corrigée : affinité.** Valeur de base 1.20 → 1.35, utilise toujours ATK Max, mutuellement exclusif avec le critique. Sources : NGA, Bilibili, tests communautaires.

**Compression affinité-prioritaire.** Quand `crit + affinité > 100%`, l'affinité conserve sa valeur pleine et le critique est compressé.

### Phase 2

**Orchestrateur.** `CombatService` ne contient aucune logique de calcul propre. Il orchestre les 17 calculateurs via `calculateWithFullBuild()`.

**BonusZoneRouter.** Dispatch chaque bonus talent/set vers la bonne destination : `PreCombatStatsModifier` pour les stats, `BonusMultiplierCalculator` pour les zones. Les stat modifiers de sets ne passent pas par le router.

**Monte Carlo.** Simulation N itérations pour valider l'espérance calculée. La moyenne simulée converge vers l'espérance — test de cohérence intégré.

**Condensation des prompts.** Doc initiale : 17 prompts Phase 2. Travail réel : 5 prompts, le reste existait déjà depuis la Phase 1.

## Installation

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build production |
| `pnpm type-check` | Vérification TypeScript |
| `pnpm test` | Tests Vitest (watch mode) |
| `pnpm test:coverage` | Tests avec couverture v8 |

## Licence

This project is licensed under the [GNU General Public License v3.0](./LICENSE).
Copyright © 2026 Anthony Faria Dos Santos — all forks and derivative works must remain open source under the same terms.
