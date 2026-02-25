/**
 * Résolveur de bonus de sets d'équipement.
 * Détermine les paliers actifs (2p/4p/6p) et retourne les bonus correspondants.
 */

import type {
 EquipmentPiece,
 EquipmentSetDefinition,
 ResolvedSetBonus,
 SetBonusCondition,
} from '../types/EquipmentSet.types';
import type { CombatContext } from '../types/CombatContext.types';

export class SetBonusResolver {
 /**
 * Résout les bonus actifs pour un ensemble de pièces équipées.
 *
 * @param equippedPieces - Pièces actuellement équipées
 * @param setDefinitions - Définitions de tous les sets disponibles
 * @param context - État de combat (pour conditions)
 * @returns Liste de bonus de set résolus
 */
 public resolveEquippedSets(
 equippedPieces: readonly EquipmentPiece[],
 setDefinitions: ReadonlyMap<string, EquipmentSetDefinition>,
 context: Readonly<CombatContext>
 ): readonly ResolvedSetBonus[] {
 // 1. Compter les pièces par set
 const pieceCounts = this.countPiecesBySet(equippedPieces);
 const resolvedBonuses: ResolvedSetBonus[] = [];

 // 2. Pour chaque set avec des pièces équipées
 for (const [setId, count] of pieceCounts.entries()) {
 const setDef = setDefinitions.get(setId);
 if (!setDef) continue;

 // 3. Vérifier chaque palier de bonus
 for (const tier of setDef.tierBonuses) {
 if (count >= tier.piecesRequired) {
 const isActive = this.evaluateSetCondition(tier.condition, context);

 resolvedBonuses.push({
 setId,
 setName: setDef.nameFR || setDef.name,
 activeTier: tier.piecesRequired,
 damageZone: tier.damageZone,
 value: isActive ? tier.damageValue : 0,
 statModifiers: isActive ? tier.statModifiers : [],
 source: `${setDef.nameFR || setDef.name} (${tier.piecesRequired}p)`,
 isEstimated: setDef.dataCompleteness !== 'complete',
 });
 }
 }
 }

 return resolvedBonuses;
 }

 /**
 * Compte les pièces équipées par setId.
 */
 private countPiecesBySet(
 pieces: readonly EquipmentPiece[]
 ): Map<string, number> {
 const counts = new Map<string, number>();
 for (const piece of pieces) {
 counts.set(piece.setId, (counts.get(piece.setId) ?? 0) + 1);
 }
 return counts;
 }

 /**
 * Évalue si une condition de set est remplie.
 */
 private evaluateSetCondition(
 condition: Readonly<SetBonusCondition> | null,
 _context: Readonly<CombatContext>
 ): boolean {
 if (!condition || condition.type === 'always') {
 return true;
 }
 // TODO Phase 2+ : évaluer les conditions complexes via _context
 // (combat_state, skill_usage, resource_threshold)
 return true;
 }
}
