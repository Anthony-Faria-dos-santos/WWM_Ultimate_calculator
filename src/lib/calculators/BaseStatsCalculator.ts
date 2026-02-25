/**
 * Calculateur de stats de base.
 * Applique les bonus flat et pourcentage aux stats du personnage.
 */

import type { PlayerCharacter, CharacterBaseStats, Equipment } from '@/lib/types';
import { STAT_LIMITS } from '@/lib/constants';

/**
 * Buff actif appliqué au personnage.
 *
 * Les buffs peuvent être additifs (flat) ou multiplicatifs (%).
 * Ils modifient temporairement les stats pendant le combat.
 *
 */
export interface ActiveBuff {
 /** Identifiant unique du buff */
 readonly id: string;
 /** Nom lisible */
 readonly name: string;
 /** Stat affectée (ex: 'attack', 'critRate') */
 readonly stat: keyof CharacterBaseStats;
 /** Valeur du bonus (additif si < 10, multiplicatif si >= 10) */
 readonly value: number;
 /** Si le bonus est multiplicatif (défaut: false = additif) */
 readonly isMultiplicative?: boolean;
}

/**
 * Calculateur de statistiques finales de personnage.
 *
 * Agrège les stats de base, l'équipement, les buffs actifs et les synergies
 * pour produire les statistiques finales utilisées dans les calculs de combat.
 *
 */
export class BaseStatsCalculator {
 /**
 * Calcule les statistiques finales d'un personnage.
 *
 * Cette méthode agrège toutes les sources de bonus :
 * 1. Stats de base du personnage
 * 2. Bonus d'équipement (arme + armure + accessoires)
 * 3. Buffs actifs (temporaires)
 * 4. Synergies (set bonus, style martial)
 * 5. Application des caps (precision ≤ 95%, crit ≤ 80%, affinity ≤ 40%)
 *
 * @param character - Le personnage avec stats de base et équipement
 * @param activeBuffs - Liste des buffs actifs (optionnel)
 * @returns Stats calculées prêtes pour les calculs de dégâts
 *
 */
 public calculateFinalStats(
 character: Readonly<PlayerCharacter>,
 activeBuffs: readonly ActiveBuff[] = []
 ): CharacterBaseStats {
 // 1. Clone des stats de base (immutabilité)
 let stats: CharacterBaseStats = { ...character.baseStats };

 // 2. Ajouter les bonus d'équipement
 const equipmentBonuses = this.calculateEquipmentBonuses(character.equipment);
 stats = this.applyStatBonuses(stats, equipmentBonuses);

 // 3. Appliquer les buffs actifs
 if (activeBuffs.length > 0) {
 stats = this.applyActiveBuffs(stats, activeBuffs);
 }

 // 4. Calculer les synergies (set bonus, style martial)
 const synergyBonuses = this.calculateSynergies(character);
 stats = this.applyStatBonuses(stats, synergyBonuses);

 // 5. Appliquer les caps de stats
 stats = this.applyStatCaps(stats);

 // 6. Retourner stats finales (readonly)
 return Object.freeze(stats);
 }

 /**
 * Calcule les bonus totaux apportés par l'équipement.
 *
 * Agrège les bonus de :
 * - Arme (attack, elementalAttack, critRate, etc.)
 * - Armure (defense, resistance, etc.)
 * - Accessoires (precision, critDamage, affinityRate, etc.)
 *
 * @param equipment - L'équipement du personnage
 * @returns Bonus de stats partiels (seules les stats modifiées)
 *
 * @private
 */
 private calculateEquipmentBonuses(
 _equipment: Readonly<Equipment>
 ): Partial<CharacterBaseStats> {
 const bonuses: Partial<CharacterBaseStats> = {};

 // TODO Phase 3: Implémenter la lecture des bonus depuis les items d'équipement
 // Pour l'instant, on retourne un objet vide car les items n'ont pas encore
 // de propriétés de stats dans leur interface actuelle.
 // 
 // Exemple futur :
 // if (equipment.weapon) {
 // bonuses.attack = (bonuses.attack || 0) + equipment.weapon.attackBonus;
 // bonuses.critRate = (bonuses.critRate || 0) + equipment.weapon.critRateBonus;
 // }
 // if (equipment.armor) {
 // bonuses.defense = (bonuses.defense || 0) + equipment.armor.defenseBonus;
 // }
 // for (const accessory of equipment.accessories) {
 // bonuses.precision = (bonuses.precision || 0) + accessory.precisionBonus;
 // }

 return bonuses;
 }

