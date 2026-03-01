import { vi } from 'vitest';
import { NextRequest } from 'next/server';
import { TEST_FIXTURES } from '../fixtures';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    build: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

import { prisma } from '@/lib/db/client';
import { auth } from '@/lib/auth/config';
import { GET as listBuilds, POST as createBuild } from '@/app/api/builds/route';
import { GET as getBuild, PUT as updateBuild, DELETE as deleteBuild } from '@/app/api/builds/[id]/route';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

// ─── Données partagées ──────────────────────────────────────────────

const mockSession = { user: { id: 'user-1', tier: 'FREE', email: 'test@test.com' } };

const mockBuild = {
  id: 'build-1',
  userId: 'user-1',
  name: 'Test Build',
  description: null,
  isPublic: false,
  level: 85,
  weaponId: 'nameless_sword',
  innerWayId: null,
  objective: 'pve',
  stats: TEST_FIXTURES.characters.standardDPS,
  target: null,
  equipment: null,
  rotation: null,
  buffs: null,
  results: null,
  views: 0,
  likes: 0,
  shareSlug: 'abc12345',
  createdAt: new Date('2026-02-28'),
  updatedAt: new Date('2026-02-28'),
  user: { name: 'TestPlayer', image: null },
};

function createRequest(options: {
  method?: string;
  body?: unknown;
  searchParams?: Record<string, string>;
}): NextRequest {
  const url = new URL('http://localhost:3000/api/test');
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  return new NextRequest(url, {
    method: options.method ?? 'GET',
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    headers: options.body ? { 'Content-Type': 'application/json' } : {},
  });
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ─── GET /api/builds ────────────────────────────────────────────────

describe('GET /api/builds', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('retourne 401 sans session', async () => {
    mockAuth.mockResolvedValue(null as never);
    const req = createRequest({ method: 'GET' });
    const res = await listBuilds(req);
    expect(res.status).toBe(401);
  });

  it('retourne liste paginée avec session valide', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockPrisma.build.findMany.mockResolvedValue([mockBuild, { ...mockBuild, id: 'build-2' }] as never);
    mockPrisma.build.count.mockResolvedValue(2 as never);

    const req = createRequest({ method: 'GET' });
    const res = await listBuilds(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.builds).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
    expect(data.pagination.page).toBe(1);
  });

  it('respecte les query params page/limit', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockPrisma.build.findMany.mockResolvedValue([] as never);
    mockPrisma.build.count.mockResolvedValue(0 as never);

    const req = createRequest({ method: 'GET', searchParams: { page: '2', limit: '5' } });
    const res = await listBuilds(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(5);
    expect(mockPrisma.build.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 })
    );
  });
});

// ─── POST /api/builds ───────────────────────────────────────────────

describe('POST /api/builds', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const validPayload = {
    name: 'Mon build DPS',
    character: { level: 80, weaponId: 'weapon-sword-01', objective: 'pve' },
    stats: TEST_FIXTURES.characters.standardDPS,
  };

  it('retourne 401 sans session', async () => {
    mockAuth.mockResolvedValue(null as never);
    const req = createRequest({ method: 'POST', body: validPayload });
    const res = await createBuild(req);
    expect(res.status).toBe(401);
  });

  it('retourne 400 avec body invalide (name manquant)', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    const req = createRequest({ method: 'POST', body: { stats: TEST_FIXTURES.characters.standardDPS } });
    const res = await createBuild(req);
    expect(res.status).toBe(400);
  });

  it('retourne 201 avec payload valide', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockPrisma.build.create.mockResolvedValue(mockBuild as never);

    const req = createRequest({ method: 'POST', body: validPayload });
    const res = await createBuild(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBe('build-1');
    expect(data.name).toBe('Test Build');
  });
});

// ─── GET /api/builds/[id] ──────────────────────────────────────────

describe('GET /api/builds/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('retourne 404 si build inexistant', async () => {
    mockPrisma.build.findUnique.mockResolvedValue(null as never);
    const req = createRequest({ method: 'GET' });
    const res = await getBuild(req, routeContext('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('retourne build public sans auth (incrémente views)', async () => {
    const publicBuild = { ...mockBuild, isPublic: true };
    mockPrisma.build.findUnique.mockResolvedValue(publicBuild as never);
    mockPrisma.build.update.mockResolvedValue(publicBuild as never);

    const req = createRequest({ method: 'GET' });
    const res = await getBuild(req, routeContext('build-1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe('build-1');
    expect(mockPrisma.build.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { views: { increment: 1 } } })
    );
  });

  it('retourne 403 si build privé et pas owner', async () => {
    const privateBuild = { ...mockBuild, userId: 'other-user' };
    mockPrisma.build.findUnique.mockResolvedValue(privateBuild as never);
    mockAuth.mockResolvedValue(mockSession as never);

    const req = createRequest({ method: 'GET' });
    const res = await getBuild(req, routeContext('build-1'));
    expect(res.status).toBe(403);
  });
});

// ─── PUT /api/builds/[id] ──────────────────────────────────────────

describe('PUT /api/builds/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('retourne 401 sans session', async () => {
    mockAuth.mockResolvedValue(null as never);
    const req = createRequest({ method: 'PUT', body: { name: 'Updated' } });
    const res = await updateBuild(req, routeContext('build-1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si pas owner', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockPrisma.build.findUnique.mockResolvedValue({ ...mockBuild, userId: 'other-user' } as never);

    const req = createRequest({ method: 'PUT', body: { name: 'Updated' } });
    const res = await updateBuild(req, routeContext('build-1'));
    expect(res.status).toBe(403);
  });

  it('retourne 200 avec mise à jour valide', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockPrisma.build.findUnique.mockResolvedValue(mockBuild as never);
    const updatedBuild = { ...mockBuild, name: 'Nouveau Nom' };
    mockPrisma.build.update.mockResolvedValue(updatedBuild as never);

    const req = createRequest({ method: 'PUT', body: { name: 'Nouveau Nom' } });
    const res = await updateBuild(req, routeContext('build-1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe('Nouveau Nom');
  });
});

// ─── DELETE /api/builds/[id] ────────────────────────────────────────

describe('DELETE /api/builds/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('retourne 401 sans session', async () => {
    mockAuth.mockResolvedValue(null as never);
    const req = createRequest({ method: 'DELETE' });
    const res = await deleteBuild(req, routeContext('build-1'));
    expect(res.status).toBe(401);
  });

  it('retourne 204 quand owner supprime', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockPrisma.build.findUnique.mockResolvedValue(mockBuild as never);
    mockPrisma.build.delete.mockResolvedValue(mockBuild as never);

    const req = createRequest({ method: 'DELETE' });
    const res = await deleteBuild(req, routeContext('build-1'));
    expect(res.status).toBe(204);
  });
});
