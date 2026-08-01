import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
} from '../src/controllers/columnController.js';
import { prisma } from '../lib/prisma.js';

// type definitions
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

type ColumnPayload = {
  id: number;
  title: string;
  boardId: number;
  order: number;
  status: string;
};

// prisma mock setup
const prismaMock = prisma as unknown as {
  column: Record<string, (args: unknown) => Promise<unknown>>;
  board: Record<string, (args: unknown) => Promise<unknown>>;
  project: Record<string, (args: unknown) => Promise<unknown>>;
  $transaction: (args: unknown) => Promise<unknown>;
};

// initialize mocks globally to prevent undefined errors in deeply nested service calls
prismaMock.board = {
  findUnique: async () => ({ projectId: 1 }),
};
prismaMock.project = {
  update: async () => ({}),
};
prismaMock.column = {
  create: async () => ({}),
  findUnique: async () => ({
    id: 10,
    boardId: 5,
    order: 1,
    status: 'TODO',
    board: { projectId: 1 },
  }),
  findMany: async () => [],
  update: async () => ({}),
  updateMany: async () => ({}),
  delete: async () => ({}),
};
prismaMock.$transaction = async () => [];

// helper functions
const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
  params: {},
  body: {},
  ...overrides,
});

const createRes = (): mockResponse => {
  const res: mockResponse = {
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

// create column tests
test('createColumn successfully creates a column', async () => {
  prismaMock.column.create = async () => ({
    id: 1,
    title: 'New Col',
    boardId: 5,
    order: 0,
    status: 'TODO',
  });

  const req = createReq({
    params: { boardId: '5' },
    body: { title: 'New Col' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await createColumn(req as never, res as never, next as never);

  const payload = res.jsonPayload as ColumnPayload;
  assert.equal(res.statusCode, 201);
  assert.equal(payload.title, 'New Col');
  assert.equal(calls.length, 0);
});

test('createColumn fails if boardId is missing', async () => {
  const req = createReq({ params: {}, body: { title: 'New Col' } });
  const res = createRes();
  const { next, calls } = createNext();

  await createColumn(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('createColumn passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.column.create = async () => {
    throw mockError;
  };

  // passing valid body prevents the 400 validation error from intercepting our 500 mock crash
  const req = createReq({
    params: { boardId: '5' },
    body: { title: 'New Col' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await createColumn(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// get columns tests
test('getColumns successfully fetches columns', async () => {
  prismaMock.column.findMany = async () => [
    { id: 1, title: 'Col 1', boardId: 5, order: 0, status: 'TODO' },
  ];

  const req = createReq({ params: { boardId: '5' } });
  const res = createRes();
  const { next, calls } = createNext();

  await getColumns(req as never, res as never, next as never);

  const payload = res.jsonPayload as ColumnPayload[];
  assert.equal(res.statusCode, 200);
  assert.equal(payload.length, 1);
  assert.equal(payload[0].id, 1);
  assert.equal(calls.length, 0);
});

test('getColumns fails if boardId is missing', async () => {
  const req = createReq({ params: {} });
  const res = createRes();
  const { next, calls } = createNext();

  await getColumns(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('getColumns passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.column.findMany = async () => {
    throw mockError;
  };

  const req = createReq({ params: { boardId: '5' } });
  const res = createRes();
  const { next, calls } = createNext();

  await getColumns(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// update column tests
test('updateColumn successfully updates a column', async () => {
  prismaMock.column.findUnique = async () => ({
    id: 10,
    boardId: 5,
    order: 1,
    status: 'TODO',
    board: { projectId: 1 },
  });
  prismaMock.column.findMany = async () => []; // fixing poisoned mock from previous test
  prismaMock.column.update = async () => ({
    id: 10,
    title: 'Updated Col',
    boardId: 5,
    order: 1,
    status: 'DONE',
  });

  const req = createReq({
    params: { columnId: '10' },
    body: { title: 'Updated Col' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await updateColumn(req as never, res as never, next as never);

  const payload = res.jsonPayload as ColumnPayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.title, 'Updated Col');
  assert.equal(calls.length, 0);
});

test('updateColumn fails if columnId is missing', async () => {
  const req = createReq({ params: {} });
  const res = createRes();
  const { next, calls } = createNext();

  await updateColumn(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('updateColumn passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.column.findUnique = async () => ({
    id: 10,
    boardId: 5,
    order: 1,
    status: 'TODO',
    board: { projectId: 1 },
  });
  prismaMock.column.findMany = async () => [];
  prismaMock.column.update = async () => {
    throw mockError;
  };

  const req = createReq({
    params: { columnId: '10' },
    body: { title: 'Updated Col' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await updateColumn(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// delete column tests
test('deleteColumn successfully deletes a column', async () => {
  prismaMock.column.findUnique = async () => ({
    id: 10,
    boardId: 5,
    order: 1,
    status: 'TODO',
    board: { projectId: 1 },
  });
  prismaMock.column.findMany = async () => []; // fixing poisoned mock from previous test
  prismaMock.column.delete = async () => ({
    id: 10,
    title: 'To Delete',
    boardId: 5,
    order: 2,
    status: 'TODO',
  });

  const req = createReq({ params: { columnId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();

  await deleteColumn(req as never, res as never, next as never);

  type DeletePayload = { message: string; deletedColumn: ColumnPayload };
  const payload = res.jsonPayload as DeletePayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.message, 'Column deleted successfully');
  assert.equal(payload.deletedColumn.id, 10);
  assert.equal(calls.length, 0);
});

test('deleteColumn fails if columnId is missing', async () => {
  const req = createReq({ params: {} });
  const res = createRes();
  const { next, calls } = createNext();

  await deleteColumn(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('deleteColumn passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.column.findUnique = async () => ({
    id: 10,
    boardId: 5,
    order: 1,
    status: 'TODO',
    board: { projectId: 1 },
  });
  prismaMock.column.findMany = async () => [];
  prismaMock.column.delete = async () => {
    throw mockError;
  };

  const req = createReq({ params: { columnId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();

  await deleteColumn(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});
