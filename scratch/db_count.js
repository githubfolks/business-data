const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.business.count({
    where: {
      postal_code: '10001',
      OR: [
        { category: { contains: 'barber', mode: 'insensitive' } },
        { subcategories: { has: 'barber' } }
      ]
    }
  });
  console.log(`Database count for barbershop in 10001: ${count}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
