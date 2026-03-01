import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seed : démarrage...');

  // Utilisateur de test
  const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10);
  const passwordHash = bcrypt.hashSync('test1234', rounds);

  const testUser = await prisma.user.upsert({
    where: { email: 'test@wwm-calc.dev' },
    update: { name: 'TestPlayer', passwordHash },
    create: {
      email: 'test@wwm-calc.dev',
      name: 'TestPlayer',
      passwordHash,
      tier: 'FREE',
    },
  });

  console.log(`Utilisateur : ${testUser.email} (${testUser.id})`);

  // Build démo public
  const demoBuild = await prisma.build.upsert({
    where: { shareSlug: 'demo0001' },
    update: {
      name: 'Nameless Sword DPS',
      description: 'Build PvE optimisé Épée Sans Nom — Global OW12',
      isPublic: true,
      level: 85,
      weaponId: 'nameless_sword',
      objective: 'pve',
      stats: {
        level: 85,
        attack: 1122,
        attackMin: 700,
        attackMax: 1122,
        elementalAttack: 416,
        defense: 318,
        resistance: 0,
        critRate: 5200,
        critDamage: 0.50,
        affinityRate: 0.166,
        affinityDamage: 0.35,
        precision: 4500,
        armorPenetration: 180,
        elementalPenetration: 50,
      },
      results: {
        dps: 21289,
        graduation: null,
        damageDistribution: null,
        marginalGains: [],
      },
    },
    create: {
      userId: testUser.id,
      name: 'Nameless Sword DPS',
      description: 'Build PvE optimisé Épée Sans Nom — Global OW12',
      isPublic: true,
      level: 85,
      weaponId: 'nameless_sword',
      objective: 'pve',
      shareSlug: 'demo0001',
      stats: {
        level: 85,
        attack: 1122,
        attackMin: 700,
        attackMax: 1122,
        elementalAttack: 416,
        defense: 318,
        resistance: 0,
        critRate: 5200,
        critDamage: 0.50,
        affinityRate: 0.166,
        affinityDamage: 0.35,
        precision: 4500,
        armorPenetration: 180,
        elementalPenetration: 50,
      },
      results: {
        dps: 21289,
        graduation: null,
        damageDistribution: null,
        marginalGains: [],
      },
    },
  });

  console.log(`Build démo : ${demoBuild.name} (${demoBuild.shareSlug})`);
  console.log('Seed : terminé.');
}

main()
  .catch((e) => {
    console.error('Seed : échec —', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
