/**
 * WWM Calculator - Zustand Store
 * 
 * État global pour le calculateur de dégâts
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  CharacterStats,
  TargetStats,
  Skill,
  Buff,
  InnerWay,
  DamageResult,
  LevelTemplate,
} from '../lib/types';
import { calcDeterministicDamage } from '../lib/formulas/damage';

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_STATS: CharacterStats = {
  attExtMin: 1054,
  attExtMax: 1967,
  attPrincipalMin: 209,
  attPrincipalMax: 405,
  tauxPrecision: 0.98,
  tauxCrit: 0.368,
  degCrit: 0.5,
  tauxAffinite: 0.184,
  degAffinite: 0.35,
  penetrationPhysique: 0,
  penetrationPrincipal: 22,
  resistJugement: 0.65,
  force: 49.4,
  agilite: 49.4,
};

const DEFAULT_TARGET: TargetStats = {
  defense: 1500,
  bouclierQi: 0,
  resistElem: 0,
  resistCrit: 0,
  esquive: 0,
};

// ============================================
// STORE INTERFACE
// ============================================

interface CalculatorStore {
  // State
  stats: CharacterStats;
  target: TargetStats;
  selectedSkill: Skill | null;
  activeBuffs: Buff[];
  innerWay: InnerWay | null;
  lastResult: DamageResult | null;
  
  // Template
  selectedTemplate: string | null;
  
  // UI State
  isCalculating: boolean;
  
  // Actions - Stats
  setStats: (stats: Partial<CharacterStats>) => void;
  resetStats: () => void;
  applyTemplate: (template: LevelTemplate, templateName: string) => void;
  
  // Actions - Target
  setTarget: (target: Partial<TargetStats>) => void;
  resetTarget: () => void;
  
  // Actions - Build
  selectSkill: (skill: Skill | null) => void;
  addBuff: (buff: Buff) => void;
  removeBuff: (buffId: string) => void;
  clearBuffs: () => void;
  setInnerWay: (innerWay: InnerWay | null) => void;
  
  // Actions - Calculation
  calculate: () => void;
  
  // Actions - Presets
  loadPreset: (preset: CalculatorPreset) => void;
  savePreset: () => CalculatorPreset;
}

interface CalculatorPreset {
  name: string;
  stats: CharacterStats;
  target: TargetStats;
  buffIds: string[];
  innerWayId: string | null;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useCalculatorStore = create<CalculatorStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        stats: DEFAULT_STATS,
        target: DEFAULT_TARGET,
        selectedSkill: null,
        activeBuffs: [],
        innerWay: null,
        lastResult: null,
        selectedTemplate: '100_low',
        isCalculating: false,
        
        // Stats Actions
        setStats: (newStats) => {
          set(
            (state) => ({
              stats: { ...state.stats, ...newStats },
              lastResult: null, // Invalidate result
            }),
            false,
            'setStats'
          );
        },
        
        resetStats: () => {
          set({ stats: DEFAULT_STATS, lastResult: null }, false, 'resetStats');
        },
        
        applyTemplate: (template, templateName) => {
          set(
            {
              stats: {
                attExtMin: template.att_ext_min,
                attExtMax: template.att_ext_max,
                attPrincipalMin: template.att_principal_min,
                attPrincipalMax: template.att_principal_max,
                tauxPrecision: template.taux_precision,
                tauxCrit: template.taux_crit,
                degCrit: template.deg_crit,
                tauxAffinite: template.taux_affinite,
                degAffinite: template.deg_affinite,
                penetrationPhysique: 0,
                penetrationPrincipal: template.penetration_principal,
                resistJugement: template.resist_jugement || 0,
                force: template.force,
                agilite: template.agilite,
              },
              selectedTemplate: templateName,
              lastResult: null,
            },
            false,
            'applyTemplate'
          );
        },
        
        // Target Actions
        setTarget: (newTarget) => {
          set(
            (state) => ({
              target: { ...state.target, ...newTarget },
              lastResult: null,
            }),
            false,
            'setTarget'
          );
        },
        
        resetTarget: () => {
          set({ target: DEFAULT_TARGET, lastResult: null }, false, 'resetTarget');
        },
        
        // Build Actions
        selectSkill: (skill) => {
          set({ selectedSkill: skill, lastResult: null }, false, 'selectSkill');
        },
        
        addBuff: (buff) => {
          set(
            (state) => {
              // Avoid duplicates
              if (state.activeBuffs.find((b) => b.buffId === buff.buffId)) {
                return state;
              }
              return {
                activeBuffs: [...state.activeBuffs, buff],
                lastResult: null,
              };
            },
            false,
            'addBuff'
          );
        },
        
        removeBuff: (buffId) => {
          set(
            (state) => ({
              activeBuffs: state.activeBuffs.filter((b) => b.buffId !== buffId),
              lastResult: null,
            }),
            false,
            'removeBuff'
          );
        },
        
        clearBuffs: () => {
          set({ activeBuffs: [], lastResult: null }, false, 'clearBuffs');
        },
        
        setInnerWay: (innerWay) => {
          set({ innerWay, lastResult: null }, false, 'setInnerWay');
        },
        
        // Calculation
        calculate: () => {
          const { stats, target, selectedSkill, activeBuffs } = get();
          
          if (!selectedSkill) {
            console.warn('No skill selected');
            return;
          }
          
          set({ isCalculating: true }, false, 'calculate:start');
          
          try {
            const result = calcDeterministicDamage(
              stats,
              target,
              selectedSkill,
              activeBuffs
            );
            
            set(
              { lastResult: result, isCalculating: false },
              false,
              'calculate:success'
            );
          } catch (error) {
            console.error('Calculation error:', error);
            set({ isCalculating: false }, false, 'calculate:error');
          }
        },
        
        // Presets
        loadPreset: (preset) => {
          set(
            {
              stats: preset.stats,
              target: preset.target,
              // Note: buffs and innerWay need to be loaded from data
              lastResult: null,
            },
            false,
            'loadPreset'
          );
        },
        
        savePreset: () => {
          const { stats, target, activeBuffs, innerWay } = get();
          return {
            name: `Preset ${new Date().toISOString()}`,
            stats,
            target,
            buffIds: activeBuffs.map((b) => b.buffId),
            innerWayId: innerWay?.innerWayId || null,
          };
        },
      }),
      {
        name: 'wwm-calculator-storage',
        partialize: (state) => ({
          stats: state.stats,
          target: state.target,
          selectedTemplate: state.selectedTemplate,
        }),
      }
    ),
    { name: 'WWM Calculator' }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectDPS = (state: CalculatorStore) =>
  state.lastResult?.expectedValue || 0;

export const selectHasResult = (state: CalculatorStore) =>
  state.lastResult !== null;

export const selectCanCalculate = (state: CalculatorStore) =>
  state.selectedSkill !== null && !state.isCalculating;
