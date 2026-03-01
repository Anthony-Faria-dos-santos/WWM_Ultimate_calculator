import { NextResponse, type NextRequest } from 'next/server';
import { ComparisonService } from '@/lib/services/ComparisonService';
import { calculateMarginalSchema } from '@/lib/validation/schemas';
import type { CharacterBaseStats, Skill, Target } from '@/lib/types';
import type { DamageBonus } from '@/lib/calculators';

/**
 * POST /api/calculate/marginal — Gains marginaux par stat.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = calculateMarginalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { stats, skills, target, bonuses, duration } = parsed.data;
    const comparisonService = new ComparisonService();

    const result = comparisonService.calculateMarginalGains(
      stats as CharacterBaseStats,
      skills as unknown as Skill[],
      target as Target,
      (bonuses ?? []) as readonly DamageBonus[],
      duration ?? 60
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] POST /api/calculate/marginal error:', error);
    return NextResponse.json(
      { error: 'Erreur de calcul' },
      { status: 500 }
    );
  }
}
