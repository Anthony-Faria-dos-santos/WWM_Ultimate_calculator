/**
 * Routeur de bonus par zone.
 * Trie les bonus résolus (talents + sets) en deux sorties :
 * modifications de stats pré-combat et bonus de dégâts par zone.
 */

import type {
  ResolvedTalentBonus,
  TalentDamageZone,
} from '@/lib/types/MartialArts.types';
import type { ResolvedSetBonus } from '@/lib/types/EquipmentSet.types';
import { DamageZone, type DamageBonus } from './BonusMultiplierCalculator';

// ─── Types de sortie ────────────────────────────────────────────────

/**
 * Modification de stat à appliquer avant le calcul de dégâts.
 */
export interface StatModification {
  readonly stat: string;
  readonly value: number;
  readonly source: string;
  readonly isPercentage: boolean;
}

/**
 * Résultat du routage : stats, dégâts, et bonus ignorés.
 */
export interface RoutedBonuses {
  /** Modifications de stats à appliquer via PreCombatStatsModifier */
  readonly statModifications: readonly StatModification[];
  /** Bonus de dégâts pour BonusMultiplierCalculator */
  readonly damageBonuses: readonly DamageBonus[];
  /** Bonus ignorés (heal, utility) */
  readonly ignored: readonly ResolvedTalentBonus[];
}

// ─── Mapping zones → routage ────────────────────────────────────────

/** Zones qui modifient les stats pré-combat (flat add sur la stat indiquée) */
const STAT_ZONE_MAP: ReadonlyMap<TalentDamageZone, string> = new Map([
  ['CritDamageBonus', 'critDamage'],
  ['AffinityDamageBonus', 'affinityDamage'],
  ['PrecisionRate', 'precision'],
  ['AffinityRateBonus', 'affinityRate'],
  ['AttributePenetration', 'armorPenetration'],
]);

/** Zones routées vers DamageBonus (BonusMultiplierCalculator) */
const DAMAGE_ZONE_MAP: ReadonlyMap<TalentDamageZone, DamageZone> = new Map([
  ['GeneralDamageIncrease', DamageZone.Augmentation],
  ['SkillDamageBonus', DamageZone.Tuning],
  ['SpecialMultiplier', DamageZone.Independent],
  ['AttributeDamageBonus', DamageZone.Deepening],
]);

/** Zones non-combat à ignorer */
const IGNORED_ZONES: ReadonlySet<TalentDamageZone> = new Set([
  'CriticalHealBonus',
  'Utility',
  'HealingResource',
]);

// ─── Classe principale ─────────────────────────────────────────────

export class BonusZoneRouter {
  /**
   * Route les bonus résolus vers stats et zones de dégâts.
   *
   * @param talentBonuses - Bonus de talents résolus
   * @param setBonuses - Bonus de sets résolus
   * @returns Bonus routés : statModifications, damageBonuses, ignored
   */
  public routeBonuses(
    talentBonuses: readonly ResolvedTalentBonus[],
    setBonuses: readonly ResolvedSetBonus[]
  ): RoutedBonuses {
    const statModifications: StatModification[] = [];
    const damageBonuses: DamageBonus[] = [];
    const ignored: ResolvedTalentBonus[] = [];

    // Routage des talents
    for (const talent of talentBonuses) {
      if (!talent.isActive || talent.value === 0) continue;

      if (IGNORED_ZONES.has(talent.damageZone)) {
        ignored.push(talent);
        continue;
      }

      // BaseStats → stat cible via targetStat
      if (talent.damageZone === 'BaseStats') {
        if (talent.targetStat) {
          statModifications.push({
            stat: talent.targetStat,
            value: talent.value,
            source: talent.source,
            isPercentage: false,
          });
        }
        continue;
      }

      // Zones de stats pré-combat (crit damage, precision, etc.)
      const statTarget = STAT_ZONE_MAP.get(talent.damageZone);
      if (statTarget) {
        statModifications.push({
          stat: statTarget,
          value: talent.value,
          source: talent.source,
          isPercentage: false,
        });
        continue;
      }

      // Zones de dégâts
      const damageCategory = DAMAGE_ZONE_MAP.get(talent.damageZone);
      if (damageCategory) {
        damageBonuses.push({
          category: damageCategory,
          value: talent.value,
          source: talent.source,
        });
      }
    }

    // Routage des sets (statModifiers gérés par PreCombatStatsModifier)
    for (const setBonus of setBonuses) {
      if (setBonus.damageZone && setBonus.value !== 0) {
        const damageCategory = DAMAGE_ZONE_MAP.get(setBonus.damageZone);
        const statTarget = STAT_ZONE_MAP.get(setBonus.damageZone);

        if (damageCategory) {
          damageBonuses.push({
            category: damageCategory,
            value: setBonus.value,
            source: setBonus.source,
          });
        } else if (statTarget) {
          statModifications.push({
            stat: statTarget,
            value: setBonus.value,
            source: setBonus.source,
            isPercentage: false,
          });
        }
      }
    }

    return { statModifications, damageBonuses, ignored };
  }
}