 /**
 * Applique des bonus de stats partiels aux stats actuelles.
 *
 * @param stats - Stats actuelles
 * @param bonuses - Bonus à appliquer (additifs)
 * @returns Nouvelles stats avec bonus appliqués
 *
 * @private
 */
 private applyStatBonuses(
 stats: CharacterBaseStats,
 bonuses: Partial<CharacterBaseStats>
 ): CharacterBaseStats {
 const result: CharacterBaseStats = { ...stats };

 // Appliquer chaque bonus (additif simple)
 for (const key of Object.keys(bonuses) as Array<keyof CharacterBaseStats>) {
 const bonusValue = bonuses[key];
 if (bonusValue !== undefined && typeof bonusValue === 'number') {
 (result as any)[key] = (stats[key] as number) + bonusValue;
 }
 }

 return result;
 }

 /**
 * Applique les buffs actifs aux stats du personnage.
 *
 * Gère deux types de buffs :
 * - **Additifs** : Ajoute une valeur fixe (ex: +200 attack)
 * - **Multiplicatifs** : Multiplie par un pourcentage (ex: +15% precision)
 *
 * @param stats - Stats actuelles
 * @param buffs - Liste des buffs actifs à appliquer
 * @returns Nouvelles stats avec buffs appliqués
 *
 * @private
 */
 private applyActiveBuffs(
 stats: CharacterBaseStats,
 buffs: readonly ActiveBuff[]
 ): CharacterBaseStats {
 let result: CharacterBaseStats = { ...stats };

 for (const buff of buffs) {
 const currentValue = result[buff.stat];

 // Ignorer les buffs sur des stats non-numériques
 if (typeof currentValue !== 'number') {
 continue;
 }

 if (buff.isMultiplicative) {
 // Buff multiplicatif : value × (1 + bonus)
 (result as any)[buff.stat] = currentValue * (1 + buff.value);
 } else {
 // Buff additif : value + bonus
 (result as any)[buff.stat] = currentValue + buff.value;
 }
 }

 return result;
 }

 /**
 * Calcule les bonus de synergies (set bonus, style martial, etc.).
 *
 * Les synergies sont des bonus spéciaux activés par :
 * - **Set d'équipement complet** : Bonus si 2, 4, 6 pièces équipées
 * - **Style martial** : Bonus passifs liés au style
 * - **Voies intérieures** : Bonus de cultivation
 *
 * @param character - Le personnage complet
 * @returns Bonus de stats partiels issus des synergies
 *
 * @private
 */
 private calculateSynergies(
 _character: Readonly<PlayerCharacter>
 ): Partial<CharacterBaseStats> {
 const bonuses: Partial<CharacterBaseStats> = {};

 // TODO Phase 2: Implémenter les calculs de synergies
 // 
 // 1. Set Bonus
 // if (character.equipment.setBonus) {
 // const setBonusData = getSetBonusData(character.equipment.setBonus.setId);
 // Object.assign(bonuses, setBonusData.statBonuses);
 // }
 // 
 // 2. Style Martial
 // const styleBonuses = getMartialStyleBonuses(character.martialArtStyle);
 // Object.assign(bonuses, styleBonuses);
 // 
 // 3. Voies Intérieures
 // for (const innerWay of character.innerWays) {
 // const innerWayBonuses = getInnerWayBonuses(innerWay.id, innerWay.level);
 // Object.assign(bonuses, innerWayBonuses);
 // }

 return bonuses;
 }

 /**
 * Applique les caps (limites) de statistiques.
 *
 * Certaines stats ont des limites maximales pour équilibrer le jeu :
 * - **Precision** : Cap à 100% (STAT_LIMITS.MAX_PRECISION_RATE)
 * - **Critical Rate** : Cap à 80% (STAT_LIMITS.MAX_CRITICAL_RATE)
 * - **Affinity Rate** : Cap à 60% (STAT_LIMITS.MAX_AFFINITY_RATE)
 *
 * Note : Les stats brutes (attack, defense, etc.) n'ont pas de cap.
 *
 * @param stats - Stats avant application des caps
 * @returns Stats avec caps appliqués
 *
 * Pour `affinityRate`, c'est déjà un taux (0-1), donc on le cap directement.
 *
 * @private
 */
 private applyStatCaps(stats: CharacterBaseStats): CharacterBaseStats {
 const result: CharacterBaseStats = { ...stats };

 // Cap Affinity Rate à 60% (0.6) selon STAT_LIMITS.MAX_AFFINITY_RATE
 // AffinityRate est déjà un decimal (0-1), donc on le cap directement
 if (result.affinityRate > STAT_LIMITS.MAX_AFFINITY_RATE) {
 (result as any).affinityRate = STAT_LIMITS.MAX_AFFINITY_RATE;
 }

 // Cap CritDamage et AffinityDamage (pas de caps dans STAT_LIMITS, mais on évite les valeurs négatives)
 if (result.critDamage < 0) {
 (result as any).critDamage = 0;
 }
 if (result.affinityDamage < 0) {
 (result as any).affinityDamage = 0;
 }

 // Note: Precision et CritRate n'ont pas de cap ici car ce sont des valeurs brutes.
 // Les caps (95% et 80%) sont appliqués lors du calcul des taux dans les calculators rates.

 return result;
 }
}
