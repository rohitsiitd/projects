import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
process.env.JWT_SECRET = 'test-secret';
const { authenticateJWT } =
  await import('../src/middleware/authenticateJWT.js'); // Adjust path as needed

type mockRequest = {
  headers: Record<string, string>;
  cookies: Record<string, string>;
  user?: unknown;
};
type mockResponse = {
  statusCode: number | null;
  jsonPayload: unknown;
  status: (code: number) => mockResponse;
  json: (payload: unknown) => mockResponse;
};
interface HttpError extends Error {
  statusCode: number;
}

const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
  headers: {},
  cookies: {},
  ...overrides,
});
const createRes = (): mockResponse => ({
  statusCode: null,
  jsonPayload: null,
  status(code: number) {
    this.statusCode = code;
    return this;
  },
  json(payload: unknown) {
    this.jsonPayload = payload;
    return this;
  },
});
const createNext = () => {
  const calls: unknown[] = [];
  return {
    next: (value?: unknown) => {
      calls.push(value);
    },
    calls,
  };
};

test('authenticateJWT - success with Bearer token', () => {
  const validToken = jwt.sign(
    { userId: 1, globalRole: 'USER' },
    process.env.JWT_SECRET!,
  );
  const req = createReq({ headers: { authorization: `Bearer ${validToken}` } });
  const res = createRes();
  const { next, calls } = createNext();
  authenticateJWT(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], undefined);
  assert.equal((req.user as { userId: number }).userId, 1);
});
test('authenticateJWT - success with cookie token', () => {
  const validToken = jwt.sign(
    { userId: 2, globalRole: 'ADMIN' },
    process.env.JWT_SECRET!,
  );
  const req = createReq({ cookies: { accessToken: validToken } });
  const res = createRes();
  const { next, calls } = createNext();
  authenticateJWT(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], undefined);
  assert.equal((req.user as { userId: number }).userId, 2);
});
test('authenticateJWT - fails if no token provided', () => {
  const req = createReq();
  const res = createRes();
  const { next, calls } = createNext();
  authenticateJWT(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});
test('authenticateJWT - passes verification errors to next()', () => {
  const req = createReq({ headers: { authorization: 'Bearer invalid-token' } });
  const res = createRes();
  const { next, calls } = createNext();
  authenticateJWT(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.ok(calls[0] instanceof Error);
});
