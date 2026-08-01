import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

//fake jwt secret:
process.env.JWT_SECRET = 'k4key';

const { registerUser, loginUser, refreshUser, logoutUser, myProfile } =
  await import('../src/controllers/authController.js');
import { prisma } from '../lib/prisma.js';

//type definitions:
type mockRequest = {
  body: Record<string, unknown>;
  cookies: Record<string, string>;
  user?: {
    userId?: number;
    globalRole?: 'GLOBAL_ADMIN' | 'USER';
  };
};

type mockResponse = {
  statusCode: number | null;
  jsonPayload: unknown;
  cookiesSet: Record<string, { value: string; options: unknown }>;
  cookiesCleared: string[];
  status: (code: number) => mockResponse;
  json: (payload: unknown) => mockResponse;
  cookie: (name: string, value: string, options: unknown) => mockResponse;
  clearCookie: (name: string) => mockResponse;
};

interface HttpError extends Error {
  statusCode: number;
}

//mock setup:
const prismaMock = prisma as unknown as {
  user: {
    findFirst: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
  };
  refreshToken: {
    create: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown>;
    deleteMany: (args: unknown) => Promise<unknown>;
  };
};

//helper functions:
const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
  body: {},
  cookies: {},
  ...overrides,
});

const createRes = (): mockResponse => {
  const res: mockResponse = {
    statusCode: null,
    jsonPayload: null,
    cookiesSet: {},
    cookiesCleared: [],
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.jsonPayload = payload;
      return this;
    },
    cookie(name: string, value: string, options: unknown) {
      this.cookiesSet[name] = { value, options };
      return this;
    },
    clearCookie(name: string) {
      this.cookiesCleared.push(name);
      return this;
    },
  };
  return res;
};

const createNext = () => {
  const calls: unknown[] = [];
  const next = (value?: unknown) => {
    calls.push(value);
  };
  return { next, calls };
};

//started TESTING:

