import { prisma } from '../../lib/prisma.js';
import jwt from 'jsonwebtoken';

// clears out db tables so things dont break from foreign keys
export const clrDb = async () => {
  const tbls = [
    'AuditLog',
    'Comment',
    'Task',
    'Column',
    'Board',
    'ProjectMembership',
    'Project',
    'User',
  ];

  for (const t of tbls) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE;`);
  }
};

// spits out a fake jwt cookie for routes that need auth
export const makeCookie = (uid: number, mail: string) => {
  const tok = jwt.sign(
    { userId: uid, email: mail },
    process.env.JWT_SECRET || 'super_secret_test_key',
    { expiresIn: '1h' },
  );
  return `token=${tok}`; // how express reads it
};
