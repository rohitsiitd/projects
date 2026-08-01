import test from 'node:test';
import assert from 'node:assert/strict';
import { requireGlobalAdmin } from '../src/middleware/requireGlobalAdmin.js';

type mockRequest = { user?: { userId: number; globalRole: string } };
type mockResponse = Record<string, unknown>;
interface HttpError extends Error {
  statusCode: number;
}

const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
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

test('requireGlobalAdmin - success if user is GLOBAL_ADMIN', () => {
  const req = createReq({ user: { userId: 1, globalRole: 'GLOBAL_ADMIN' } });
  const res = createRes();
  const { next, calls } = createNext();
  requireGlobalAdmin(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], undefined);
});
test('requireGlobalAdmin - fails if user is missing', () => {
  const req = createReq({ user: undefined });
  const res = createRes();
  const { next, calls } = createNext();
  requireGlobalAdmin(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});
test('requireGlobalAdmin - fails if user is just USER', () => {
  const req = createReq({ user: { userId: 1, globalRole: 'USER' } });
  const res = createRes();
  const { next, calls } = createNext();
  requireGlobalAdmin(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 403);
});
