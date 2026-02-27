/**
 * Modificateur de stats pré-combat.
 * Applique les modifications flat → % → talents avant le pipeline de dégâts.
 */

import type { ResolvedTalentBonus } from '../types/MartialArts.types';
import type { ResolvedSetBonus, SetStatModifier } from '../types/EquipmentSet.types';
import type { ExtendedStats } from './TalentBonusResolver';

/**
 * Résultat de la modification pré-combat.
 * Stats finales + breakdown pour l'UI.
 */
export interface ModifiedStatsResult {
 readonly finalStats: ExtendedStats;
 readonly appliedModifiers: readonly AppliedModifier[];
}

/**
 * Détail d'un modificateur appliqué (pour breakdown UI).
 */
export interface AppliedModifier {
 readonly source: string;
 readonly stat: string;
 readonly valueBefore: number;
 readonly valueAfter: number;
 readonly modifier: number;
 readonly isPercentage: boolean;
}

export class PreCombatStatsModifier {
 /**
 * Applique toutes les modifications pré-combat aux stats.
 *
 * @param baseStats - Stats de base du personnage (immuables)
 * @param talentBonuses - Bonus résolus des talents (zone = BaseStats)
 * @param setBonuses - Bonus résolus des sets
 * @returns Stats modifiées + breakdown
 */
 public applyModifications(
 baseStats: Readonly<ExtendedStats>,
 talentBonuses: readonly ResolvedTalentBonus[],
 setBonuses: readonly ResolvedSetBonus[]
 ): ModifiedStatsResult {
 const appliedModifiers: AppliedModifier[] = [];

 // Clone mutable pour modifications
 const mutableStats = { ...baseStats } as Record<string, number>;

 // 1. Appliquer les flat bonus de sets
 for (const setBonus of setBonuses) {
 for (const mod of setBonus.statModifiers) {
 if (!mod.isPercentage) {
 this.applyStat(mutableStats, mod, setBonus.source, appliedModifiers);
 }
 }
 }

 // 2. Appliquer les percentage bonus de sets
 for (const setBonus of setBonuses) {
 for (const mod of setBonus.statModifiers) {
 if (mod.isPercentage) {
 this.applyStat(mutableStats, mod, setBonus.source, appliedModifiers);
 }
 }
 }

 // 3. Appliquer les talent BaseStats (ceux avec damageZone = 'BaseStats')
 const baseStatTalents = talentBonuses.filter(
 (b) => b.damageZone === 'BaseStats' && b.isActive && b.value !== 0
 );

    for (const talent of baseStatTalents) {
      const stat = talent.targetStat;
      if (!stat) {
        console.warn(
          `[PreCombatStatsModifier] Talent BaseStats "${talent.talentName}" sans targetStat — ignoré`
        );
        continue;
      }
      const before = mutableStats[stat] ?? 0;
      mutableStats[stat] = before + talent.value;
      appliedModifiers.push({
        source: talent.source,
        stat,
        valueBefore: before,
        valueAfter: mutableStats[stat],
        modifier: talent.value,
        isPercentage: false,
      });
    }

 return {
 finalStats: mutableStats as unknown as ExtendedStats,
 appliedModifiers,
 };
 }

 /**
 * Applique un modificateur de stat (flat ou %).
 */
 private applyStat(
 stats: Record<string, number>,
 mod: Readonly<SetStatModifier>,
 source: string,
 modifiers: AppliedModifier[]
 ): void {
 const before = stats[mod.stat] ?? 0;
 const delta = mod.isPercentage ? before * mod.value : mod.value;
 stats[mod.stat] = before + delta;

 modifiers.push({
 source,
 stat: mod.stat,
 valueBefore: before,
 valueAfter: stats[mod.stat],
 modifier: mod.value,
 isPercentage: mod.isPercentage,
 });
 }
}
