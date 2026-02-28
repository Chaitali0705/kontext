"use strict";
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
        console.log('🧹 Clearing old data...');
        yield prisma.decision.deleteMany();
        yield prisma.failure.deleteMany();
        yield prisma.context.deleteMany();
        yield prisma.user.deleteMany();
        yield prisma.team.deleteMany(); // Clear teams too
        console.log('🏢 Creating Demo Team...');
        const team = yield prisma.team.create({
            data: {
                id: 'demo-team-id',
                name: 'Hackathon Team',
            },
        });
        console.log('👤 Creating Demo User (Alice)...');
        const user = yield prisma.user.create({
            data: {
                name: 'Alice Engineer',
                email: 'alice@kontext.dev',
                teamId: team.id, // <-- THIS IS WHAT WAS MISSING
            },
        });
        console.log('📁 Creating Kontext MVP Project...');
        yield prisma.context.create({
            data: {
                name: 'Kontext MVP',
                description: 'Building the Knowledge Moat for the Hackathon',
                teamId: team.id,
            },
        });
        console.log('✅ Success! The database is seeded and ready.');
    });
}
main()
    .catch((e) => {
    console.error('🔥 Seed error:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
