# TODO — WWM Ultimate Calculator

Liste des tâches ouvertes, classées par priorité et domaine.
Chaque tâche est identifiée pour faciliter le référencement dans les issues et PRs.

**Légende :** P0 = bloquant, P1 = important, P2 = amélioration, P3 = nice-to-have

---

## Frontend — Phase 4 (en cours)

### P0 — Bloquant pour le MVP

- [ ] **FE-001** — Pages et routing (Landing, `/calculator`, `/dashboard`, `/auth/signin`, `/auth/signup`)
- [ ] **FE-002** — Providers wrapper : QueryClientProvider, SessionProvider, ThemeProvider dans le root layout
- [ ] **FE-003** — Helpers frontend : `formatDPS()`, `formatPercent()`, `storeToCreateBuildPayload()`, `buildResponseToStoreData()`
- [ ] **FE-004** — Constantes frontend : `EQUIPMENT_SLOTS`, `STATS_SECTIONS` pour les grilles et accordéons

### P1 — Nécessaire avant release

- [ ] **FE-005** — Tests unitaires Zustand stores (useCalculatorStore, useUIStore)
- [ ] **FE-006** — Tests unitaires React Query hooks (useCalculate, useBuilds)

---

## Frontend — Phase 5 (UI/UX)

### P0 — Composants calculateur

- [ ] **UI-001** — Equipment Grid : 8 slots (2×4) avec cards cliquables, détection sets auto
- [ ] **UI-002** — Stats Panel : saisie stats + Cinq Attributs avec conversion auto
- [ ] **UI-003** — DPS Dashboard : DPS gauge, graduation badge, donut chart, gains marginaux
- [ ] **UI-004** — Layout calculateur 3 colonnes (responsive : drawer mobile, tabs bottom < 768px)

### P1 — Interactivité

- [ ] **UI-005** — Equipment Detail Drawer : détail pièce, enhance level slider, harmonisation
- [ ] **UI-006** — Comparison Panel : before/after coloré, badge impact DPS, confirm/cancel
- [ ] **UI-007** — Rotation Builder : skill palette + timeline drag & drop + recalcul DPS live
- [ ] **UI-008** — School/Weapon selectors avec filtrage par école

### P1 — Pages utilisateur

- [ ] **UI-009** — Landing page wuxia : hero parallax, features section, schools carousel
- [ ] **UI-010** — Dashboard utilisateur : builds grid avec BuildCards, tri/filtre
- [ ] **UI-011** — Auth pages : connexion / inscription (NextAuth)
- [ ] **UI-012** — Build viewer public : page `/calculator/[buildId]` en lecture seule

### P2 — Polish

- [ ] **UI-013** — Animations scroll (Intersection Observer, opacity/translateY transitions)
- [ ] **UI-014** — Responsive mobile complet : bottom tabs, drawers, touch gestures
- [ ] **UI-015** — Micro-interactions : stat flash (vert/rouge), card glow hover, gold separators
- [ ] **UI-016** — Radar chart stats vs optimal (Recharts RadarChart)
- [ ] **UI-017** — DPS Timeline chart (Recharts LineChart)

---

## Tests

### P1 — Couverture

- [ ] **TEST-001** — Tests E2E Playwright : auth flow complet (signup → signin → session → signout)
- [ ] **TEST-002** — Tests E2E Playwright : CRUD builds (create → list → view → edit → delete)
- [ ] **TEST-003** — Tests E2E Playwright : calcul → résultats DPS → graduation
- [ ] **TEST-004** — Tests E2E Playwright : comparaison équipement → diff → confirm/cancel
- [ ] **TEST-005** — Tests E2E Playwright : responsive (mobile tabs, drawer, 3 colonnes desktop)
- [ ] **TEST-006** — Seed Playwright dédié + cleanup after each test

---

## Performance & SEO

### P2 — Optimisation

- [ ] **PERF-001** — Code splitting et lazy loading des composants lourds (charts, rotation builder)
- [ ] **PERF-002** — React Query caching strategy (staleTime, gcTime par endpoint)
- [ ] **PERF-003** — SEO : metadata Next.js, OG images dynamiques par build partagé
- [ ] **PERF-004** — Lighthouse audit et corrections (CLS, LCP, accessibility)

---

## Infrastructure & DevOps

### P1 — Déploiement

- [ ] **INFRA-001** — CI/CD GitHub Actions : lint, type-check, tests sur chaque PR
- [ ] **INFRA-002** — Déploiement Vercel (frontend) + Railway/Supabase (PostgreSQL)
- [ ] **INFRA-003** — Variables d'environnement production (OAuth credentials, DB, secrets)

### P2 — Monitoring

- [ ] **INFRA-004** — Sentry error tracking
- [ ] **INFRA-005** — Migration rate limiting Prisma → Upstash Redis

---

## Données & Game Updates

### P2 — Maintenance

- [ ] **DATA-001** — Mise à jour données quand patch jeu (nouvelles armes, skills, sets)
- [ ] **DATA-002** — Validation croisée formules après chaque mise à jour majeure du jeu
- [ ] **DATA-003** — Support multi-serveur : configuration CN OW15 (level cap 100) en parallèle de Global OW12

---

## Post-MVP (v2.0)

### P3 — Évolutions futures

- [ ] **V2-001** — Multi-langue (FR, EN, CN) via next-intl ou i18next
- [ ] **V2-002** — Import de builds depuis le jeu (screenshot parsing ou API si disponible)
- [ ] **V2-003** — API publique documentée (OpenAPI / Swagger)
- [ ] **V2-004** — Classements DPS communautaires (leaderboard par arme/build)
- [ ] **V2-005** — Bot Discord MoonKnights (commandes DPS, lookup build)
- [ ] **V2-006** — Coaching IA (Anthropic SDK) : analyse de build, recommandations
- [ ] **V2-007** — Système d'abonnement Stripe (FREE / PREMIUM / PREMIUM_PLUS)
- [ ] **V2-008** — RGPD : cookie consent, export données utilisateur, suppression compte

---

## Comment contribuer à une tâche

1. Vérifier qu'une issue GitHub existe pour la tâche (sinon en créer une avec l'ID, ex: `UI-001`)
2. Lire le [CONTRIBUTING.md](./CONTRIBUTING.md) pour le workflow
3. Créer une branche `feature/<ID>-description` depuis `dev`
4. Ouvrir une PR vers `dev` en référençant l'issue

Les tâches labellisées **P0** et **P1** sont prioritaires. Les **P2** et **P3** sont ouvertes aux contributions spontanées.
