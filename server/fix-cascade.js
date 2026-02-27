// Quick fix script to apply cascade delete
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCascade() {
    try {
        console.log('Applying cascade delete fix...\n');
        
        // Drop existing constraint
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Failure" DROP CONSTRAINT IF EXISTS "Failure_contextId_fkey";
        `);
        console.log('✓ Dropped old constraint');
        
        // Add new constraint with CASCADE
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Failure" 
            ADD CONSTRAINT "Failure_contextId_fkey" 
            FOREIGN KEY ("contextId") 
            REFERENCES "Context"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE;
        `);
        console.log('✓ Added new constraint with CASCADE');
        
        // Verify
        const result = await prisma.$queryRaw`
            SELECT delete_rule 
            FROM information_schema.referential_constraints 
            WHERE constraint_name = 'Failure_contextId_fkey';
        `;
        
        console.log('\n✅ Fix applied successfully!');
        console.log('Delete rule:', result[0]?.delete_rule);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixCascade();
