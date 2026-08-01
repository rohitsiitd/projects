import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTask,
  getTask,
  getTasks,
  updateTask,
  moveTask,
  deleteTask,
} from '../src/controllers/taskController.js';
import { prisma } from '../lib/prisma.js';

// type definitions
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

type TaskPayload = {
  id: number;
  title: string;
  columnId: number;
  order: number;
};

type PrismaModelMock = {
  create?: (...args: unknown[]) => Promise<unknown>;
  findUnique?: (...args: unknown[]) => Promise<unknown>;
  findFirst?: (...args: unknown[]) => Promise<unknown>;
  findMany?: (...args: unknown[]) => Promise<unknown>;
  update?: (...args: unknown[]) => Promise<unknown>;
  updateMany?: (...args: unknown[]) => Promise<unknown>;
  delete?: (...args: unknown[]) => Promise<unknown>;
  count?: (...args: unknown[]) => Promise<unknown>;
  createMany?: (...args: unknown[]) => Promise<unknown>;
};

// prisma mock setup with all necessary relations
const prismaMock = prisma as unknown as {
  task: PrismaModelMock;
  column: PrismaModelMock;
  project: PrismaModelMock;
  auditLog: PrismaModelMock;
  notification: PrismaModelMock;
  workflowTransition: PrismaModelMock;
  $transaction: (...args: unknown[]) => Promise<unknown>;
};

// initialize mocks globally to prevent undefined errors in deeply nested service calls
prismaMock.column = {
  findUnique: async () => ({
    id: 6,
    boardId: 2,
    projectId: 1,
    board: { projectId: 1 },
  }),
};
prismaMock.project = {
  update: async () => ({}),
};
prismaMock.auditLog = {
  create: async () => ({}),
  createMany: async () => ({}),
};
prismaMock.notification = {
  create: async () => ({}),
  createMany: async () => ({}),
};
prismaMock.workflowTransition = {
  findFirst: async () => ({ id: 1, fromColumnId: 5, toColumnId: 6 }),
};
prismaMock.task = {
  create: async () => ({}),
  findUnique: async () => ({}),
  findFirst: async () => ({ order: 0 }),
  findMany: async () => [],
  update: async () => ({}),
  updateMany: async () => ({}),
  delete: async () => ({}),
  count: async () => 0,
};

// helper payload to pass all service validation checks including nested arrays
const validTask = {
  id: 10,
  title: 'Details',
  columnId: 5,
  order: 1,
  projectId: 1,
  boardId: 2,
  assigneeId: 1,
  reporterId: 1,
  issueType: 'TASK',
  priority: 'MEDIUM',
  parentId: null,
  dueDate: null,
  resolvedAt: null,
  closedAt: null,
  column: {
    id: 5,
    boardId: 2,
    projectId: 1,
    board: { projectId: 1 },
  },
  comments: [],
  auditLogs: [],
};

// helper functions with default valid params
const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
  params: { projectId: '1', boardId: '2', columnId: '5', taskId: '10' },
  body: {},
  user: { userId: 1 },
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

// create task tests
test('createTask successfully creates a task', async () => {
  prismaMock.task.create = async () => ({
    id: 1,
    title: 'New Task',
    columnId: 5,
    order: 0,
    assigneeId: null,
    parentId: null,
  });
  prismaMock.task.findFirst = async () => ({ order: 0 });
  prismaMock.column.findUnique = async () => ({ board: { projectId: 1 } });

  const req = createReq({ body: { title: 'New Task', columnId: 5 } });
  const res = createRes();
  const { next, calls } = createNext();

  await createTask(req as never, res as never, next as never);

  const payload = res.jsonPayload as TaskPayload;
  assert.equal(res.statusCode, 201);
  assert.equal(payload.title, 'New Task');
  assert.equal(calls.length, 0);
});

