// Check if migration was applied
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
    try {
        // Try to inspect the Failure table structure
        console.log('Checking database schema...\n');
        
        // Get a sample failure if exists
        const failure = await prisma.failure.findFirst();
        console.log('Sample failure:', failure);
        
        // Check the raw SQL to see foreign key constraints
        const constraints = await prisma.$queryRaw`
            SELECT
                tc.constraint_name, 
                tc.table_name, 
                kcu.column_name,
                rc.delete_rule
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.referential_constraints AS rc
                  ON tc.constraint_name = rc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = 'Failure'
                AND kcu.column_name = 'contextId';
        `;
        
        console.log('\nForeign key constraints on Failure.contextId:');
        console.log(constraints);
        
        if (constraints.length > 0) {
            const deleteRule = constraints[0].delete_rule;
            if (deleteRule === 'CASCADE') {
                console.log('\n✅ Cascade delete is properly configured!');
            } else {
                console.log(`\n⚠️  Delete rule is: ${deleteRule} (should be CASCADE)`);
                console.log('You need to run the migration!');
            }
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkSchema();
