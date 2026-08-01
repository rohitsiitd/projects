import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBoard,
  getBoards,
  getBoardDetails,
  updateBoard,
  deleteBoard,
} from '../src/controllers/boardController.js';
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

type BoardPayload = { id: number; title: string; projectId: number };

// prisma mock setup
const prismaMock = prisma as unknown as {
  board: Record<string, (args: unknown) => Promise<unknown>>;
  column: Record<string, (args: unknown) => Promise<unknown>>;
  project: Record<string, (args: unknown) => Promise<unknown>>;
  workflowTransition: Record<string, (args: unknown) => Promise<unknown>>;
  $transaction: (args: unknown) => Promise<unknown>;
};

// initialize mocks globally to prevent undefined errors in deeply nested service calls
prismaMock.project = {
  update: async () => ({}),
};
prismaMock.column = {
  create: async () => ({}),
};
prismaMock.workflowTransition = {
  createMany: async () => ({}),
};
prismaMock.board = {
  create: async () => ({}),
  findUnique: async () => ({}),
  findMany: async () => [],
  update: async () => ({}),
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

// create board tests
test('createBoard successfully creates a board', async () => {
  prismaMock.board.create = async () => ({
    id: 1,
    title: 'New Board',
    projectId: 5,
  });
  // mock transaction to return 4 columns so workflow generation succeeds
  prismaMock.$transaction = async () => [
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
  ];

  const req = createReq({
    params: { projectId: '5' },
    body: { title: 'New Board' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await createBoard(req as never, res as never, next as never);

  const payload = res.jsonPayload as BoardPayload;
  assert.equal(res.statusCode, 201);
  assert.equal(payload.title, 'New Board');
  assert.equal(calls.length, 0);
});

test('createBoard fails if projectId is missing', async () => {
  const req = createReq({ params: {}, body: { title: 'New Board' } });
  const res = createRes();
  const { next, calls } = createNext();

  await createBoard(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('createBoard passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.board.create = async () => {
    throw mockError;
  };

  const req = createReq({
    params: { projectId: '5' },
    body: { title: 'New Board' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await createBoard(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// get boards tests
test('getBoards successfully fetches boards', async () => {
  prismaMock.board.findMany = async () => [
    { id: 1, title: 'Board 1', projectId: 5 },
  ];

  const req = createReq({ params: { projectId: '5' } });
  const res = createRes();
  const { next, calls } = createNext();

  await getBoards(req as never, res as never, next as never);

  const payload = res.jsonPayload as BoardPayload[];
  assert.equal(res.statusCode, 200);
  assert.equal(payload.length, 1);
  assert.equal(payload[0].id, 1);
  assert.equal(calls.length, 0);
});

test('getBoards fails if projectId is missing', async () => {
  const req = createReq({ params: {} });
  const res = createRes();
  const { next, calls } = createNext();

  await getBoards(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('getBoards passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.board.findMany = async () => {
    throw mockError;
  };

  const req = createReq({ params: { projectId: '5' } });
  const res = createRes();
  const { next, calls } = createNext();

  await getBoards(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// get board details tests
test('getBoardDetails successfully fetches a single board', async () => {
  prismaMock.board.findUnique = async () => ({
    id: 10,
    title: 'Details',
    projectId: 5,
  });

  const req = createReq({ params: { boardId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();

  await getBoardDetails(req as never, res as never, next as never);

  const payload = res.jsonPayload as BoardPayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.id, 10);
  assert.equal(calls.length, 0);
});

test('getBoardDetails fails if boardId is missing', async () => {
  const req = createReq({ params: {} });
  const res = createRes();
  const { next, calls } = createNext();

  await getBoardDetails(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('getBoardDetails passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.board.findUnique = async () => {
    throw mockError;
  };

  const req = createReq({ params: { boardId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();

  await getBoardDetails(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// update board tests
test('updateBoard successfully updates a board', async () => {
  prismaMock.board.findUnique = async () => ({
    id: 10,
    title: 'Old Title',
    projectId: 5,
  });
  prismaMock.board.update = async () => ({
    id: 10,
    title: 'Updated Title',
    projectId: 5,
  });

  const req = createReq({
    params: { boardId: '10' },
    body: { title: 'Updated Title' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await updateBoard(req as never, res as never, next as never);

  const payload = res.jsonPayload as BoardPayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.title, 'Updated Title');
  assert.equal(calls.length, 0);
});

test('updateBoard fails if boardId is missing', async () => {
  const req = createReq({ params: {} });
  const res = createRes();
  const { next, calls } = createNext();

  await updateBoard(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('updateBoard passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.board.findUnique = async () => {
    throw mockError;
  };

  const req = createReq({ params: { boardId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();

  await updateBoard(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// delete board tests
test('deleteBoard successfully deletes a board', async () => {
  prismaMock.board.delete = async () => ({
    id: 10,
    title: 'To Delete',
    projectId: 5,
  });

  const req = createReq({ params: { boardId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();

  await deleteBoard(req as never, res as never, next as never);

  type DeletePayload = { message: string; deletedBoard: BoardPayload };
  const payload = res.jsonPayload as DeletePayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.message, 'Board deleted successfully');
  assert.equal(payload.deletedBoard.id, 10);
  assert.equal(calls.length, 0);
});

test('deleteBoard fails if boardId is missing', async () => {
  const req = createReq({ params: {} });
  const res = createRes();
  const { next, calls } = createNext();

  await deleteBoard(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('deleteBoard passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.board.delete = async () => {
    throw mockError;
  };

  const req = createReq({ params: { boardId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();

  await deleteBoard(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});
