/**
 * Constantes de jeu WWM — serveurs, stats, défense, résistance, DPS.
 * Sources : wherewindsmeetcalculator.com, théorycrafters CN (Bilibili).
 */

// Configurations serveur
/**
 * Configurations serveur WWM.
 *
 * Le serveur actif détermine les constantes utilisées.
 */
export const SERVER_CONFIGS = {
 /**
 * Version Global — OW12
 * Level maximum : 85
 */
 GLOBAL_OW12: {
 MAX_LEVEL: 85,
 VERSION_NAME: 'OW12',
 REGION: 'Global',
 },
 
 /**
 * Version Chinoise — OW15
 * Level maximum : 100
 */
 CN_OW15: {
 MAX_LEVEL: 100,
 VERSION_NAME: 'OW15',
 REGION: 'CN',
 },
} as const;

/**
 * Type pour les clés de configuration serveur.
 */
export type ServerConfigKey = keyof typeof SERVER_CONFIGS;

/**
 * Configuration serveur active.
 *
 */
export const ACTIVE_SERVER_KEY: ServerConfigKey = 
 (process.env.NEXT_PUBLIC_SERVER_CONFIG as ServerConfigKey) ?? 'GLOBAL_OW12';

/**
 * Configuration serveur active résolue.
 */
export const ACTIVE_SERVER = SERVER_CONFIGS[ACTIVE_SERVER_KEY];

// Limites de stats
/**
 * Limites min/max des stats de personnage et de combat.
 *
 * Ces caps sont appliqués dans les calculs pour éviter les dépassements et assurer
 * game balance according to WWM's design.
 */
export const STAT_LIMITS = {
 /**
 * Niveau maximum du personnage.
 * Dépend du serveur actif (Global OW12: 85, CN OW15: 100).
 */
 MAX_LEVEL: ACTIVE_SERVER.MAX_LEVEL,

 /**
 * Valeur d'attaque maximale avant débordement.
 * Cap théorique de l'attaque physique.
 */
 MAX_ATTACK: 99999,

 /**
 * Valeur de défense maximale avant débordement.
 * Cap théorique de la défense.
 */
 MAX_DEFENSE: 99999,

 /**
 * Cap maximum du taux de critique.
 * Les coups critiques ne peuvent dépasser 80%.
 *
 */
 MAX_CRITICAL_RATE: 0.8,

 /**
 * Cap maximum du taux de précision (toucher).
 * Cap de précision à 95% — les ratés sont toujours possibles.
 *
 * Réf. : WWM-Formules-Reference-v1.3.md section 6.2
 *
 */
 MAX_PRECISION_RATE: 1.0,

 /**
 * Cap maximum du taux d'affinité.
 * Les procs d'affinité ne peuvent dépasser 60%.
 *
 * Cap conservatif à 60%.
 *
 * Réf. : WWM-Formules-Reference-v1.3.md section 6.4
 */
 MAX_AFFINITY_RATE: 0.6,

 /**
 * Dégâts minimum infligés sur un toucher réussi.
 * Empêche les dégâts nuls ou négatifs par excès de défense.
 */
 MIN_DAMAGE: 1,
} as const;

// Constantes de calcul
/**
 * Constantes des formules de calcul de dégâts.
 *
 * Valeurs dérivées des formules hyperboliques de réduction
 * validées par la communauté CN et wherewindsmeetcalculator.com.
 *
 * Réf. : WWM-Formules-Reference-v1.3.md section 2
 */
