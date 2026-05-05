/**
 * Seed para actualizar usuarios existentes a admin.
 * 
 * Uso:
 *   node prisma/seedAdmin.js <email1> <email2> ...
 * 
 * Ejemplo:
 *   node prisma/seedAdmin.js admin@empresa.com ana.vance@empresa.com
 * 
 * Si no se pasan argumentos, se actualizan todos los usuarios con rolInterno='admin'.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emails = process.argv.slice(2);

  if (emails.length === 0) {
    console.log('Uso: node prisma/seedAdmin.js <email1> <email2> ...');
    console.log('\nUsuarios actuales:');
    const users = await prisma.usuario.findMany({
      select: { email: true, nombre: true, rolInterno: true },
      orderBy: { nombre: 'asc' },
    });
    users.forEach((u) => {
      console.log(`  ${u.email} — ${u.nombre} — rol: ${u.rolInterno}`);
    });
    return;
  }

  for (const email of emails) {
    try {
      const user = await prisma.usuario.update({
        where: { email },
        data: { rolInterno: 'admin' },
      });
      console.log(`✅ ${user.email} (${user.nombre}) → rolInterno = admin`);
    } catch (err) {
      console.error(`❌ No se encontró usuario con email: ${email}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
