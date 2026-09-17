import 'dotenv/config';
import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { randomUUID } from 'node:crypto';

const sql = postgres(process.env.DATABASE_URL, { ssl: false });

const users = [
  {
    name: 'Demo Admin',
    email: process.env.DEMO_ADMIN_EMAIL,
    password: process.env.DEMO_ADMIN_PASSWORD,
    role: 'ADMIN',
  },
  {
    name: 'Demo AHASS',
    email: process.env.DEMO_AHASS_EMAIL,
    password: process.env.DEMO_AHASS_PASSWORD,
    role: 'AHASS',
  },
];

if (users.some((user) => !user.email || !user.password)) {
  throw new Error('Demo account environment variables are incomplete.');
}

try {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await sql`
      INSERT INTO users (id, name, email, password_hash, role, active, created_at, updated_at)
      VALUES (${randomUUID()}, ${user.name}, ${user.email.toLowerCase()}, ${passwordHash}, ${user.role}, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        active = true,
        updated_at = NOW();
    `;
  }
  console.log('Demo users seeded.');
} finally {
  await sql.end();
}