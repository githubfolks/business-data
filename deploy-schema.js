const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function deploySchema() {
  try {
    console.log('Reading migration SQL...');
    const migrationPath = path.join(__dirname, 'prisma/migrations/0_init/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Executing migration...');
    const statements = migrationSQL.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        await prisma.$executeRawUnsafe(statement);
      }
    }
    
    console.log('\n✅ Schema deployed successfully!');
    
    // Verify table exists
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public' AND table_name='Business'
    `;
    
    console.log('Business table exists:', tables.length > 0);
    
  } catch (error) {
    console.error('❌ Error deploying schema:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deploySchema();
