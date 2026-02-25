/**
 * Types de sets d'équipement — paliers, bonus, pièces.
 */

import type { TalentDamageZone } from './MartialArts.types';

/**
 * Slot d'équipement
 */
export enum EquipmentSlot {
 Weapon = 'weapon',
 Head = 'head',
 Chest = 'chest',
 Legs = 'legs',
 Feet = 'feet',
 Ring1 = 'ring_1',
 Ring2 = 'ring_2',
 Bracelet1 = 'bracelet_1',
 Bracelet2 = 'bracelet_2',
 Amulet = 'amulet',
}

/**
 * Modificateur de stat apporté par un set
 */
export interface SetStatModifier {
 /** Stat affectée (clé de CharacterBaseStats) */
 readonly stat: string;
 /** Valeur du modificateur */
 readonly value: number;
 /** true = pourcentage (×1.10 = +10%), false = flat (+100) */
 readonly isPercentage: boolean;
}

/**
 * Condition d'activation d'un bonus de set
 */
export interface SetBonusCondition {
 readonly type: 'combat_state' | 'skill_usage' | 'resource_threshold' | 'always';
 readonly description: string;
 /** Multiplicateur conditionnel (1.0 = bonus complet, 0.5 = demi-bonus) */
 readonly multiplier: number;
}

/**
 * Bonus individuel d'un palier de set (2p, 4p, 6p)
 */
export interface SetTierBonus {
 /** Nombre de pièces requises pour activer */
 readonly piecesRequired: 2 | 4 | 6;
 /** Type de bonus : modification de stat ou zone de dégâts */
 readonly bonusType: 'stat' | 'damage' | 'special';
 /** Modificateurs de stats (si bonusType = 'stat') */
 readonly statModifiers: readonly SetStatModifier[];
 /** Zone de dégâts affectée (si bonusType = 'damage') */
 readonly damageZone: TalentDamageZone | null;
 /** Valeur du bonus de dégâts (en décimal, ex: 0.15 = +15%) */
 readonly damageValue: number;
 /** Condition d'activation (null = toujours actif) */
 readonly condition: SetBonusCondition | null;
 /** Description pour l'UI */
 readonly description: string;
}

/**
 * Pièce d'équipement individuelle
 */
export interface EquipmentPiece {
 readonly id: string;
 readonly name: string;
 readonly slot: EquipmentSlot;
 readonly setId: string;
 readonly rarity: 'common' | 'rare' | 'epic' | 'legendary';
 /** Stats de base de la pièce */
 readonly statModifiers: readonly SetStatModifier[];
}

/**
 * Set d'équipement complet
 *
 * Contient toutes les pièces et les bonus de palier.
 * Les bonus s'activent automatiquement quand assez de pièces sont équipées.
 */
export interface EquipmentSetDefinition {
 readonly id: string;
 readonly name: string;
 readonly nameFR: string;
 /** Nombre total de pièces dans le set */
 readonly totalPieces: number;
 /** Paliers de bonus (2p, 4p, 6p) */
 readonly tierBonuses: readonly SetTierBonus[];
 /** Complétude des données */
 readonly dataCompleteness: 'complete' | 'partial' | 'minimal';
}

/**
 * Bonus de set résolu (après vérification du nombre de pièces équipées)
 *
 * Produit par le SetBonusResolver. Consommé par le pipeline de calcul.
 */
export interface ResolvedSetBonus {
 readonly setId: string;
 readonly setName: string;
 /** Palier activé (2, 4 ou 6) */
 readonly activeTier: 2 | 4 | 6;
 /** Zone de dégâts (null si bonus de stat seulement) */
 readonly damageZone: TalentDamageZone | null;
 /** Valeur du bonus (en décimal) */
 readonly value: number;
 /** Modificateurs de stats à appliquer */
 readonly statModifiers: readonly SetStatModifier[];
 /** Source pour breakdown UI */
 readonly source: string;
 /** Données incomplètes ? */
 readonly isEstimated: boolean;
}