export const CALCULATION_CONSTANTS = {
 /**
 * Constante de défense pour la formule hyperbolique.
 *
 * Formule : Réduction = Défense / (Défense + 2860)
 *
 * Détermine la courbe de rendements décroissants de la défense.
 * Les valeurs de défense élevées ont un impact progressivement réduit sur la réduction.
 *
 */
 DEFENSE_CONSTANT: 2860,

 /**
 * Constante de résistance élémentaire pour la formule hyperbolique.
 *
 * Formule : Réduction = Résistance / (Résistance + 530)
 *
 * Constante 530 → rendements décroissants plus rapides que la défense physique.
 *
 */
 ELEM_RESIST_CONSTANT: 530,

 /**
 * Constante de taux critique pour la formule hyperbolique.
 *
 * Utilisé dans : Crit Rate = 1.15 × (Crit / (Crit + 938))
 *
 * La constante 938 détermine la courbe de scaling du taux critique.
 * Combiné au multiplicateur 1.15, permet d'atteindre le cap de 80%.
 *
 */
 CRIT_RATE_CONSTANT: 938,

 /**
 * Constante de précision pour la formule hyperbolique.
 *
 * Formule : Taux = 95% × (1.43 × Précision / (Précision + Parade + 150))
 *
 * La constante de base 150 est ajoutée à la parade pour établir un minimum
 * denominator, ensuring precision scaling is smooth even at low values.
 *
 */
 PRECISION_CONSTANT: 150,

 /**
 * Constante diviseur de précision (variante de formule alternative).
 *
 * HISTORICAL VERSIONS:
 * - v1.0 to v1.2: 3640
 * - v1.3+: 3678 (current)
 *
 * Dans certaines variantes, la précision utilise un diviseur fixe :
 * Variante : Precision Rate = Precision / (Precision + 3678)
 *
 * Cette constante 3678 est gardée pour référence et ajustements PVP.
 *
 * @verified Source: Bahamut forum guide v1.3.1, @逆水寒
 * @note Impact mineur : < 0.5% de différence sur le taux de précision final
 *
 * Réf. : WWM-Formules-Reference-v1.3.md section 2.1, 6.2
 */
 PRECISION_DIVIDER: 3678,

 /**
 * Taux de précision de base avant scaling.
 *
 * Tous les calculs de précision sont plafonnés à 95%.
 *
 * Utilisé dans : Final Rate = BASE_PRECISION_RATE × (calculated_rate)
 *
 * Réf. : WWM-Formules-Reference-v1.3.md section 6.2
 */
 BASE_PRECISION_RATE: 0.95,

 /**
 * Coefficient multiplicateur de précision.
 *
 * HISTORICAL VERSIONS:
 * - v1.0 to v1.2: 1.42
 * - v1.3+: 1.43 (current)
 *
 * Le multiplicateur 1.43 dans la formule de précision permet d'atteindre le cap de 95%
 * with realistic precision values.
 *
 * Formule v1.3+ : Rate = 95% × (1.43 × Precision / (Precision + Parry + 150))
 *
 * @verified Source: Bahamut forum guide v1.3.1, @逆水寒
 *
 * Réf. : WWM-Formules-Reference-v1.3.md section 6.2
 */
 PRECISION_MULTIPLIER: 1.43,

 /**
 * Coefficient multiplicateur de critique.
 *
 * Le multiplicateur 1.15 dans la formule critique permet d'atteindre le cap de 80%
 * with high crit values.
 *
 * Formule : Crit Rate = 1.15 × (Crit / (Crit + 938))
 *
 * Réf. : WWM-Formules-Reference-v1.3.md section 6.3
 */
 CRIT_RATE_MULTIPLIER: 1.15,
} as const;

// Multiplicateurs de dégâts
/**
 * Multiplicateurs de dégâts selon le résultat de combat.
 *
 * Ces multiplicateurs sont appliqués aux pools de dégâts selon
 * le résultat du coup (normal, critique, affinité, etc.).
 *
 * Réf. : WWM-Formules-Reference-v1.3.md section 6, 8
 */
export const DAMAGE_MULTIPLIERS = {
 /**
 * Multiplicateur de dégâts normaux (sans effets spéciaux).
 * Dégâts de base sans critique ni affinité.
 */
 NORMAL: 1.0,

 /**
 * Multiplicateur de dégâts critiques de base.
 *
 * Les critiques infligent 150% des dégâts de base (×1.5).
 * Les bonus de dégâts critiques d'équipement/talents s'ajoutent.
 *
 * Final Crit Multiplier = 1.5 + Crit Damage Bonus
 *
 */
 CRITICAL: 1.5,

 /**
 * Multiplicateur de dégâts d'affinité de base.
 *
 * L'affinité (会意) inflige 135% des dégâts de base (×1.35).
 * Les bonus de dégâts d'affinité d'équipement/talents s'ajoutent.
 *
 * Final Affinity Multiplier = 1.35 + Affinity Damage Bonus
 *
 * Mis à jour d'après la validation communautaire niveau 80.
 *
 */
 AFFINITY: 1.35,

 /**
 * Multiplicateur combiné critique + affinité.
 *
 * Quand critique et affinité se déclenchent sur le même coup,
 * les bonus de dégâts sont ADDITIFS (pas multiplicatifs).
 *
 * Base Combined = 1 + 0.5 (crit bonus) + 0.35 (affinity bonus) = 1.85 (185% damage)
 *
 * Formula: Dégâts = Dégâts Bruts × (1 + Bonus Crit + Bonus Affinité)
 *
 * sont ajoutés au bonus total avant application du multiplicateur.
 *
 */
 CRITICAL_AFFINITY: 1.85,

 /**
 * Multiplicateur de dégâts d'abrasion (擦伤).
 *
 * L'abrasion se produit quand la précision ne connecte pas pleinement.
 * Inflige seulement 50% des dégâts de base (×0.5).
 *
 * Constante pour le cas de base.
 *
 * Réf. : WWM-Formules-Reference-v1.3.md section 13.8
 */
 ABRASION: 0.5,
} as const;

