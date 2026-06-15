const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const providers = await prisma.provider.findMany();
  console.log(`${providers.length} providers found`);
  
  const cats = ['doctors', 'programmer', 'translator'];
  
  for (let i = 0; i < providers.length; i++) {
    await prisma.provider.update({
      where: { id: providers[i].id },
      data: { category: cats[i % cats.length] }
    });
  }
  
  console.log('Successfully updated providers');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
