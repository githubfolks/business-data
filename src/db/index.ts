import { prisma } from './prisma';

export async function connectDatabase(): Promise<void> {
  try {
    // Wait for a short moment to allow DB to start in case of cold boot
    console.log('Attempting to connect to PostgreSQL...');
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ PostgreSQL connected successfully');
  } catch (error) {
    console.warn('⚠️ PostgreSQL connection failed. Persistence features will be disabled.');
    console.warn('The application will continue to run in real-time-only mode.');
    // Do not throw; allow the application to start
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('PostgreSQL disconnected');
  } catch (error) {
    console.error('Failed to disconnect from PostgreSQL:', error);
    throw error;
  }
}

export { prisma };
