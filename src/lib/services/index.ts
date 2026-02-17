/**
 * WWM Ultimate Calculator - Services Barrel Export
 * 
 * Central export file for all service modules.
 * Provides a single entry point for importing services across the application.
 * 
 * This module exports:
 * - CombatService: Facade orchestrating all combat calculators
 * - ComparisonService: Service for comparing builds (Phase 1.7.2)
 * 
 * Usage:
 * ```typescript
 * import { CombatService } from '@/lib/services';
 * 
 * const service = new CombatService();
 * const damage = service.calculateSkillDamage(attacker, skill, target);
 * ```
 * 
 * @module services
 * @version 1.0.0
 */

// ============================================================================
// CombatService
// ============================================================================
/**
 * CombatService: Facade orchestrating all combat calculators
 * Provides unified API for damage, DPS, heal, and graduation calculations.
 */
export { CombatService } from './CombatService';

// ============================================================================
// Future Exports (Phase 1.7.2+)
// ============================================================================
// export { ComparisonService } from './ComparisonService';
