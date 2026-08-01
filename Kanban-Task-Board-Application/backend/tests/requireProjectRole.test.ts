import test from 'node:test';
import assert from 'node:assert/strict';
import { requireProjectRole } from '../src/middleware/requireProjectRole.js';
import { prisma } from '../lib/prisma.js';

type mockRequest = {
  params: Record<string, string>;
  user?: { userId: number; globalRole: string };
};
type mockResponse = Record<string, unknown>;
interface HttpError extends Error {
  statusCode: number;
}

const prismaMock = prisma as unknown as {
  projectMembership: { findUnique: (args: unknown) => Promise<unknown> };
};
const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
  params: {},
  ...overrides,
});
const createRes = (): mockResponse => ({});
const createNext = () => {
  const calls: unknown[] = [];
  return {
    next: (value?: unknown) => {
      calls.push(value);
    },
    calls,
  };
};

test('requireProjectRole - success if user has allowed role', async () => {
  prismaMock.projectMembership.findUnique = async () => ({
    role: 'PROJECT_ADMIN',
  });
  const middleware = requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER']);
  const req = createReq({
    params: { projectId: '5' },
    user: { userId: 1, globalRole: 'USER' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await middleware(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], undefined);
});
test('requireProjectRole - success if user is GLOBAL_ADMIN regardless of membership', async () => {
  prismaMock.projectMembership.findUnique = async () => null; // No membership!
  const middleware = requireProjectRole(['PROJECT_ADMIN']);
  const req = createReq({
    params: { projectId: '5' },
    user: { userId: 1, globalRole: 'GLOBAL_ADMIN' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await middleware(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], undefined);
});
test('requireProjectRole - fails if unauthorized', async () => {
  const middleware = requireProjectRole(['PROJECT_ADMIN']);
  const req = createReq({ params: { projectId: '5' }, user: undefined });
  const res = createRes();
  const { next, calls } = createNext();
  await middleware(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});
test('requireProjectRole - fails if not part of project', async () => {
  prismaMock.projectMembership.findUnique = async () => null;
  const middleware = requireProjectRole(['PROJECT_ADMIN']);
  const req = createReq({
    params: { projectId: '5' },
    user: { userId: 1, globalRole: 'USER' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await middleware(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 403);
});
test('requireProjectRole - fails if role is insufficient', async () => {
  prismaMock.projectMembership.findUnique = async () => ({
    role: 'PROJECT_VIEWER',
  });
  const middleware = requireProjectRole(['PROJECT_ADMIN']);
  const req = createReq({
    params: { projectId: '5' },
    user: { userId: 1, globalRole: 'USER' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await middleware(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 403);
});
test('requireProjectRole - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.projectMembership.findUnique = async () => {
    throw mockError;
  };
  const middleware = requireProjectRole(['PROJECT_ADMIN']);
  const req = createReq({
    params: { projectId: '5' },
    user: { userId: 1, globalRole: 'USER' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await middleware(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
