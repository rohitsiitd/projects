import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTransitions,
  updateTransitions,
  createTransition,
  deleteTransition,
} from '../src/controllers/workflowController.js';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

type mockRequest = {
  params: Record<string, string>;
  body: Record<string, unknown>;
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
  workflowTransition: {
    findMany: (args: unknown) => Promise<unknown[]>;
    findFirst: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  board: { findUnique: (args: unknown) => Promise<unknown> };
  $transaction: (
    callback: (tx: unknown) => Promise<unknown>,
  ) => Promise<unknown>;
};

const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
  params: {},
  body: {},
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

test('getTransitions - fetches successfully', async () => {
  prismaMock.workflowTransition.findMany = async () => [{ id: 1 }];
  const req = createReq({ params: { boardId: '5' } });
  const res = createRes();
  const { next } = createNext();
  await getTransitions(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
});
test('getTransitions - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.workflowTransition.findMany = async () => {
    throw mockError;
  };
  const req = createReq({ params: { boardId: '5' } });
  const res = createRes();
  const { next, calls } = createNext();
  await getTransitions(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('updateTransitions - successfully recreates transitions', async () => {
  prismaMock.board.findUnique = async () => ({ projectId: 1 });
  prismaMock.$transaction = async (callback) =>
    callback({
      workflowTransition: {
        deleteMany: async () => ({}),
        createMany: async () => ({}),
      },
    });
  prismaMock.workflowTransition.findMany = async () => [{ id: 1 }];
  const req = createReq({
    params: { boardId: '5' },
    body: { transitions: [{ fromColumnId: 1, toColumnId: 2 }] },
  });
  const res = createRes();
  const { next } = createNext();
  await updateTransitions(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
});
test('updateTransitions - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.board.findUnique = async () => {
    throw mockError;
  };
  const req = createReq({
    params: { boardId: '5' },
    body: { transitions: [] },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await updateTransitions(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('createTransition - creates successfully', async () => {
  prismaMock.workflowTransition.findFirst = async () => null;
  prismaMock.workflowTransition.create = async () => ({ id: 1 });
  const req = createReq({
    params: { projectId: '1', boardId: '5' },
    body: { fromColumnId: 1, toColumnId: 2 },
  });
  const res = createRes();
  const { next } = createNext();
  await createTransition(req as never, res as never, next as never);
  assert.equal(res.statusCode, 201);
});
test('createTransition - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.workflowTransition.findFirst = async () => {
    throw mockError;
  };
  const req = createReq({
    params: { projectId: '1', boardId: '5' },
    body: { fromColumnId: 1, toColumnId: 2 },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await createTransition(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('deleteTransition - deletes successfully', async () => {
  prismaMock.workflowTransition.delete = async () => ({ id: 1 });
  const req = createReq({ params: { id: '1' } });
  const res = createRes();
  const { next } = createNext();
  await deleteTransition(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
});
test('deleteTransition - handles P2025 error cleanly', async () => {
  prismaMock.workflowTransition.delete = async () => {
    throw new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
  };
  const req = createReq({ params: { id: '99' } });
  const res = createRes();
  const { next, calls } = createNext();
  await deleteTransition(req as never, res as never, next as never);
  assert.equal((calls[0] as HttpError).statusCode, 404);
});
test('deleteTransition - passes non-P2025 errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.workflowTransition.delete = async () => {
    throw mockError;
  };
  const req = createReq({ params: { id: '1' } });
  const res = createRes();
  const { next, calls } = createNext();
  await deleteTransition(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
