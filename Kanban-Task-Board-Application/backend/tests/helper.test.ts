import test from 'node:test';
import assert from 'node:assert/strict';
import { getUsername } from '../src/utils/helpers.js';
import { prisma } from '../lib/prisma.js';

//mock setup
const prismaMock = prisma as unknown as {
  user: {
    findUnique: (args: unknown) => Promise<unknown>;
  };
};
test('getUsername: returns username when user exists', async () => {
  prismaMock.user.findUnique = async () => ({ id: 1, username: 'johndoe' });
  const result = await getUsername(1);
  assert.equal(result, 'johndoe');
});

test('getUsername: returns null when user does not exist', async () => {
  prismaMock.user.findUnique = async () => null;
  const result = await getUsername(999);
  assert.equal(result, null);
});
