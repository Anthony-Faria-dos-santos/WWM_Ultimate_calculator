/**
 * Store principal du calculateur — personnage, stats, équipement, résultats.
 *
 * Persisté en localStorage (character, stats, equipment).
 * Les résultats et comparaisons ne sont PAS persistés.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CharacterBaseStats } from '@/lib/types/Character.types';
import type {
  EquipmentSlot,
  EquipmentPiece,
  SetStatModifier,
} from '@/lib/types/EquipmentSet.types';
import type {
  GraduationResult,
  DamageDistribution,
  BuildComparison,
} from '@/lib/types/DPS.types';

// ─── Types du store ────────────────────────────────────────────

export interface CharacterInfo {
  name: string;
  level: number;
  weaponId: string;
  innerWayId: string;
  objective: 'pve' | 'pvp';
}

export interface CalculationResults {
  dps: number;
  graduation: GraduationResult | null;
  damageDistribution: DamageDistribution | null;
  marginalGains: Array<{ stat: string; gainPercent: number; efficiency: number }>;
}

export interface ComparisonState {
  active: boolean;
  slot: EquipmentSlot | null;
  newPiece: EquipmentPiece | null;
  impact: BuildComparison | null;
}

export interface RotationEntry {
  skillId: string;
  order: number;
}

// ─── State + Actions ───────────────────────────────────────────

interface CalculatorState {
  // Personnage
  character: CharacterInfo;
  stats: CharacterBaseStats;

  // Équipement
  equipment: Partial<Record<EquipmentSlot, EquipmentPiece | null>>;
  enhanceLevels: Partial<Record<EquipmentSlot, number>>;
  harmonisation: Partial<Record<EquipmentSlot, SetStatModifier[]>>;

  // Rotation & buffs
  rotation: RotationEntry[];
  activeBuffs: string[];

  // Résultats (non persistés)
  results: CalculationResults;
  comparison: ComparisonState;

  // Méta
  isDirty: boolean;
  buildId: string | null;
}

interface CalculatorActions {
  // Personnage
  setCharacterField: <K extends keyof CharacterInfo>(field: K, value: CharacterInfo[K]) => void;
  setStat: <K extends keyof CharacterBaseStats>(stat: K, value: CharacterBaseStats[K]) => void;
  setStats: (stats: Partial<CharacterBaseStats>) => void;

  // Équipement
  setEquipmentPiece: (slot: EquipmentSlot, piece: EquipmentPiece | null) => void;
  setEnhanceLevel: (slot: EquipmentSlot, level: number) => void;
  setHarmonisation: (slot: EquipmentSlot, mods: SetStatModifier[]) => void;

  // Rotation
  setRotation: (rotation: RotationEntry[]) => void;
  addToRotation: (skillId: string) => void;
  removeFromRotation: (index: number) => void;

  // Buffs
  toggleBuff: (buffId: string) => void;

  // Comparaison
  startComparison: (slot: EquipmentSlot, newPiece: EquipmentPiece) => void;
  setComparisonImpact: (impact: BuildComparison) => void;
  confirmSwap: () => void;
  cancelComparison: () => void;

  // Résultats
  setResults: (results: Partial<CalculationResults>) => void;

  // Build
  setBuildId: (id: string | null) => void;
  markClean: () => void;
  resetBuild: () => void;
}

// ─── Valeurs par défaut ────────────────────────────────────────

const DEFAULT_CHARACTER: CharacterInfo = {
  name: '',
  level: 80,
  weaponId: '',
  innerWayId: '',
  objective: 'pve',
};

const DEFAULT_STATS: CharacterBaseStats = {
  level: 80,
  attack: 0,
  attackMin: 0,
  attackMax: 0,
  elementalAttack: 0,
  defense: 0,
  resistance: 0,
  critRate: 0,
  critDamage: 0,
  affinityRate: 0,
  affinityDamage: 0,
  precision: 0,
  armorPenetration: 0,
  elementalPenetration: 0,
};

const DEFAULT_RESULTS: CalculationResults = {
  dps: 0,
  graduation: null,
  damageDistribution: null,
  marginalGains: [],
};

const DEFAULT_COMPARISON: ComparisonState = {
  active: false,
  slot: null,
  newPiece: null,
  impact: null,
};

// ─── Store ─────────────────────────────────────────────────────

export const useCalculatorStore = create<CalculatorState & CalculatorActions>()(
  persist(
    (set) => ({
      // State initial
      character: DEFAULT_CHARACTER,
      stats: DEFAULT_STATS,
      equipment: {},
      enhanceLevels: {},
      harmonisation: {},
      rotation: [],
      activeBuffs: [],
      results: DEFAULT_RESULTS,
      comparison: DEFAULT_COMPARISON,
      isDirty: false,
      buildId: null,

      // ── Personnage ──

      setCharacterField: (field, value) =>
        set((state) => ({
          character: { ...state.character, [field]: value },
          isDirty: true,
        })),

      setStat: (stat, value) =>
        set((state) => ({
          stats: { ...state.stats, [stat]: value },
          isDirty: true,
        })),

      setStats: (partial) =>
        set((state) => ({
          stats: { ...state.stats, ...partial },
          isDirty: true,
        })),

      // ── Équipement ──

      setEquipmentPiece: (slot, piece) =>
        set((state) => ({
          equipment: { ...state.equipment, [slot]: piece },
          isDirty: true,
        })),

      setEnhanceLevel: (slot, level) =>
        set((state) => ({
          enhanceLevels: { ...state.enhanceLevels, [slot]: level },
          isDirty: true,
        })),

      setHarmonisation: (slot, mods) =>
        set((state) => ({
          harmonisation: { ...state.harmonisation, [slot]: mods },
          isDirty: true,
        })),

      // ── Rotation ──

      setRotation: (rotation) => set({ rotation, isDirty: true }),

      addToRotation: (skillId) =>
        set((state) => ({
          rotation: [...state.rotation, { skillId, order: state.rotation.length }],
          isDirty: true,
        })),

      removeFromRotation: (index) =>
        set((state) => ({
          rotation: state.rotation
            .filter((_, i) => i !== index)
            .map((entry, i) => ({ ...entry, order: i })),
          isDirty: true,
        })),

      // ── Buffs ──

      toggleBuff: (buffId) =>
        set((state) => ({
          activeBuffs: state.activeBuffs.includes(buffId)
            ? state.activeBuffs.filter((id) => id !== buffId)
            : [...state.activeBuffs, buffId],
          isDirty: true,
        })),

      // ── Comparaison ──

      startComparison: (slot, newPiece) =>
        set({ comparison: { active: true, slot, newPiece, impact: null } }),

      setComparisonImpact: (impact) =>
        set((state) => ({
          comparison: { ...state.comparison, impact },
        })),

      confirmSwap: () =>
        set((state) => {
          const { slot, newPiece } = state.comparison;
          if (!slot || !newPiece) return state;
          return {
            equipment: { ...state.equipment, [slot]: newPiece },
            comparison: DEFAULT_COMPARISON,
            isDirty: true,
          };
        }),

      cancelComparison: () => set({ comparison: DEFAULT_COMPARISON }),

      // ── Résultats ──

      setResults: (partial) =>
        set((state) => ({
          results: { ...state.results, ...partial },
        })),

      // ── Build ──

      setBuildId: (id) => set({ buildId: id }),
      markClean: () => set({ isDirty: false }),

      resetBuild: () =>
        set({
          character: DEFAULT_CHARACTER,
          stats: DEFAULT_STATS,
          equipment: {},
          enhanceLevels: {},
          harmonisation: {},
          rotation: [],
          activeBuffs: [],
          results: DEFAULT_RESULTS,
          comparison: DEFAULT_COMPARISON,
          isDirty: false,
          buildId: null,
        }),
    }),
    {
      name: 'wwm-calculator',
      storage: createJSONStorage(() => localStorage),
      // Ne persister que les données éditables, pas les résultats
      partialize: (state) => ({
        character: state.character,
        stats: state.stats,
        equipment: state.equipment,
        enhanceLevels: state.enhanceLevels,
        harmonisation: state.harmonisation,
        rotation: state.rotation,
        activeBuffs: state.activeBuffs,
        buildId: state.buildId,
      }),
    },
  ),
);

// ─── Sélecteurs ────────────────────────────────────────────────

/** Nombre de pièces d'équipement non-null */
export const selectEquippedCount = (state: CalculatorState) =>
  Object.values(state.equipment).filter(Boolean).length;

/** Sets actifs détectés (setId → nombre de pièces) */
export const selectActiveSets = (state: CalculatorState) => {
  const counts = new Map<string, number>();
  for (const piece of Object.values(state.equipment)) {
    if (piece?.setId) {
      counts.set(piece.setId, (counts.get(piece.setId) ?? 0) + 1);
    }
  }
  return counts;
};

/** Le build a des résultats calculés ? */
export const selectHasResults = (state: CalculatorState) =>
  state.results.dps > 0;

/** Le build a une rotation définie ? */
export const selectHasRotation = (state: CalculatorState) =>
  state.rotation.length > 0;

/** Mode comparaison actif ? */
export const selectIsComparing = (state: CalculatorState) =>
  state.comparison.active;
