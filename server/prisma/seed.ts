// server/prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create a Team
  const team = await prisma.team.create({
    data: {
      name: 'Kontext Builders',
    },
  });

  // 2. Create a User (Alice)
  const user = await prisma.user.create({
    data: {
      email: 'alice@kontext.app',
      name: 'Alice Engineer',
      teamId: team.id,
    },
  });

  console.log(`👤 Created user: ${user.name}`);

  // 3. Create a Project Context
  const context = await prisma.context.create({
    data: {
      name: 'Kontext MVP',
      description: 'Building the Context Moat for the Hackathon',
      teamId: team.id,
    },
  });

  console.log(`📂 Created context: ${context.name}`);

  // 4. Create a Decision (The Moat!)
  const decision = await prisma.decision.create({
    data: {
      title: 'Use PostgreSQL + pgvector',
      content: 'We need a vector database for similarity search.',
      rationale: 'Postgres offers pgvector which lets us keep relational data and vectors in one place, avoiding the complexity of a separate Pinecone instance.',
      tags: ['database', 'architecture', 'vector'],
      constraints: ['Hackathon timeframe', 'Free tier availability'],
      alternatives: ['Pinecone', 'Weaviate', 'Mongo Atlas'],
      outcome: 'success',
      contextId: context.id,
      authorId: user.id,
    },
  });

  console.log(`🧠 Created decision: ${decision.title}`);

  // 5. Create a Failure Log (Learning)
  await prisma.failure.create({
    data: {
      title: 'Docker on Windows',
      whatFailed: 'Docker Desktop installation',
      whyFailed: 'WSL2 conflicts and resource heaviness.',
      costEstimate: 4, // 4 hours lost
      contextId: context.id,
      authorId: user.id,
    },
  });

  console.log(`⚠️ Created failure log: Docker on Windows`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });