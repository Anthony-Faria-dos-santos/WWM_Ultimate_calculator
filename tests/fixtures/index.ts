/**
 * Fixtures de test partagées pour tous les tests unitaires
 *
 * Fournit des données de test cohérentes et réalistes pour tous
 * les calculateurs et services du projet.
 *
 * Remarques d'adaptation aux types réels :
 * - `critRate` est une valeur brute (ex: 600 → ~45% effectif via 1.15×(x/(x+938)))
 * - `critDamage` est un bonus décimal (ex: 0.30 → multiplicateur total 1.5+0.30=×1.80)
 * - `parry` est une valeur brute utilisée dans la formule de précision
 * - `DamageType.PhysicalOnly` et `ElementalOnly` (et non `.Physical`/`.Elemental`)
 *
 * @module tests/fixtures
 */

import { DamageType, SkillCategory, SkillElement } from '@/lib/types/Skill.types';
import type { CharacterBaseStats } from '@/lib/types/Character.types';
import type { Skill } from '@/lib/types/Skill.types';
import type { Target } from '@/lib/types/Combat.types';

/**
 * Fixtures partagées pour tous les tests unitaires
 *
 * Regroupe des personnages, compétences et cibles représentatifs
 * des cas d'usage courants du calculateur WWM.
 */
export const TEST_FIXTURES = {
  characters: {
    /**
     * DPS niveau 80 avec statistiques équilibrées
     *
     * critRate brute 600 → ~45.4% taux effectif (1.15 × 600 / (600 + 938))
     * critDamage 0.30 → multiplicateur critique total ×1.80 (1.5 + 0.30)
     */
    standardDPS: {
      level: 80,
      attack: 2500,
      attackMin: 2375,
      attackMax: 2625,
      elementalAttack: 1800,
      defense: 500,
      resistance: 200,
      critRate: 600,
      critDamage: 0.30,
      affinityRate: 0.25,
      affinityDamage: 0.15,
      precision: 3000,
      armorPenetration: 800,
      elementalPenetration: 400,
    } as const satisfies CharacterBaseStats,

    /**
     * Personnage bas niveau pour tests de cas limites et progression
     *
     * critRate brute 140 → ~14.8% taux effectif (1.15 × 140 / (140 + 938))
     */
    lowLevel: {
      level: 30,
      attack: 800,
      attackMin: 760,
      attackMax: 840,
      elementalAttack: 500,
      defense: 200,
      resistance: 100,
      critRate: 140,
      critDamage: 0.10,
      affinityRate: 0.05,
      affinityDamage: 0.05,
      precision: 1000,
      armorPenetration: 100,
      elementalPenetration: 50,
    } as const satisfies CharacterBaseStats,
  },

  skills: {
    /**
     * Attaque physique de base — pas de cooldown, ratio ×1.0
     */
    basicAttack: {
      id: 'skill-basic-attack',
      name: 'Frappe de base',
      description: 'Attaque physique de base sans modificateurs',
      physicalRatio: 1.0,
      elementalRatio: 0,
      castTime: 1.0,
      cooldown: 0,
      damageType: DamageType.PhysicalOnly,
      category: SkillCategory.Active,
      element: SkillElement.None,
      weaponType: null,
      talents: [],
      range: 5,
      areaOfEffect: 0,
    } as const satisfies Skill,

    /**
     * Compétence physique puissante — ratio ×2.5, cooldown 8s
     */
    strongSkill: {
      id: 'skill-strong-attack',
      name: 'Coup puissant',
      description: 'Attaque physique puissante à fort ratio de dégâts',
      physicalRatio: 2.5,
      elementalRatio: 0,
      castTime: 1.5,
      cooldown: 8,
      damageType: DamageType.PhysicalOnly,
      category: SkillCategory.Active,
      element: SkillElement.None,
      weaponType: null,
      talents: [],
      range: 5,
      areaOfEffect: 0,
    } as const satisfies Skill,

    /**
     * Compétence élémentaire pure — ratio ×2.0, cooldown 6s
     */
    elementalSkill: {
      id: 'skill-elemental-breath',
      name: 'Souffle élémentaire',
      description: 'Attaque élémentaire pure à fort ratio de dégâts',
      physicalRatio: 0,
      elementalRatio: 2.0,
      castTime: 1.2,
      cooldown: 6,
      damageType: DamageType.ElementalOnly,
      category: SkillCategory.Active,
      element: SkillElement.Fire,
      weaponType: null,
      talents: [],
      range: 10,
      areaOfEffect: 0,
    } as const satisfies Skill,

    /**
     * Compétence hybride — ratio physique ×1.0 + élémentaire ×1.0
     */
    hybridSkill: {
      id: 'skill-hybrid-strike',
      name: 'Frappe hybride',
      description: 'Attaque combinant dégâts physiques et élémentaires',
      physicalRatio: 1.0,
      elementalRatio: 1.0,
      castTime: 1.3,
      cooldown: 4,
      damageType: DamageType.Hybrid,
      category: SkillCategory.Active,
      element: SkillElement.Fire,
      weaponType: null,
      talents: [],
      range: 5,
      areaOfEffect: 0,
    } as const satisfies Skill,
  },

  targets: {
    /**
     * Ennemi standard niveau 80 — défenses modérées
     *
     * parry 150 → réduction de précision perceptible dans la formule v1.3+
     */
    standardEnemy: {
      id: 'target-standard-enemy',
      name: 'Ennemi standard',
      level: 80,
      defense: 1200,
      resistance: 400,
      shield: 0.15,
      parry: 150,
    } as const satisfies Target,

    /**
     * Boss coriace niveau 80 — hautes défenses, bouclier important
     *
     * parry 300 → précision significativement réduite (test de précision)
     */
    toughBoss: {
      id: 'target-tough-boss',
      name: 'Boss coriace',
      level: 80,
      defense: 3000,
      resistance: 800,
      shield: 0.30,
      parry: 300,
    } as const satisfies Target,

    /**
     * Ennemi faible — défenses quasi nulles pour tests de dégâts maximaux
     */
    weakEnemy: {
      id: 'target-weak-enemy',
      name: 'Ennemi faible',
      level: 1,
      defense: 100,
      resistance: 0,
      shield: 0,
      parry: 0,
    } as const satisfies Target,
  },
} as const;

/**
 * Crée un CharacterBaseStats en surchargeant les valeurs du `standardDPS`
 *
 * @param overrides - Propriétés à surcharger sur le personnage de base
 * @returns Nouveau CharacterBaseStats avec les overrides appliqués
 *
 * @example
 * const tankChar = createCharacter({ defense: 2000, attack: 1500 });
 * const highCritChar = createCharacter({ critRate: 900, critDamage: 0.50 });
 */
export function createCharacter(overrides?: Partial<CharacterBaseStats>): CharacterBaseStats {
  return { ...TEST_FIXTURES.characters.standardDPS, ...overrides };
}

/**
 * Crée un Skill en surchargeant les valeurs du `basicAttack`
 *
 * @param overrides - Propriétés à surcharger sur la compétence de base
 * @returns Nouveau Skill avec les overrides appliqués
 *
 * @example
 * const highRatioSkill = createSkill({ physicalRatio: 3.0, cooldown: 15 });
 * const quickSkill = createSkill({ castTime: 0.5, cooldown: 2 });
 */
export function createSkill(overrides?: Partial<Skill>): Skill {
  return { ...TEST_FIXTURES.skills.basicAttack, ...overrides };
}

/**
 * Crée un Target en surchargeant les valeurs du `standardEnemy`
 *
 * @param overrides - Propriétés à surcharger sur la cible de base
 * @returns Nouveau Target avec les overrides appliqués
 *
 * @example
 * const noShieldTarget = createTarget({ shield: 0, defense: 500 });
 * const eliteEnemy = createTarget({ defense: 2000, resistance: 600 });
 */
export function createTarget(overrides?: Partial<Target>): Target {
  return { ...TEST_FIXTURES.targets.standardEnemy, ...overrides };
}
