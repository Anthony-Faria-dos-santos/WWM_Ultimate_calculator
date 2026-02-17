/**
 * WWM Ultimate Calculator - Services Barrel Export
 *
 * Central export file for all service modules.
 * Services are facade classes that orchestrate calculators
 * and provide a unified API for the application layer.
 *
 * This module exports:
 * - CombatService: Unified API for damage, DPS, heal, graduation
 * - ComparisonService: Build comparison and stat optimization
 *
 * Usage:
 * ```typescript
 * import { CombatService, ComparisonService } from '@/lib/services';
 *
 * const combat = new CombatService();
 * const damage = combat.calculateSkillDamage(attacker, skill, target);
 *
 * const comparison = new ComparisonService();
 * const result = comparison.compareTwoBuilds(build1, build2, target);
 * ```
 *
 * @module services
 * @version 1.0.0
 */

// ============================================================================
// Combat Service
// ============================================================================
export { CombatService } from './CombatService';

// ============================================================================
// Comparison Service
// ============================================================================
export { ComparisonService } from './ComparisonService';
export type { BuildConfig, MarginalGainResult } from './ComparisonService';