//Register User:
test('registerUser - successfully registers a new user', async () => {
  prismaMock.user.findFirst = async () => null; //as user not exist
  prismaMock.user.create = async (args: unknown) => {
    const requestArgs = args as { data: Record<string, unknown> };
    return { id: 1, ...requestArgs.data };
  };
  const req = createReq({
    body: {
      username: 'testuser',
      email: 'test@mail.com',
      password: 'password123',
    },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await registerUser(req as never, res as never, next as never);
  type ExpectedRegisterResponse = {
    message: string;
    user: { id: number; username: string; email: string; globalRole: string };
  };
  const payload = res.jsonPayload as ExpectedRegisterResponse;

  assert.equal(res.statusCode, 201);
  assert.equal(payload.message, 'User registered successfully');
  assert.equal(payload.user.username, 'testuser');
  assert.equal(calls.length, 0);
});

test('registerUser - fails if user already exists', async () => {
  prismaMock.user.findFirst = async () => ({ id: 1, username: 'testuser' });

  const req = createReq({
    body: {
      username: 'testuser',
      email: 'test@mail.com',
      password: 'password123',
    },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await registerUser(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('registerUser - passes unexpected errors to next()', async () => {
  const mockError = new Error('Database connection failed');
  prismaMock.user.findFirst = async () => {
    throw mockError;
  };

  const req = createReq({
    body: { username: 'test', email: 'test@mail.com', password: 'password' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await registerUser(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});

//Login user:
test('loginUser - successfully logs in and sets cookies', async () => {
  //hashing a real password for bcrypt.compare() work
  const hashedPassword = await bcrypt.hash('password123', 10);

  prismaMock.user.findUnique = async () => ({
    id: 1,
    username: 'testuser',
    email: 'test@mail.com',
    password: hashedPassword,
    globalRole: 'USER',
  });
  prismaMock.refreshToken.create = async () => ({});
  const req = createReq({
    body: { email: 'test@mail.com', password: 'password123' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await loginUser(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
  assert.ok(res.cookiesSet['accessToken']);
  assert.ok(res.cookiesSet['refreshToken']);
  assert.equal(calls.length, 0);
});

test('loginUser - fails with invalid password', async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  prismaMock.user.findUnique = async () => ({
    id: 1,
    email: 'test@mail.com',
    password: hashedPassword,
  });
  const req = createReq({
    body: { email: 'test@mail.com', password: 'wrongpassword' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await loginUser(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
  assert.match((calls[0] as Error).message, /Invalid username or password/);
});

test('loginUser - passes unexpected errors to next()', async () => {
  const mockError = new Error('Database connection failed');
  prismaMock.user.findUnique = async () => {
    throw mockError;
  };
  const req = createReq({
    body: { email: 'test@mail.com', password: 'password' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await loginUser(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});

//refresh user:
test('refreshUser - issues a new access token', async () => {
  //For testing created a jsw token:
  const validToken = jwt.sign(
    { userId: 1, globalRole: 'USER' },
    process.env.JWT_SECRET!,
  );
  prismaMock.refreshToken.findUnique = async () => ({ token: validToken });
  const req = createReq({ cookies: { refreshToken: validToken } });
  const res = createRes();
  const { next, calls } = createNext();
  await refreshUser(req as never, res as never, next as never);
  type ExpectedRefreshResponse = { message: string };
  const payload = res.jsonPayload as ExpectedRefreshResponse;
  assert.equal(payload.message, 'token refreshed');
  assert.ok(res.cookiesSet['accessToken']);
  assert.equal(calls.length, 0);
});

test('refreshUser - fails if token is missing', async () => {
  const req = createReq({ cookies: {} });
  const res = createRes();
  const { next, calls } = createNext();
  await refreshUser(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});

test('refreshUser - fails if token is valid but revoked in DB', async () => {
  const validToken = jwt.sign(
    { userId: 1, globalRole: 'USER' },
    process.env.JWT_SECRET!,
  );
  prismaMock.refreshToken.findUnique = async () => null; //Not found in db
  const req = createReq({ cookies: { refreshToken: validToken } });
  const res = createRes();
  const { next, calls } = createNext();
  await refreshUser(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 403);
});

test('refreshUser - passes unexpected errors to next()', async () => {
  // Wrong jwt token
  const req = createReq({ cookies: { refreshToken: 'fakeOfFake' } });
  const res = createRes();
  const { next, calls } = createNext();
  await refreshUser(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.ok(calls[0] instanceof Error);
});

//Logout user:
test('logoutUser - deletes token and clears cookies', async () => {
  prismaMock.refreshToken.deleteMany = async () => ({ count: 1 });
  const req = createReq({ cookies: { refreshToken: 'some-token' } });
  const res = createRes();
  const { next, calls } = createNext();
  await logoutUser(req as never, res as never, next as never);
  assert.ok(res.cookiesCleared.includes('accessToken'));
  assert.ok(res.cookiesCleared.includes('refreshToken'));
  assert.equal(calls.length, 0);
});

test('logoutUser - passes unexpected errors to next()', async () => {
  const mockError = new Error('Database connection failed');
  prismaMock.refreshToken.deleteMany = async () => {
    throw mockError;
  };

  const req = createReq({ cookies: { refreshToken: 'some-token' } });
  const res = createRes();
  const { next, calls } = createNext();

  await logoutUser(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});

//My profile:
test('myProfile - returns user without password', async () => {
  prismaMock.user.findUnique = async () => ({
    id: 1,
    username: 'me',
    password: 'hashedpassword',
    globalRole: 'USER',
  });
  const req = createReq({ user: { userId: 1, globalRole: 'USER' } });
  const res = createRes();
  const { next, calls } = createNext();
  await myProfile(req as never, res as never, next as never);
  type ExpectedProfileResponse = {
    id: number;
    username: string;
    globalRole: string;
    password?: string;
  };
  const payload = res.jsonPayload as ExpectedProfileResponse;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.username, 'me');
  assert.equal(payload.password, undefined); //Checking password is there or not
  assert.equal(calls.length, 0);
});

test('myProfile - fails if unauthorized', async () => {
  const req = createReq({ user: {} });
  const res = createRes();
  const { next, calls } = createNext();
  await myProfile(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});

test('myProfile - passes unexpected errors to next()', async () => {
  const mockError = new Error('Database connection failed');
  prismaMock.user.findUnique = async () => {
    throw mockError;
  };
  const req = createReq({ user: { userId: 1, globalRole: 'USER' } });
  const res = createRes();
  const { next, calls } = createNext();
  await myProfile(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});
