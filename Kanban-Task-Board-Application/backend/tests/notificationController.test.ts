import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUserNotifications,
  readNotfications,
} from '../src/controllers/notificationController.js';
import { prisma } from '../lib/prisma.js';

type mockRequest = {
  params: Record<string, string>;
  user?: { userId: number };
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

const prismaMock = prisma as unknown as {
  notification: {
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
};

const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
  params: {},
  user: { userId: 1 },
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

test('getUserNotifications - successfully fetches and formats notifications', async () => {
  prismaMock.notification.findMany = async () => [
    {
      id: 1,
      userId: 1,
      taskId: 5,
      task: { title: 'T', column: { board: { id: 2, projectId: 3 } } },
    },
  ];
  const req = createReq();
  const res = createRes();
  const { next } = createNext();
  await getUserNotifications(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
  const payload = res.jsonPayload as { notifications: { projectId: number }[] };
  assert.equal(payload.notifications[0].projectId, 3);
});
test('getUserNotifications - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.notification.findMany = async () => {
    throw mockError;
  };
  const req = createReq();
  const res = createRes();
  const { next, calls } = createNext();
  await getUserNotifications(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('readNotfications - successfully marks as read', async () => {
  prismaMock.notification.findUnique = async () => ({ id: 10, userId: 1 });
  prismaMock.notification.update = async () => ({ id: 10, isRead: true });
  const req = createReq({ params: { notificationId: '10' } });
  const res = createRes();
  const { next } = createNext();
  await readNotfications(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
});
test('readNotfications - fails if not owner', async () => {
  prismaMock.notification.findUnique = async () => ({ id: 10, userId: 99 });
  const req = createReq({ params: { notificationId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();
  await readNotfications(req as never, res as never, next as never);
  assert.equal((calls[0] as HttpError).statusCode, 404);
});
test('readNotfications - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.notification.findUnique = async () => {
    throw mockError;
  };
  const req = createReq({ params: { notificationId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();
  await readNotfications(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
