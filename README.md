# WWM Ultimate Calculator

Calculateur de dégâts complet pour [Where Winds Meet](https://wherewindsmeet.com/).

Développé pour la guilde **MoonKnights** — Serveur Global OW12.

---

## Contexte

Where Winds Meet est un MMORPG wuxia dont le système de combat repose sur des formules complexes : zones multiplicatives de dégâts, taux interdépendants (précision, critique, affinité), talents passifs et sets d'équipement. Ce projet vise à construire un calculateur fiable couvrant l'ensemble de ces mécaniques, et sert également de projet vitrine dans le cadre d'une recherche d'alternance.

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
| Tests | Vitest | 3.0 | Compatible Vite, couverture v8 |
| Package manager | pnpm | 10.30 | Résolution stricte, symlinks |

## Architecture

Le projet suit une architecture en couches. La logique métier est isolée dans `src/lib/` sans dépendance React.

```
┌──────────────────────────────────────┐
│  SERVICES  (Phase 2 — à venir)       │
│  CombatService · ComparisonService   │
├──────────────────────────────────────┤
│  CALCULATORS  (Phase 1 — en cours)   │
│  Pools, Rates, Outcomes, DPS         │
├──────────────────────────────────────┤
│  DOMAIN                              │
│  Types TS · Constantes · Formules    │
└──────────────────────────────────────┘
```

### Calculateurs implémentés

| Calculateur | Responsabilité |
|-------------|---------------|
| `PhysicalPoolCalculator` | Pool d'attaque physique (min/max/moyenne) |
| `ElementalPoolCalculator` | Pool d'attaque élémentaire |
| `PrecisionCalculator` | Taux de touche (hyperbole, cap 95%) |
| `CriticalCalculator` | Taux critique (Crit/(Crit+938), cap 80%) |
| `AffinityCalculator` | Taux d'affinité (linéaire, cap 60%, base 1.35x) |
| `CombatRatesCalculator` | Distribution des 4 outcomes |
| `normalizeCombinedRates` | Compression quand crit + affinité > 100% |
| `DamageOutcomeCalculator` | Dégâts par type de coup |
| `BonusMultiplierCalculator` | Agrégation des zones de bonus |
| `HealCalculator` | Calcul de soins |
| `BaseStatsCalculator` | Conversion Cinq Attributs → stats combat |
| `RotationDPSCalculator` | DPS sur rotation complète |
| `ExpectedValueCalculator` | Espérance de dégâts pondérée |
| `GraduationCalculator` | Note de build E→S+ |

### Services

- `CombatService` : façade mince qui orchestre les calculateurs dans le bon ordre. Pas de logique propre.
- `ComparisonService` : comparaison de deux builds, calcul des gains marginaux par stat.

## Progression

### Phase 1 — Core Backend

- [x] Types métier (7 fichiers : Character, Skill, Combat, DPS, CombatContext, MartialArts, EquipmentSet)
- [x] Constantes et formules (GAME_CONSTANTS, FORMULAS)
- [x] 14 calculateurs (pools, rates, outcomes, DPS, graduation, bonus)
- [x] 2 services (CombatService, ComparisonService)
- [x] Utils (validation, formatting)
- [ ] Tests unitaires
- [ ] Données jeu (armes, talents, sets)

### Phase 2 — Services & DPS

- [ ] Pipeline complet talents + sets
- [ ] Simulation Monte Carlo
- [ ] Tests intégration

## Journal de développement

### Phase 1

**Décision : structure plate pour les calculateurs.** Avec 14 fichiers, la navigation reste gérable. Un barrel `index.ts` expose tout. Pas besoin de sous-dossiers.

**Erreur corrigée : affinité.** La valeur de base était codée à 1.20 (20%). La valeur réelle est 1.35 (35%), l'affinité utilise toujours l'ATK Max, et le coup d'affinité est mutuellement exclusif avec le critique. Corrections issues de sources CN (NGA, Bilibili).

**Choix : compression affinité-prioritaire.** Quand `taux_critique + taux_affinité > 100%`, l'affinité conserve sa valeur pleine et c'est le critique qui est compressé. Implémenté dans `normalizeCombinedRates.ts`.

## Installation

```bash
pnpm install
pnpm dev
```

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build production |
| `pnpm type-check` | Vérification TypeScript |
| `pnpm test` | Tests Vitest |

## Licence

[MIT](LICENSE)
