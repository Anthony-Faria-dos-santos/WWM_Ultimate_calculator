import { TEST_FIXTURES, createCharacter, createSkill, createTarget } from '../fixtures';
import {
  characterBaseStatsSchema,
  targetSchema,
  skillSchema,
  damageBonusSchema,
  createBuildSchema,
  updateBuildSchema,
  calculateDamageSchema,
  calculateRotationSchema,
  calculateExpectedSchema,
  calculateCompareSchema,
  calculateMarginalSchema,
  calculateGraduationSchema,
  paginationSchema,
  equipmentPieceSchema,
  setStatModifierSchema,
  skillTalentSchema,
  equipmentSlotEnum,
} from '@/lib/validation/schemas';

// ─── characterBaseStatsSchema ───────────────────────────────────────

describe('characterBaseStatsSchema', () => {
  it('accepte un personnage DPS standard valide', () => {
    const result = characterBaseStatsSchema.safeParse(TEST_FIXTURES.characters.standardDPS);
    expect(result.success).toBe(true);
  });

  it('rejette si level manquant', () => {
    const { level: _, ...sansLevel } = TEST_FIXTURES.characters.standardDPS;
    const result = characterBaseStatsSchema.safeParse(sansLevel);
    expect(result.success).toBe(false);
  });

  it('rejette si level > 100', () => {
    const data = createCharacter({ level: 101 });
    const result = characterBaseStatsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejette si affinityRate > 1', () => {
    const data = createCharacter({ affinityRate: 1.5 });
    const result = characterBaseStatsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejette un objet vide', () => {
    const result = characterBaseStatsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── targetSchema ───────────────────────────────────────────────────

describe('targetSchema', () => {
  it('accepte un ennemi standard valide', () => {
    const result = targetSchema.safeParse(TEST_FIXTURES.targets.standardEnemy);
    expect(result.success).toBe(true);
  });

  it('rejette si shield > 1', () => {
    const data = createTarget({ shield: 1.5 });
    const result = targetSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejette si shield < 0', () => {
    const data = createTarget({ shield: -0.1 });
    const result = targetSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepte sans critResistance (optionnel)', () => {
    const { critResistance: _, ...sansCritRes } = {
      ...TEST_FIXTURES.targets.standardEnemy,
      critResistance: 50,
    };
    delete (sansCritRes as Record<string, unknown>).critResistance;
    const result = targetSchema.safeParse(sansCritRes);
    expect(result.success).toBe(true);
  });

  it('accepte avec critResistance', () => {
    const data = createTarget({ critResistance: 100 });
    const result = targetSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

// ─── skillSchema ────────────────────────────────────────────────────

describe('skillSchema', () => {
  it('accepte une attaque de base valide', () => {
    const result = skillSchema.safeParse(TEST_FIXTURES.skills.basicAttack);
    expect(result.success).toBe(true);
  });

  it('rejette si damageType invalide', () => {
    const data = createSkill({ damageType: 'unknown' as never });
    const result = skillSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejette si element invalide', () => {
    const data = createSkill({ element: 'dark' as never });
    const result = skillSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepte weaponType null (skill universelle)', () => {
    const data = createSkill({ weaponType: null });
    const result = skillSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accepte avec talents non vides', () => {
    const data = createSkill({
      talents: [{
        id: 'talent-1',
        name: 'Maîtrise',
        description: 'Augmente les dégâts physiques',
        level: 3,
        physicalRatioBonus: 0.15,
      }],
    });
    const result = skillSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

// ─── damageBonusSchema ──────────────────────────────────────────────

describe('damageBonusSchema', () => {
  it('accepte un bonus valide', () => {
    const result = damageBonusSchema.safeParse({
      category: 'augmentation',
      value: 0.2,
      source: 'Set Bonus',
    });
    expect(result.success).toBe(true);
  });

  it('rejette une category invalide', () => {
    const result = damageBonusSchema.safeParse({
      category: 'inexistant',
      value: 0.2,
      source: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('accepte avec subGroup optionnel', () => {
    const result = damageBonusSchema.safeParse({
      category: 'independent',
      value: 0.1,
      source: 'Buff passif',
      subGroup: 'groupeA',
    });
    expect(result.success).toBe(true);
  });
});

// ─── createBuildSchema ──────────────────────────────────────────────

describe('createBuildSchema', () => {
  const validBuild = {
    name: 'Mon build DPS',
    character: {
      level: 80,
      weaponId: 'weapon-sword-01',
      objective: 'pve' as const,
    },
    stats: TEST_FIXTURES.characters.standardDPS,
  };

  it('accepte un payload complet valide', () => {
    const result = createBuildSchema.safeParse(validBuild);
    expect(result.success).toBe(true);
  });

  it('rejette si name vide', () => {
    const result = createBuildSchema.safeParse({ ...validBuild, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejette si name > 100 caractères', () => {
    const result = createBuildSchema.safeParse({
      ...validBuild,
      name: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejette si objective invalide', () => {
    const result = createBuildSchema.safeParse({
      ...validBuild,
      character: { ...validBuild.character, objective: 'raid' },
    });
    expect(result.success).toBe(false);
  });

  it('rejette si stats manquantes', () => {
    const { stats: _, ...sanStats } = validBuild;
    const result = createBuildSchema.safeParse(sanStats);
    expect(result.success).toBe(false);
  });

  it('accepte sans champs optionnels', () => {
    const result = createBuildSchema.safeParse(validBuild);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
      expect(result.data.target).toBeUndefined();
      expect(result.data.equipment).toBeUndefined();
      expect(result.data.rotation).toBeUndefined();
      expect(result.data.activeBuffs).toBeUndefined();
    }
  });
});

// ─── updateBuildSchema ──────────────────────────────────────────────

describe('updateBuildSchema', () => {
  it('accepte un objet partiel', () => {
    const result = updateBuildSchema.safeParse({ name: 'Nouveau nom' });
    expect(result.success).toBe(true);
  });

  it('accepte un objet vide (tout est optionnel)', () => {
    const result = updateBuildSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ─── calculateDamageSchema ──────────────────────────────────────────

describe('calculateDamageSchema', () => {
  const validPayload = {
    stats: TEST_FIXTURES.characters.standardDPS,
    skill: TEST_FIXTURES.skills.basicAttack,
    target: TEST_FIXTURES.targets.standardEnemy,
  };

  it('accepte un payload valide', () => {
    const result = calculateDamageSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejette sans stats', () => {
    const { stats: _, ...sansStats } = validPayload;
    const result = calculateDamageSchema.safeParse(sansStats);
    expect(result.success).toBe(false);
  });

  it('accepte avec bonuses optionnelles', () => {
    const result = calculateDamageSchema.safeParse({
      ...validPayload,
      bonuses: [{ category: 'augmentation', value: 0.15, source: 'Buff' }],
    });
    expect(result.success).toBe(true);
  });
});

// ─── calculateRotationSchema ────────────────────────────────────────

describe('calculateRotationSchema', () => {
  const validPayload = {
    stats: TEST_FIXTURES.characters.standardDPS,
    skills: [TEST_FIXTURES.skills.basicAttack],
    target: TEST_FIXTURES.targets.standardEnemy,
  };

  it('accepte avec skills array min 1', () => {
    const result = calculateRotationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejette skills array vide', () => {
    const result = calculateRotationSchema.safeParse({
      ...validPayload,
      skills: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepte mode deterministic', () => {
    const result = calculateRotationSchema.safeParse({
      ...validPayload,
      mode: 'deterministic',
    });
    expect(result.success).toBe(true);
  });

  it('accepte mode expected', () => {
    const result = calculateRotationSchema.safeParse({
      ...validPayload,
      mode: 'expected',
    });
    expect(result.success).toBe(true);
  });

  it('applique duration par défaut à 60', () => {
    const result = calculateRotationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBe(60);
    }
  });

  it('applique mode par défaut à expected', () => {
    const result = calculateRotationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe('expected');
    }
  });
});

// ─── calculateExpectedSchema ────────────────────────────────────────

describe('calculateExpectedSchema', () => {
  it('accepte un payload valide', () => {
    const result = calculateExpectedSchema.safeParse({
      stats: TEST_FIXTURES.characters.standardDPS,
      skill: TEST_FIXTURES.skills.basicAttack,
      target: TEST_FIXTURES.targets.standardEnemy,
    });
    expect(result.success).toBe(true);
  });
});

// ─── calculateCompareSchema ─────────────────────────────────────────

describe('calculateCompareSchema', () => {
  const validBuild = {
    name: 'Build A',
    stats: TEST_FIXTURES.characters.standardDPS,
    skills: [TEST_FIXTURES.skills.basicAttack],
    bonuses: [{ category: 'augmentation' as const, value: 0.1, source: 'Set' }],
  };

  it('accepte deux builds valides avec target', () => {
    const result = calculateCompareSchema.safeParse({
      build1: validBuild,
      build2: { ...validBuild, name: 'Build B' },
      target: TEST_FIXTURES.targets.standardEnemy,
    });
    expect(result.success).toBe(true);
  });

  it('rejette si build1 manquant', () => {
    const result = calculateCompareSchema.safeParse({
      build2: validBuild,
      target: TEST_FIXTURES.targets.standardEnemy,
    });
    expect(result.success).toBe(false);
  });
});

// ─── calculateMarginalSchema ────────────────────────────────────────

describe('calculateMarginalSchema', () => {
  const validPayload = {
    stats: TEST_FIXTURES.characters.standardDPS,
    skills: [TEST_FIXTURES.skills.basicAttack],
    target: TEST_FIXTURES.targets.standardEnemy,
  };

  it('accepte un payload valide', () => {
    const result = calculateMarginalSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejette skills vide', () => {
    const result = calculateMarginalSchema.safeParse({
      ...validPayload,
      skills: [],
    });
    expect(result.success).toBe(false);
  });
});

// ─── calculateGraduationSchema ──────────────────────────────────────

describe('calculateGraduationSchema', () => {
  it('accepte des DPS valides', () => {
    const result = calculateGraduationSchema.safeParse({
      yourDPS: 15000,
      referenceDPS: 20000,
    });
    expect(result.success).toBe(true);
  });

  it('rejette yourDPS négatif', () => {
    const result = calculateGraduationSchema.safeParse({
      yourDPS: -100,
      referenceDPS: 20000,
    });
    expect(result.success).toBe(false);
  });

  it('rejette referenceDPS = 0', () => {
    const result = calculateGraduationSchema.safeParse({
      yourDPS: 15000,
      referenceDPS: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ─── paginationSchema ───────────────────────────────────────────────

describe('paginationSchema', () => {
  it('applique les valeurs par défaut', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort).toBe('newest');
    }
  });

  it('coerce les strings en nombres (query params)', () => {
    const result = paginationSchema.safeParse({ page: '2', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it('accepte des valeurs personnalisées', () => {
    const result = paginationSchema.safeParse({ page: 3, limit: 50, sort: 'dps' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
      expect(result.data.sort).toBe('dps');
    }
  });

  it('rejette page < 1', () => {
    const result = paginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejette limit > 100', () => {
    const result = paginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});

// ─── equipmentPieceSchema ───────────────────────────────────────────

describe('equipmentPieceSchema', () => {
  const validPiece = {
    id: 'equip-001',
    name: 'Épée légendaire',
    slot: 'weapon' as const,
    setId: 'set-dragon',
    rarity: 'legendary' as const,
    statModifiers: [{ stat: 'attack', value: 150, isPercentage: false }],
  };

  it('accepte une pièce valide', () => {
    const result = equipmentPieceSchema.safeParse(validPiece);
    expect(result.success).toBe(true);
  });

  it('rejette si slot invalide', () => {
    const result = equipmentPieceSchema.safeParse({ ...validPiece, slot: 'back' });
    expect(result.success).toBe(false);
  });
});

// ─── setStatModifierSchema ──────────────────────────────────────────

describe('setStatModifierSchema', () => {
  it('accepte un modificateur valide', () => {
    const result = setStatModifierSchema.safeParse({
      stat: 'critRate',
      value: 50,
      isPercentage: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejette si stat vide', () => {
    const result = setStatModifierSchema.safeParse({
      stat: '',
      value: 50,
      isPercentage: false,
    });
    expect(result.success).toBe(false);
  });
});

// ─── skillTalentSchema ──────────────────────────────────────────────

describe('skillTalentSchema', () => {
  it('accepte un talent valide', () => {
    const result = skillTalentSchema.safeParse({
      id: 'talent-01',
      name: 'Maîtrise du feu',
      description: 'Augmente les dégâts de feu',
      level: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejette si level > 10', () => {
    const result = skillTalentSchema.safeParse({
      id: 'talent-01',
      name: 'Maîtrise',
      description: 'Desc',
      level: 11,
    });
    expect(result.success).toBe(false);
  });
});

// ─── equipmentSlotEnum ──────────────────────────────────────────────

describe('equipmentSlotEnum', () => {
  it('accepte un slot valide', () => {
    const result = equipmentSlotEnum.safeParse('weapon');
    expect(result.success).toBe(true);
  });

  it('rejette un slot invalide', () => {
    const result = equipmentSlotEnum.safeParse('shoulders');
    expect(result.success).toBe(false);
  });
});