test('createTask fails if unauthorized', async () => {
  const req = createReq({
    user: undefined,
    body: { title: 'New Task', columnId: 5 },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await createTask(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});

test('createTask passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.task.create = async () => {
    throw mockError;
  };
  const req = createReq({ body: { title: 'New Task', columnId: 5 } });
  const res = createRes();
  const { next, calls } = createNext();

  await createTask(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// get task tests
test('getTask successfully fetches a single task', async () => {
  prismaMock.task.findUnique = async () => validTask;

  const req = createReq();
  const res = createRes();
  const { next, calls } = createNext();

  await getTask(req as never, res as never, next as never);

  const payload = res.jsonPayload as TaskPayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.id, 10);
  assert.equal(calls.length, 0);
});

test('getTask fails if taskId is missing', async () => {
  const req = createReq({
    params: { projectId: '1', boardId: '2', columnId: '5', taskId: '' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await getTask(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('getTask passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.task.findUnique = async () => {
    throw mockError;
  };
  const req = createReq();
  const res = createRes();
  const { next, calls } = createNext();

  await getTask(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// get tasks tests
test('getTasks successfully fetches tasks using Prisma', async () => {
  prismaMock.task.findMany = async () => [
    { id: 1, title: 'Task 1', columnId: 5, order: 0 },
  ];
  const req = createReq();
  const res = createRes();
  const { next, calls } = createNext();

  await getTasks(req as never, res as never, next as never);

  const payload = res.jsonPayload as TaskPayload[];
  assert.equal(res.statusCode, 200);
  assert.equal(payload.length, 1);
  assert.equal(payload[0].columnId, 5);
  assert.equal(calls.length, 0);
});

test('getTasks fails if columnId is missing', async () => {
  const req = createReq({
    params: { projectId: '1', boardId: '2', columnId: '', taskId: '10' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await getTasks(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});

test('getTasks passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Database crash');
  prismaMock.task.findMany = async () => {
    throw mockError;
  };
  const req = createReq();
  const res = createRes();
  const { next, calls } = createNext();

  await getTasks(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// update task tests
test('updateTask successfully updates a task', async () => {
  prismaMock.task.findUnique = async () => validTask;
  prismaMock.task.update = async () => ({
    ...validTask,
    title: 'Updated Task',
  });

  const req = createReq({
    body: { title: 'Updated Task' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await updateTask(req as never, res as never, next as never);

  const payload = res.jsonPayload as TaskPayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.title, 'Updated Task');
  assert.equal(calls.length, 0);
});

test('updateTask fails if unauthorized', async () => {
  const req = createReq({ user: undefined });
  const res = createRes();
  const { next, calls } = createNext();

  await updateTask(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});

test('updateTask passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.task.findUnique = async () => validTask;
  prismaMock.task.update = async () => {
    throw mockError;
  };
  const req = createReq({ body: { title: 'Updated Task' } });
  const res = createRes();
  const { next, calls } = createNext();

  await updateTask(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// move task tests
test('moveTask successfully moves a task', async () => {
  prismaMock.task.findUnique = async () => validTask;
  prismaMock.column.findUnique = async () => ({
    id: 6,
    boardId: 2,
    projectId: 1,
    board: { projectId: 1 },
  });

  prismaMock.$transaction = async () => ({
    ...validTask,
    columnId: 6,
    order: 2,
  });

  const req = createReq({
    body: { targetColumnId: 6, newOrder: 2 },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await moveTask(req as never, res as never, next as never);

  const payload = res.jsonPayload as TaskPayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.columnId, 6);
  assert.equal(calls.length, 0);
});

test('moveTask fails if unauthorized', async () => {
  const req = createReq({ user: undefined });
  const res = createRes();
  const { next, calls } = createNext();

  await moveTask(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});

test('moveTask passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.task.findUnique = async () => validTask;
  prismaMock.column.findUnique = async () => ({
    id: 6,
    boardId: 2,
    projectId: 1,
    board: { projectId: 1 },
  });

  prismaMock.$transaction = async () => {
    throw mockError;
  };

  const req = createReq({
    body: { targetColumnId: 6, newOrder: 2 },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await moveTask(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});

// delete task tests
test('deleteTask successfully deletes a task', async () => {
  prismaMock.task.findUnique = async () => validTask;
  prismaMock.task.delete = async () => validTask;

  const req = createReq();
  const res = createRes();
  const { next, calls } = createNext();

  await deleteTask(req as never, res as never, next as never);

  type DeletePayload = { message: string; deletedTask: TaskPayload };
  const payload = res.jsonPayload as DeletePayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.message, 'Task deleted successfully');
  assert.equal(payload.deletedTask.id, 10);
  assert.equal(calls.length, 0);
});

test('deleteTask fails if unauthorized', async () => {
  const req = createReq({ user: undefined });
  const res = createRes();
  const { next, calls } = createNext();

  await deleteTask(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});

test('deleteTask passes unexpected errors to next middleware', async () => {
  const mockError = new Error('Service crashed');
  prismaMock.task.findUnique = async () => validTask;
  prismaMock.task.delete = async () => {
    throw mockError;
  };

  const req = createReq();
  const res = createRes();
  const { next, calls } = createNext();

  await deleteTask(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as Error).message, mockError.message);
});