// Stats par défaut niveau 80
/**
 * Plages de stats de référence pour personnages niveau 80 en PVE.
 *
 * These values represent common stat ranges for well-equipped Level 80 characters.
 * Utilisé pour :
 * - Build validation
 * - Default calculator values
 * - Sanity checks
 *
 * - Class/weapon type
 * - Gear quality (blue, purple, gold)
 * - Set bonuses
 * - Inner ways (心法) and mystic arts (绝技)
 *
 * Réf. : compilation communautaire de wherewindsmeetcalculator.com
 */
export const DEFAULT_LEVEL_80_STATS = {
 /**
 * Plage d'attaque physique niveau 80.
 * Min: Fresh Level 80 with blue/purple gear
 * Max: Well-geared with gold equipment and optimized stats
 */
 attack: { min: 8500, max: 9500 },

 /**
 * Plage d'attaque élémentaire niveau 80.
 * Généralement inférieure à l'attaque physique.
 * Les builds élémentaires peuvent atteindre des valeurs plus élevées avec équipement spécialisé.
 */
 elementalAttack: { min: 1200, max: 1400 },

 /**
 * Valeur de défense pour contenu PVE niveau 80.
 * Affecte la réduction de dégâts physiques via formule hyperbolique.
 */
 defense: 4200,

 /**
 * Elemental resistance for Level 80 PVE content.
 * Affecte la réduction de dégâts élémentaires.
 *
 * résistance à leur élément faible (jusqu'à -353 pour un multiplicateur ×3).
 */
 elemResist: 1800,

 /**
 * Stat critique (valeur brute, pas pourcentage).
 */
 critical: 3500,

 /**
 * Stat précision (valeur brute, pas pourcentage).
 */
 precision: 8000,

 /**
 * Taux d'affinité (décimal, pas stat brute).
 * Typical Level 80 build has 25% base affinity rate.
 */
 affinity: 0.25,

 /**
 * Bonus de dégâts critiques (décimal).
 * +50% crit damage means 200% total (1.5 base + 0.5 bonus).
 */
 criticalBonus: 0.5,

 /**
 * Bonus de dégâts d'affinité (décimal).
 * +35% affinity damage means 170% total (1.35 base + 0.35 bonus).
 */
 affinityBonus: 0.35,
} as const;

// Stats par défaut niveau 85 (Global OW12)
/**
 * Statistiques de référence pour un personnage niveau 85 (Global OW12).
 *
 * Ces valeurs représentent les statistiques typiques d'un personnage bien équipé
 * au niveau 85 sur la version Global OW12.
 *
 * Utilisé pour :
 * - Valeurs par défaut du calculateur (serveur Global)
 * - Tests unitaires niveau 85
 * - Validation des builds niveau 85
 *
 * Note : Les stats réelles varient significativement selon :
 * - Classe/type d'arme (Épée vs Arc vs Lance)
 * - Type de build (Physique vs Élémentaire vs Hybride)
 * - Optimisation ciblée (DPS burst vs DPS soutenu)
 *
 * Référence : Données communautaires serveurs Global OW12
 */
