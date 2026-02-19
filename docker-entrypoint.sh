#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma db push --url "$DATABASE_URL"

echo "Generating Prisma client..."
npx prisma generate

echo "Seeding database..."
node -e "
  const { PrismaClient, Role, ApplicationStatus } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const prisma = new PrismaClient({});
  async function main() {
    const count = await prisma.user.count();
    if (count > 0) { console.log('Already seeded'); return; }
    const hash = (pw) => bcrypt.hashSync(pw, 10);
    const users = [
      { email:'tiffany.chen@example.com', firstName:'Tiffany', lastName:'Chen', phone:'(555)111-0001', role:'customer' },
      { email:'joseph.nguyen@example.com', firstName:'Joseph', lastName:'Nguyen', phone:'(555)111-0002', role:'customer' },
      { email:'hai.pham@example.com', firstName:'Hai', lastName:'Pham', phone:'(555)111-0003', role:'customer' },
      { email:'vivian.nguyen@example.com', firstName:'Vivian', lastName:'Nguyen', phone:'(555)111-0004', role:'customer' },
      { email:'jason.hart@example.com', firstName:'Jason', lastName:'Hart', phone:'(555)111-0005', role:'customer' },
      { email:'ltphongssvn@gmail.com', firstName:'Phong', lastName:'Le', phone:'(555)222-0001', role:'customer' },
      { email:'officer@example.com', firstName:'Loan', lastName:'Officer', phone:'(555)333-0001', role:'loan_officer' },
      { email:'underwriter@example.com', firstName:'Under', lastName:'Writer', phone:'(555)333-0002', role:'underwriter' },
    ];
    for (const u of users) {
      await prisma.user.create({ data: { ...u, encryptedPassword: hash('password123'), confirmedAt: new Date() } });
    }
    console.log('Seeded ' + users.length + ' users');
  }
  main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.\$disconnect());
" || echo "Seed skipped or already run"

echo "Starting Next.js..."
exec node server.js
