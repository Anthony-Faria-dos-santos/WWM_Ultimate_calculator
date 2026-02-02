# WWM Ultimate Calculator

Calculateur de dégâts complet pour [Where Winds Meet](https://wherewindsmeet.com/).

Développé pour la guilde **MoonKnights** — Serveur Global OW12.

---

## Contexte

Where Winds Meet est un MMORPG wuxia dont le système de combat repose sur des formules complexes : zones multiplicatives de dégâts, taux interdépendants (précision, critique, affinité), talents passifs et sets d'équipement. Ce projet vise à construire un calculateur fiable couvrant l'ensemble de ces mécaniques.

## Stack technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Framework | Next.js 16 (App Router) | SSR, API routes intégrées, routing fichier |
| UI Library | React 19 | Hooks natifs, écosystème mature |
| Langage | TypeScript 5.7 strict | Typage exhaustif sur un projet de calcul |
| ORM | Prisma 7 | Typage auto-généré, migrations versionnées |
| Base de données | PostgreSQL 16 | JSONB pour les builds, index GIN |
| State | Zustand 5 | Store léger, pas de boilerplate Redux |
| Validation | Zod | Validation runtime des payloads API |
| UI | shadcn/ui + Tailwind CSS 3.4 | Composants accessibles, utility-first |
| Tests | Vitest | Compatible Vite, API Jest-like |
| Package manager | pnpm | Résolution stricte, symlinks |

## Progression

### Phase 1 — Core Backend (en cours)

- [x] Types métier (Character, Skill, Combat, DPS)
- [x] Constantes de jeu (GAME_CONSTANTS, FORMULAS)
- [ ] Calculateurs
- [ ] Services
- [ ] Tests unitaires

## Installation

```bash
pnpm install
pnpm dev
```

## Licence

[MIT](LICENSE)
