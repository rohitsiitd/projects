import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../src/controllers/commentController.js';
import { prisma } from '../lib/prisma.js';

type mockRequest = {
  params: Record<string, string>;
  body: Record<string, unknown>;
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
  task: { findUnique: (args: unknown) => Promise<unknown> };
  comment: {
    findMany: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  user: { findMany: (args: unknown) => Promise<unknown[]> };
  notification: {
    create: (args: unknown) => Promise<unknown>;
    createMany: (args: unknown) => Promise<unknown>;
  };
  auditLog: { create: (args: unknown) => Promise<unknown> };
};

const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
  params: {},
  body: {},
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

test('getComments - fetches comments successfully', async () => {
  prismaMock.task.findUnique = async () => ({ id: 5 });
  prismaMock.comment.findMany = async () => [
    { id: 1, content: 'Test', taskId: 5 },
  ];
  const req = createReq({ params: { taskId: '5' } });
  const res = createRes();
  const { next } = createNext();
  await getComments(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
  assert.equal((res.jsonPayload as { id: number }[])[0].id, 1);
});
test('getComments - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.task.findUnique = async () => {
    throw mockError;
  };
  const req = createReq({ params: { taskId: '5' } });
  const res = createRes();
  const { next, calls } = createNext();
  await getComments(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('createComment - successfully creates comment and mentions', async () => {
  prismaMock.comment.create = async () => ({
    id: 10,
    content: 'Hello @john',
    author: { username: 'me' },
  });
  prismaMock.task.findUnique = async () => ({ assigneeId: 2, title: 'Task' });
  prismaMock.user.findMany = async () => [{ id: 3 }];
  prismaMock.notification.create = async () => ({});
  prismaMock.notification.createMany = async () => ({});
  prismaMock.auditLog.create = async () => ({});
  const req = createReq({
    params: { taskId: '5' },
    body: { content: 'Hello @john' },
  });
  const res = createRes();
  const { next } = createNext();
  await createComment(req as never, res as never, next as never);
  assert.equal(res.statusCode, 201);
  assert.equal((res.jsonPayload as { id: number }).id, 10);
});
test('createComment - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.comment.create = async () => {
    throw mockError;
  };
  const req = createReq({
    params: { taskId: '5' },
    body: { content: 'Hello' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await createComment(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('updateComment - successfully updates owned comment', async () => {
  prismaMock.comment.findUnique = async () => ({
    id: 10,
    authorId: 1,
    content: 'Old',
    taskId: 5,
    author: { username: 'me' },
  });
  prismaMock.comment.update = async () => ({ id: 10, content: 'New' });
  prismaMock.auditLog.create = async () => ({});
  const req = createReq({
    params: { commentId: '10' },
    body: { content: 'New' },
  });
  const res = createRes();
  const { next } = createNext();
  await updateComment(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
  assert.equal((res.jsonPayload as { content: string }).content, 'New');
});
test('updateComment - fails if user is not author', async () => {
  prismaMock.comment.findUnique = async () => ({ id: 10, authorId: 99 });
  const req = createReq({
    params: { commentId: '10' },
    body: { content: 'New' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await updateComment(req as never, res as never, next as never);
  assert.equal((calls[0] as HttpError).statusCode, 403);
});
test('updateComment - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.comment.findUnique = async () => {
    throw mockError;
  };
  const req = createReq({
    params: { commentId: '10' },
    body: { content: 'New' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await updateComment(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('deleteComment - successfully deletes owned comment', async () => {
  prismaMock.comment.findUnique = async () => ({
    id: 10,
    authorId: 1,
    taskId: 5,
  });
  prismaMock.comment.delete = async () => ({ id: 10 });
  prismaMock.auditLog.create = async () => ({});
  const req = createReq({ params: { commentId: '10' } });
  const res = createRes();
  const { next } = createNext();
  await deleteComment(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
});
test('deleteComment - fails if user is not author', async () => {
  prismaMock.comment.findUnique = async () => ({ id: 10, authorId: 99 });
  const req = createReq({ params: { commentId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();
  await deleteComment(req as never, res as never, next as never);
  assert.equal((calls[0] as HttpError).statusCode, 403);
});
test('deleteComment - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.comment.findUnique = async () => {
    throw mockError;
  };
  const req = createReq({ params: { commentId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();
  await deleteComment(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
