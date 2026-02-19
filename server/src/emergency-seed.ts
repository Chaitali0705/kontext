import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Clearing old data...');
    await prisma.decision.deleteMany();
    await prisma.failure.deleteMany();
    await prisma.context.deleteMany();
    await prisma.user.deleteMany();
    await prisma.team.deleteMany(); // Clear teams too

    console.log('🏢 Creating Demo Team...');
    const team = await prisma.team.create({
        data: {
        id: 'demo-team-id',
        name: 'Hackathon Team',
        },
    });

    console.log('👤 Creating Demo User (Alice)...');
    const user = await prisma.user.create({
        data: {
        name: 'Alice Engineer',
        email: 'alice@kontext.dev',
        teamId: team.id, // <-- THIS IS WHAT WAS MISSING
        },
    });

    console.log('📁 Creating Kontext MVP Project...');
    await prisma.context.create({
        data: {
        name: 'Kontext MVP',
        description: 'Building the Knowledge Moat for the Hackathon',
        teamId: team.id,
        },
    });

    console.log('✅ Success! The database is seeded and ready.');
}

main()
    .catch((e) => {
        console.error('🔥 Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });