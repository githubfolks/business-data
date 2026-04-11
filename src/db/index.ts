import { prisma } from './prisma';

export async function connectDatabase(): Promise<void> {
  try {
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('PostgreSQL connected successfully via Supabase');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    throw error;
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
