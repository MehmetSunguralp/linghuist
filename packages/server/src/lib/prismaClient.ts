import { PrismaClient } from '@prisma/client';

// Configure PrismaClient with connection pooling and better error handling
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Handle connection errors
prisma.$on('error' as never, (e: Error) => {
  console.error('Prisma Client Error:', e);
});