export const DEFAULT_LEVEL_85_STATS = {
 /**
 * Niveau du personnage.
 */
 level: 85,

 /**
 * Attaque physique de base.
 * Level 85 Global : ~20% supérieure au level 80.
 */
 attack: 3200,

 /**
 * Attaque physique minimale (variance).
 */
 attackMin: 2900,

 /**
 * Attaque physique maximale (variance).
 */
 attackMax: 3500,

 /**
 * Attaque élémentaire.
 * Environ 50% de l'attaque physique pour un build équilibré.
 */
 elementalAttack: 1600,

 /**
 * Défense physique.
 * Protège contre les dégâts physiques.
 */
 defense: 1900,

 /**
 * Résistance élémentaire.
 * Protège contre les dégâts élémentaires.
 */
 resistance: 350,

 /**
 * Statistique de critique (valeur brute).
 * Converti en taux via formule hyperbolique.
 * Typiquement ~70-75% de taux de critique au level 85.
 */
 critical: 3500,

 /**
 * Statistique de précision (valeur brute).
 * Converti en taux via formule hyperbolique.
 * Typiquement ~90-95% de chance de toucher au level 85.
 */
 precision: 7000,

 /**
 * Taux d'affinité (décimal 0-1).
 * Stat directe, pas de formule de conversion.
 * 40% est un bon équilibre pour un build niveau 85.
 */
 affinityRate: 0.40,

 /**
 * Pénétration d'armure.
 * Réduit la défense de la cible avant calcul.
 */
 armorPenetration: 900,

 /**
 * Pénétration élémentaire.
 * Réduit la résistance de la cible avant calcul.
 */
 elementalPenetration: 500,

 /**
 * Bouclier Qi (en décimal 0-1).
 * 20% de réduction linéaire des dégâts physiques reçus.
 */
 shield: 0.20,

 /**
 * Esquive/Parade.
 * Réduit la précision des attaquants.
 */
 evasion: 400,

 /**
 * Résistance aux critiques (PVP principalement).
 * Réduit le taux de critique des attaquants.
 */
 criticalResistance: 600,
} as const;

// Configuration DPS
/**
 * Configuration values for DPS calculations and rotation simulations.
 *
 * Ces paramètres contrôlent les simulations de rotation
 * et comment les métriques DPS sont calculées.
 *
 * Réf. : WWM-Formules-Reference-v1.3.md section 10, 12
 */
export const DPS_CONFIG = {
 /**
 * Durée de rotation par défaut pour calculs DPS (secondes).
 *
 * 60 seconds is the standard window for DPS comparisons because:
 * - Most skill cooldowns fit within 60s
 * - Long enough to smooth out RNG variance
 * - Short enough for practical testing
 *
 * Typical use: Raid boss DPS window, dummy target tests
 */
 DEFAULT_ROTATION_DURATION: 60,

 /**
 * Durée de rotation minimum (secondes).
 *
 * Rotations shorter than 10s are too brief for meaningful DPS metrics
 * due to:
 * - High variance from RNG (crits, affinity procs)
 * - Cooldown skewing (some skills may not be usable)
 * - Opening burst not representative of sustained DPS
 */
 MIN_ROTATION_DURATION: 10,

 /**
 * Durée de rotation maximum (secondes).
 *
 * Les rotations de plus de 5 min (300s) sont peu pertinentes :
 * - Calculator performance (too many iterations)
 * - Scénarios réels (la plupart des combats sont plus courts)
 * - Rendements décroissants sur la précision (60-120s suffit)
 */
 MAX_ROTATION_DURATION: 300,

 /**
 * DPS de référence pour le calcul du Graduation Rate.
 *
 * - Gold gear with optimal stats
 * - Fully leveled inner ways and mystic arts
 * - Perfect rotation execution
 * - No downtime
 *
 * Sert au calcul : Graduation Rate = (DPS joueur / DPS référence) × 100%
 *
 * - Class/weapon type (Sword vs Bow vs Spear)
 * - Build type (Physical vs Elemental vs Hybrid)
 *
 * This value (50,000 DPS) represents a mid-range optimal build.
 * Top-tier builds can exceed 60,000 DPS in ideal conditions.
 *
 * Reference: Community data from Level 80 theorycrafters
 */
 GRADUATION_REFERENCE_DPS: 50000,
} as const;

// Exports de types
/**
 * Inférence de types littéraux depuis les constantes.
 *
 * Ces exports de types permettent à TypeScript de traiter les constantes comme types littéraux,
 * enabling better type checking and autocomplete.
 *
 */
export type StatLimits = typeof STAT_LIMITS;
export type CalculationConstants = typeof CALCULATION_CONSTANTS;
export type DamageMultipliers = typeof DAMAGE_MULTIPLIERS;
export type DefaultLevel80Stats = typeof DEFAULT_LEVEL_80_STATS;
export type DefaultLevel85Stats = typeof DEFAULT_LEVEL_85_STATS;
export type DpsConfig = typeof DPS_CONFIG;
