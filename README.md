<div align="center">

# WWM Ultimate Calculator

**Calculateur de dégâts complet pour [Where Winds Meet](https://wherewindsmeet.com/)**

Développé pour la guilde **MoonKnights** — Serveur Global OW12

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-296%20pass-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## Contexte

Where Winds Meet est un MMORPG wuxia dont le système de combat repose sur des formules complexes : zones multiplicatives de dégâts, taux interdépendants (précision, critique, affinité), talents passifs et sets d'équipement. Aucun outil existant ne couvrait l'ensemble de ces mécaniques de manière fiable. Ce projet vise à construire un calculateur complet et vérifiable, capable de simuler des rotations entières et de comparer des builds entre eux.

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

Le projet suit une architecture en couches stricte. La logique métier est isolée dans `src/lib/` sans aucune dépendance React ou I/O. Les calculateurs sont des fonctions pures ou des classes statiques, testables sans environnement navigateur.

```
┌──────────────────────────────────────┐
│  SERVICES                            │
│  CombatService · ComparisonService   │
├──────────────────────────────────────┤
│  CALCULATORS  (17 calculateurs)      │
│  Pools, Rates, Outcomes, DPS, Bonus  │
├──────────────────────────────────────┤
│  DOMAIN                              │
│  Types TS · Constantes · Formules    │
│  Données jeu (armes, talents, sets)  │
└──────────────────────────────────────┘
```

### Les 17 calculateurs

| Calculateur | Responsabilité |
|-------------|---------------|
| `PhysicalPoolCalculator` | Pool d'attaque physique (min/max/moyenne) |
| `ElementalPoolCalculator` | Pool d'attaque élémentaire |
| `PrecisionCalculator` | Taux de touche (hyperbole, cap 95%) |
| `CriticalCalculator` | Taux critique (Crit/(Crit+938), cap 80%) |
| `AffinityCalculator` | Taux d'affinité (linéaire, cap 60%, base 1.35x, toujours ATK Max) |
| `CombatRatesCalculator` | Distribution des 4 outcomes (crit/affinité/blanc/éraflure) |
| `normalizeCombinedRates` | Compression quand crit + affinité > 100% (affinité prioritaire) |
| `DamageOutcomeCalculator` | Dégâts par type de coup avec zones multiplicatives |
| `BonusMultiplierCalculator` | Agrégation des zones de bonus |
| `TalentBonusResolver` | Résolution talents passifs par arme (69 talents, 12 armes) |
| `SetBonusResolver` | Détection sets actifs et résolution bonus (13 sets) |
| `PreCombatStatsModifier` | Application ordonnée : sets flat → sets % → talents BaseStats |
| `BaseStatsCalculator` | Conversion Cinq Attributs → stats combat |
| `ExpectedValueCalculator` | Espérance de dégâts (somme pondérée des 4 outcomes) |
| `RotationDPSCalculator` | DPS sur rotation complète (séquence de skills + cooldowns) |
| `GraduationCalculator` | Note de build E→S+ (% d'optimisation par stat) |
| `HealCalculator` | Calcul de soins |

### Données de jeu

| Fichier | Contenu | Entrées |
|---------|---------|---------|
| `wwm_dps_data_fr.json` | Compétences, buffs, coefficients | 187 skills, 208 buffs |
| `wwm_weapons_martial_arts.json` | Armes et arts martiaux | 33 armes |
| `wwm_inner_ways.json` | Voies intérieures (passifs) | 37 voies |
| `wwm_gear_sets.json` | Sets d'équipement et bonus | 13 sets |

## Tests

**296 tests** unitaires, couverture > 95%. Chaque calculateur testé individuellement avec fixtures partagées. Cas limites systématiques (valeurs zéro, caps atteints, overflow).

```bash
pnpm test
pnpm test:coverage
```

## Progression

### Phase 1 — Core Backend

- [x] Types métier (7 fichiers)
- [x] Constantes et formules
- [x] 17 calculateurs
- [x] 2 services (CombatService, ComparisonService)
- [x] Utils (validation, formatting)
- [x] 296 tests unitaires, couverture > 95%
- [x] Données jeu typées (12 armes, 69 talents, 13 sets)
- [x] Fix CVE : ajv >=6.14.0, qs >=6.14.2

### Phase 2 — Services & DPS (prochaine)

- [ ] Pipeline complet talents + sets dans CombatService
- [ ] Simulation Monte Carlo
- [ ] Tests intégration

## Journal de développement

### Phase 1

**Décision : structure plate pour les calculateurs.** Avec 17 fichiers, un barrel `index.ts` suffit. Pas de sous-dossiers.

**Erreur corrigée : affinité.** Valeur de base 1.20 → 1.35, utilise toujours ATK Max, mutuellement exclusif avec le critique. Sources : NGA, Bilibili, tests communautaires.

**Choix : compression affinité-prioritaire.** Quand `crit + affinité > 100%`, l'affinité conserve sa valeur pleine et le critique est compressé. Implémenté dans `normalizeCombinedRates.ts`.

**Ordre PreCombat :** sets flat → sets % → talents BaseStats. Les bonus flat s'appliquent avant les pourcentages, les talents en dernier pour bénéficier de l'ensemble.

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

[MIT](LICENSE)
