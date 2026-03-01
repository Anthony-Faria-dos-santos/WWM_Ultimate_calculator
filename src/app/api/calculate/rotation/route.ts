import { NextResponse, type NextRequest } from 'next/server';
import { CombatService } from '@/lib/services/CombatService';
import { calculateRotationSchema } from '@/lib/validation/schemas';
import type { CharacterBaseStats, Skill, Target } from '@/lib/types';
import type { DamageBonus } from '@/lib/calculators';

/**
 * POST /api/calculate/rotation — Simulation rotation DPS.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = calculateRotationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { stats, skills, target, duration, bonuses, mode } = parsed.data;
    const service = new CombatService();

    const castedStats = stats as CharacterBaseStats;
    const castedSkills = skills as unknown as Skill[];
    const castedTarget = target as Target;
    const castedBonuses = (bonuses ?? []) as readonly DamageBonus[];
    const dur = duration ?? 60;

    const result = mode === 'deterministic'
      ? service.simulateRotation(castedStats, castedSkills, castedTarget, dur, castedBonuses)
      : service.simulateExpectedRotation(castedStats, castedSkills, castedTarget, dur, castedBonuses);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] POST /api/calculate/rotation error:', error);
    return NextResponse.json(
      { error: 'Erreur de calcul' },
      { status: 500 }
    );
  }
}
