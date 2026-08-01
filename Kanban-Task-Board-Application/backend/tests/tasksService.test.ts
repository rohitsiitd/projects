import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import * as taskService from '../src/services/taskService.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../types/appError.js';

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

// prisma mock setup
const prismaMock = prisma as unknown as {
  task: PrismaModelMock;
  column: PrismaModelMock;
  project: PrismaModelMock;
  auditLog: PrismaModelMock;
  notification: PrismaModelMock;
  workflowTransition: PrismaModelMock;
  projectMembership: PrismaModelMock;
  $transaction: (...args: unknown[]) => Promise<unknown>;
};

// helper to catch errors cleanly in tests
const catchError = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return null;
  } catch (err) {
    return err as AppError | Error | Prisma.PrismaClientKnownRequestError;
  }
};

// setup default successful database responses for all helpers to pass
const resetMocks = () => {
  prismaMock.task = {
    create: async () => ({ id: 1, title: 'New Task', columnId: 5 }),
    findUnique: async () => ({
      id: 10,
      title: 'Existing Task',
      columnId: 5,
      issueType: 'TASK',
      priority: 'MEDIUM',
      assigneeId: null,
      reporterId: 1,
      parentId: null,
      resolvedAt: null,
      column: { boardId: 2, board: { projectId: 1 } },
      comments: [],
      auditLogs: [],
    }),
    findFirst: async () => ({ order: 0 }),
    findMany: async () => [],
    update: async () => ({
      id: 10,
      title: 'Updated Task',
      columnId: 6,
      parentId: null,
    }),
    updateMany: async () => ({}),
    delete: async () => ({
      id: 10,
      title: 'Deleted Task',
      parentId: null,
      column: { board: { projectId: 1 } },
    }),
    count: async () => 0,
  };

  prismaMock.column = {
    findUnique: async () => ({
      id: 5,
      boardId: 2,
      wipLimit: 10,
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
    findFirst: async () => ({ id: 1 }),
  };

  prismaMock.projectMembership = {
    findUnique: async () => ({ role: 'PROJECT_MEMBER' }),
  };

  // mock interactive transaction to execute the callback using our fake prisma client
  prismaMock.$transaction = async (cb: unknown) => {
    if (typeof cb === 'function') {
      return await cb(prismaMock);
    }
    return [];
  };
};

// initialize mocks before tests
resetMocks();

// create task tests
test('createTask - successfully creates a task', async () => {
  resetMocks();
  const result = await taskService.createTask(
    {
      title: 'New Task',
      columnId: 5,
      issueType: 'TASK',
    } as unknown as Parameters<typeof taskService.createTask>[0],
    1,
  );

  assert.ok(result);
  assert.equal((result as { title: string }).title, 'New Task');
});

test('createTask - throws 400 if title or columnid is missing', async () => {
  resetMocks();
  const err = await catchError(
    taskService.createTask(
      { title: '' } as unknown as Parameters<typeof taskService.createTask>[0],
      1,
    ),
  );

  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 400);
});

// get task tests
test('getTaskWithTimeline - successfully fetches task and builds timeline', async () => {
  resetMocks();
  const result = await taskService.getTaskWithTimeline(10);

  assert.ok(result);
  assert.equal((result as { title: string }).title, 'Existing Task');
  assert.ok(
    Array.isArray((result as { activityTimeline: unknown[] }).activityTimeline),
  );
});

test('getTaskWithTimeline - throws 404 if task not found', async () => {
  resetMocks();
  prismaMock.task.findUnique = async () => null;

  const err = await catchError(taskService.getTaskWithTimeline(99));

  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 404);
});

// update task tests
test('updateTask - successfully updates a task', async () => {
  resetMocks();
  const result = await taskService.updateTask(
    10,
    { title: 'Updated Task' } as unknown as Parameters<
      typeof taskService.updateTask
    >[1],
    1,
  );

  assert.ok(result);
  assert.equal((result as { title: string }).title, 'Updated Task');
});

test('updateTask - throws 404 if task not found', async () => {
  resetMocks();
  prismaMock.task.findUnique = async () => null;

  const err = await catchError(
    taskService.updateTask(
      99,
      { title: 'Updated Task' } as unknown as Parameters<
        typeof taskService.updateTask
      >[1],
      1,
    ),
  );

  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 404);
});

test('updateTask - throws 400 for invalid issue type conversion', async () => {
  resetMocks();
  prismaMock.task.findUnique = async () => ({
    issueType: 'STORY',
    column: { board: {} },
  });

  const err = await catchError(
    taskService.updateTask(
      10,
      { issueType: 'TASK' } as unknown as Parameters<
        typeof taskService.updateTask
      >[1],
      1,
    ),
  );

  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 400);
});

// move task tests
test('moveTask - successfully moves a task', async () => {
  resetMocks();
  const result = await taskService.moveTask(
    10,
    { targetColumnId: 6, newOrder: 2 } as unknown as Parameters<
      typeof taskService.moveTask
    >[1],
    1,
  );

  assert.ok(result);
  assert.equal((result as { columnId: number }).columnId, 6);
});

test('moveTask - throws 400 if trying to move a story directly', async () => {
  resetMocks();
  prismaMock.task.findUnique = async () => ({
    issueType: 'STORY',
    column: { boardId: 2 },
  });

  const err = await catchError(
    taskService.moveTask(
      10,
      { targetColumnId: 6, newOrder: 2 } as unknown as Parameters<
        typeof taskService.moveTask
      >[1],
      1,
    ),
  );

  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 400);
});

test('moveTask - throws 400 for cross board transfers', async () => {
  resetMocks();
  prismaMock.task.findUnique = async () => ({ column: { boardId: 2 } });
  prismaMock.column.findUnique = async () => ({ id: 6, boardId: 99 });

  const err = await catchError(
    taskService.moveTask(
      10,
      { targetColumnId: 6, newOrder: 2 } as unknown as Parameters<
        typeof taskService.moveTask
      >[1],
      1,
    ),
  );

  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 400);
});

// delete task tests
test('deleteTask - successfully deletes a task', async () => {
  resetMocks();
  const result = await taskService.deleteTask(10, 1);

  assert.ok(result);
  assert.equal((result as { title: string }).title, 'Deleted Task');
});

test('deleteTask - throws 404 if prisma throws p2025 error', async () => {
  resetMocks();
  prismaMock.task.delete = async () => {
    throw new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
  };

  const err = await catchError(taskService.deleteTask(10, 1));

  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 404);
});
