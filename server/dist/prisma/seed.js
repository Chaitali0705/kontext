"use strict";
// server/prisma/seed.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🌱 Starting seed...');
        // 1. Create a Team
        const team = yield prisma.team.create({
            data: {
                name: 'Kontext Builders',
            },
        });
        // 2. Create a User (Alice)
        const user = yield prisma.user.create({
            data: {
                email: 'alice@kontext.app',
                name: 'Alice Engineer',
                teamId: team.id,
            },
        });
        console.log(`👤 Created user: ${user.name}`);
        // 3. Create a Project Context
        const context = yield prisma.context.create({
            data: {
                name: 'Kontext MVP',
                description: 'Building the Context Moat for the Hackathon',
                teamId: team.id,
            },
        });
        console.log(`📂 Created context: ${context.name}`);
        // 4. Create a Decision (The Moat!)
        const decision = yield prisma.decision.create({
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
        yield prisma.failure.create({
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
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
