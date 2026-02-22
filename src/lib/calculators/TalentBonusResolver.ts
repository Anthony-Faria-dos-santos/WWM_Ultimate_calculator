/**
 * Résolveur de bonus de talents d'arts martiaux.
 * Évalue les talents actifs selon le contexte de combat et retourne les bonus par zone.
 */

import type { CharacterBaseStats } from '../types/Character.types';
import type {
 MartialArtTalent,
 MartialArtWeapon,
 ResolvedTalentBonus,
 TalentCondition,
 TalentScalingFormula,
 TalentScalingStat,
} from '../types/MartialArts.types';
import type { CombatContext } from '../types/CombatContext.types';

/**
 * Stats étendues incluant les stats secondaires
 * utilisées pour le scaling des talents.
 *
 * Les stats comme 'momentum', 'agility', 'body', 'power'
 * ne sont pas dans CharacterBaseStats mais nécessaires au scaling.
 */
export interface ExtendedStats extends CharacterBaseStats {
 /** Élan / Momentum */
 readonly momentum: number;
 /** Agilité */
 readonly agility: number;
 /** Corps / Body */
 readonly body: number;
 /** Puissance / Power */
 readonly power: number;
 /** HP Maximum */
 readonly maxHP: number;
 /** Attaque d'attribut max (Bellstrike/Bamboocut/etc.) */
 readonly maxAttributeAttack: number;
 /** Attaque d'attribut min */
 readonly minAttributeAttack: number;
}

export class TalentBonusResolver {
 /**
 * Résout tous les talents d'une arme en bonus concrets.
 *
 * @param weapon - Arme avec ses talents
 * @param stats - Stats étendues du personnage
 * @param context - État de combat actuel
 * @returns Liste de bonus résolus (actifs et inactifs)
 */
 public resolveWeaponTalents(
 weapon: Readonly<MartialArtWeapon>,
 stats: Readonly<ExtendedStats>,
 context: Readonly<CombatContext>
 ): readonly ResolvedTalentBonus[] {
 return weapon.talents.map((talent) =>
 this.resolveSingleTalent(talent, stats, context)
 );
 }

 /**
 * Résout un talent individuel.
 */
 public resolveSingleTalent(
 talent: Readonly<MartialArtTalent>,
 stats: Readonly<ExtendedStats>,
 context: Readonly<CombatContext>
 ): ResolvedTalentBonus {
 // 1. Vérifier condition d'activation
 const isActive = this.evaluateCondition(talent.condition, context);

 // 2. Calculer la valeur du bonus
 let value = 0;
 const isEstimated = talent.dataCompleteness !== 'complete';

 if (talent.scaling) {
 value = this.calculateScalingBonus(talent.scaling, stats);
 } else if (talent.flatBonus) {
 // Pour les flat bonus, on prend la moyenne min/max
 value = (talent.flatBonus.min + talent.flatBonus.max) / 2;
 }

 // 3. Si données incomplètes et pas de scaling, valeur = 0 (safe fallback)
 if (isEstimated && !talent.scaling && !talent.flatBonus) {
 value = 0;
 }

 return {
 talentId: talent.id,
 talentName: talent.nameFR || talent.name,
 damageZone: talent.damageZone,
 value: isActive ? value : 0,
 isActive,
 source: `Talent: ${talent.nameFR || talent.name}`,
 isEstimated,
 };
 }

 /**
 * Calcule le bonus d'un talent avec scaling.
 *
 * Formule : bonus = baseValue + min(stat, statCap) / scalingUnit × perStatPoint
 * Capé à maxBonus.
 *
 * @param scaling - Formule de scaling du talent
 * @param stats - Stats du personnage
 * @returns Valeur du bonus (en décimal, ex: 0.20 = +20%)
 */
 public calculateScalingBonus(
 scaling: Readonly<TalentScalingFormula>,
 stats: Readonly<ExtendedStats>
 ): number {
 const statValue = this.getStatValue(scaling.scalingStat, stats);
 const cappedStat = Math.min(statValue, scaling.statCap);
 const scaledBonus =
 scaling.baseValue +
 (cappedStat / scaling.scalingUnit) * scaling.perStatPoint;

 return Math.min(scaledBonus, scaling.maxBonus);
 }

 /**
 * Évalue si une condition de talent est remplie.
 *
 * @param condition - Condition à évaluer (null = toujours actif)
 * @param context - État de combat actuel
 * @returns true si la condition est remplie
 */
 public evaluateCondition(
 condition: Readonly<TalentCondition> | null,
 context: Readonly<CombatContext>
 ): boolean {
 if (!condition || condition.type === 'always') {
 return true;
 }

 switch (condition.type) {
 case 'targetQiBelow':
 return context.targetQiPercent < (condition.threshold ?? 0.4);

 case 'targetExhausted':
 return context.isTargetExhausted;

 case 'hpBelow':
 return context.playerHpPercent < (condition.threshold ?? 0.3);

 case 'chargedSkill':
 return context.isChargedSkill;

 case 'duringSkill':
 return condition.skillName
 ? context.currentSkillId === condition.skillName
 : context.currentSkillId !== null;

 default:
 return false;
 }
 }

 /**
 * Récupère la valeur d'une stat depuis les ExtendedStats.
 */
 private getStatValue(
 stat: TalentScalingStat,
 stats: Readonly<ExtendedStats>
 ): number {
 const statMap: Record<TalentScalingStat, number> = {
 maxPhysicalAttack: stats.attack,
 minPhysicalAttack: stats.attackMin ?? stats.attack,
 agility: stats.agility,
 momentum: stats.momentum,
 body: stats.body,
 power: stats.power,
 maxHP: stats.maxHP,
 maxAttributeAttack: stats.maxAttributeAttack,
 minAttributeAttack: stats.minAttributeAttack,
 };

 return statMap[stat] ?? 0;
 }
}
