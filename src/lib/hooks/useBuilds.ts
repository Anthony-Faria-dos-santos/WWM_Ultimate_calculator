'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BuildResponse,
  CreateBuildPayload,
  PaginatedBuildsResponse,
} from '@/lib/types';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Liste paginée des builds de l'utilisateur */
export function useBuilds(
  page = 1,
  limit = 10,
  sort = 'updatedAt',
  enabled = true,
) {
  return useQuery({
    queryKey: ['builds', { page, limit, sort }] as const,
    queryFn: () =>
      fetchJSON<PaginatedBuildsResponse>(
        `/api/builds?page=${page}&limit=${limit}&sort=${sort}`,
      ),
    enabled,
  });
}

/** Détail d'un build par ID */
export function useBuild(id: string | null) {
  return useQuery({
    queryKey: ['builds', id] as const,
    queryFn: () => fetchJSON<BuildResponse>(`/api/builds/${id}`),
    enabled: !!id,
  });
}

/** Création d'un nouveau build */
export function useCreateBuild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateBuildPayload) =>
      fetchJSON<BuildResponse>('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
    },
  });
}

/** Mise à jour d'un build existant */
export function useUpdateBuild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<CreateBuildPayload>) =>
      fetchJSON<BuildResponse>(`/api/builds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
      queryClient.invalidateQueries({ queryKey: ['builds', variables.id] });
    },
  });
}

/** Suppression d'un build */
export function useDeleteBuild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<void>(`/api/builds/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
    },
  });
}
