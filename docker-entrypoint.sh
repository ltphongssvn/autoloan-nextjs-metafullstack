#!/bin/sh
set -e

# Remove seed.ts so prisma db push won't auto-seed
mv prisma/seed.ts prisma/seed.ts.bak 2>/dev/null || true

echo "Running Prisma db push..."
npx prisma db push --url "$DATABASE_URL"

# Restore and seed manually with node
mv prisma/seed.ts.bak prisma/seed.ts 2>/dev/null || true

echo "Seeding database..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new Proxy({}, { get(_, prop) { if (!global._pc) global._pc = new PrismaClient({}); return Reflect.get(global._pc, prop); } });
async function main() {
  const c = await p.user.count();
  if (c > 0) { console.log('Already seeded'); return; }
  const h = (pw) => bcrypt.hashSync(pw, 10);
  const us = [
    {email:'tiffany.chen@example.com',firstName:'Tiffany',lastName:'Chen',phone:'(555)111-0001',role:'customer'},
    {email:'joseph.nguyen@example.com',firstName:'Joseph',lastName:'Nguyen',phone:'(555)111-0002',role:'customer'},
    {email:'hai.pham@example.com',firstName:'Hai',lastName:'Pham',phone:'(555)111-0003',role:'customer'},
    {email:'vivian.nguyen@example.com',firstName:'Vivian',lastName:'Nguyen',phone:'(555)111-0004',role:'customer'},
    {email:'jason.hart@example.com',firstName:'Jason',lastName:'Hart',phone:'(555)111-0005',role:'customer'},
    {email:'ltphongssvn@gmail.com',firstName:'Phong',lastName:'Le',phone:'(555)222-0001',role:'customer'},
    {email:'officer@example.com',firstName:'Loan',lastName:'Officer',phone:'(555)333-0001',role:'loan_officer'},
    {email:'underwriter@example.com',firstName:'Under',lastName:'Writer',phone:'(555)333-0002',role:'underwriter'},
  ];
  for (const u of us) { await p.user.create({data:{...u,encryptedPassword:h('password123'),confirmedAt:new Date()}}); }
  console.log('Seeded '+us.length+' users');
}
main().catch(e=>{console.error(e.message);process.exit(1)}).finally(()=>p.\$disconnect());
" || echo "Seed skipped"

echo "Starting Next.js..."
exec node server.js
