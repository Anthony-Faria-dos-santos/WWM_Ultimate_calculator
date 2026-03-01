import { NextRequest } from 'next/server';
import { TEST_FIXTURES } from '../fixtures';
import { POST as calculateDamage } from '@/app/api/calculate/damage/route';
import { POST as calculateExpected } from '@/app/api/calculate/expected/route';
import { POST as calculateGraduation } from '@/app/api/calculate/graduation/route';
import { POST as calculateRotation } from '@/app/api/calculate/rotation/route';
import { POST as calculateCompare } from '@/app/api/calculate/compare/route';
import { POST as calculateMarginal } from '@/app/api/calculate/marginal/route';

// ─── Helpers ────────────────────────────────────────────────────────

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/test'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const validDamagePayload = {
  stats: TEST_FIXTURES.characters.standardDPS,
  skill: TEST_FIXTURES.skills.basicAttack,
  target: TEST_FIXTURES.targets.standardEnemy,
};

const validRotationPayload = {
  stats: TEST_FIXTURES.characters.standardDPS,
  skills: [TEST_FIXTURES.skills.basicAttack, TEST_FIXTURES.skills.strongSkill],
  target: TEST_FIXTURES.targets.standardEnemy,
};

// ─── POST /api/calculate/damage ─────────────────────────────────────

describe('POST /api/calculate/damage', () => {
  it('retourne 200 avec résultat de dégâts valide', async () => {
    const res = await calculateDamage(createPostRequest(validDamagePayload));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('finalDamage');
  });

  it('retourne 400 avec body invalide', async () => {
    const res = await calculateDamage(createPostRequest({ stats: {} }));
    expect(res.status).toBe(400);
  });

  it('produit un finalDamage strictement positif', async () => {
    const res = await calculateDamage(createPostRequest(validDamagePayload));
    const data = await res.json();
    expect(data.finalDamage).toBeGreaterThan(0);
  });
});

// ─── POST /api/calculate/expected ───────────────────────────────────

describe('POST /api/calculate/expected', () => {
  it('retourne 200 avec expected value complet', async () => {
    const res = await calculateExpected(createPostRequest(validDamagePayload));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('expectedDamage');
    expect(data).toHaveProperty('distribution');
    expect(data).toHaveProperty('variance');
    expect(data.expectedDamage).toBeGreaterThan(0);
  });
});

// ─── POST /api/calculate/graduation ─────────────────────────────────

describe('POST /api/calculate/graduation', () => {
  it('retourne 200 avec graduation result', async () => {
    const res = await calculateGraduation(createPostRequest({
      yourDPS: 15000,
      referenceDPS: 20000,
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('rating');
    expect(data).toHaveProperty('graduationRate');
    expect(data.yourDPS).toBe(15000);
    expect(data.referenceDPS).toBe(20000);
  });

  it('retourne 400 si referenceDPS manquant', async () => {
    const res = await calculateGraduation(createPostRequest({ yourDPS: 15000 }));
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/calculate/rotation ───────────────────────────────────

describe('POST /api/calculate/rotation', () => {
  it('retourne 200 avec rotation result', async () => {
    const res = await calculateRotation(createPostRequest(validRotationPayload));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('dps');
    expect(data.dps).toBeGreaterThan(0);
    expect(data).toHaveProperty('skillUsages');
    expect(data.skillUsages.length).toBeGreaterThan(0);
  });

  it('utilise le mode expected par défaut', async () => {
    const res = await calculateRotation(createPostRequest(validRotationPayload));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.dps).toBeGreaterThan(0);
  });

  it('accepte le mode deterministic', async () => {
    const res = await calculateRotation(createPostRequest({
      ...validRotationPayload,
      mode: 'deterministic',
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.dps).toBeGreaterThan(0);
  });
});

// ─── POST /api/calculate/compare ────────────────────────────────────

describe('POST /api/calculate/compare', () => {
  it('retourne 200 avec comparaison de builds', async () => {
    const payload = {
      build1: {
        name: 'Build Physique',
        stats: TEST_FIXTURES.characters.standardDPS,
        skills: [TEST_FIXTURES.skills.basicAttack],
        bonuses: [{ category: 'augmentation', value: 0.1, source: 'Set' }],
      },
      build2: {
        name: 'Build Élémentaire',
        stats: TEST_FIXTURES.characters.standardDPS,
        skills: [TEST_FIXTURES.skills.elementalSkill],
        bonuses: [{ category: 'augmentation', value: 0.1, source: 'Set' }],
      },
      target: TEST_FIXTURES.targets.standardEnemy,
    };

    const res = await calculateCompare(createPostRequest(payload));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('winner');
    expect(data).toHaveProperty('dpsAdvantage');
    expect(data.build1Name).toBe('Build Physique');
    expect(data.build2Name).toBe('Build Élémentaire');
  });
});

// ─── POST /api/calculate/marginal ───────────────────────────────────

describe('POST /api/calculate/marginal', () => {
  it('retourne 200 avec gains marginaux', async () => {
    const res = await calculateMarginal(createPostRequest(validRotationPayload));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('résultats triés par efficiency décroissante', async () => {
    const res = await calculateMarginal(createPostRequest(validRotationPayload));
    const data = await res.json();

    for (let i = 1; i < data.length; i++) {
      expect(data[i - 1].efficiency).toBeGreaterThanOrEqual(data[i].efficiency);
    }
  });
});
