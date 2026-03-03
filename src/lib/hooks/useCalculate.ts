'use client';

import { useMutation } from '@tanstack/react-query';
import type {
  ExpectedValueResult,
  RotationResult,
  GraduationResult,
  BuildComparison,
} from '@/lib/types';
import type { MarginalGainResult } from '@/lib/services/ComparisonService';

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Calcul de dégâts bruts (damage pool + outcomes) */
export function useCalculateDamage() {
  return useMutation({
    mutationFn: (body: unknown) =>
      postJSON<ExpectedValueResult>('/api/calculate/damage', body),
  });
}

/** Calcul de l'espérance mathématique des dégâts */
export function useCalculateExpected() {
  return useMutation({
    mutationFn: (body: unknown) =>
      postJSON<ExpectedValueResult>('/api/calculate/expected', body),
  });
}

/** Simulation de rotation DPS complète */
export function useCalculateRotation() {
  return useMutation({
    mutationFn: (body: unknown) =>
      postJSON<RotationResult>('/api/calculate/rotation', body),
  });
}

/** Évaluation du build par rapport à une référence */
export function useCalculateGraduation() {
  return useMutation({
    mutationFn: (body: unknown) =>
      postJSON<GraduationResult>('/api/calculate/graduation', body),
  });
}

/** Comparaison directe entre deux builds */
export function useCalculateCompare() {
  return useMutation({
    mutationFn: (body: unknown) =>
      postJSON<BuildComparison>('/api/calculate/compare', body),
  });
}

/** Analyse des gains marginaux par stat */
export function useCalculateMarginal() {
  return useMutation({
    mutationFn: (body: unknown) =>
      postJSON<MarginalGainResult[]>('/api/calculate/marginal', body),
  });
}
