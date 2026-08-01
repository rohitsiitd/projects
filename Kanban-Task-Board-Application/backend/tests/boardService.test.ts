import test from 'node:test';
import assert from 'node:assert/strict';
import * as boardService from '../src/services/boardService.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../types/appError.js';
import { Prisma } from '@prisma/client';

//type definitions:
interface HttpError extends Error {
  statusCode: number;
}
type BoardPayload = {
  id: number;
  title: string;
  description: string | null;
  projectId: number;
};

//mock setup
const prismaMock = prisma as unknown as {
  board: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  column: {
    create: (args: unknown) => Promise<unknown>;
  };
  workflowTransition: {
    createMany: (args: unknown) => Promise<unknown>;
  };
  project: {
    update: (args: unknown) => Promise<unknown>;
  };
  $transaction: (args: unknown[]) => Promise<unknown[]>;
};

prismaMock.project = { update: async () => ({}) };

//started testing:

// create board:
test('createBoard - successfully creates board, columns, and transitions', async () => {
  prismaMock.board.create = async (args: unknown) => {
    const requestArgs = args as { data: Record<string, unknown> };
    return { id: 1, ...requestArgs.data };
  };
  prismaMock.$transaction = async () => [
    { id: 101, title: 'To Do', order: 0, boardId: 1, status: 'TODO' },
    {
      id: 102,
      title: 'In Progress',
      order: 1,
      boardId: 1,
      status: 'IN_PROGRESS',
    },
    { id: 103, title: 'Review', order: 2, boardId: 1, status: 'IN_REVIEW' },
    { id: 104, title: 'Done', order: 3, boardId: 1, status: 'DONE' },
  ];
  prismaMock.workflowTransition.createMany = async () => ({ count: 6 });
  const result = (await boardService.createBoard(5, {
    title: 'New Board',
    description: 'Desc',
  })) as BoardPayload;
  assert.equal(result.id, 1);
  assert.equal(result.title, 'New Board');
  assert.equal(result.projectId, 5);
});
test('createBoard - throws 400 if title is missing', async () => {
  let caughtError: unknown;
  try {
    await boardService.createBoard(5, { title: '', description: 'Desc' });
  } catch (error) {
    caughtError = error;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 400);
});

//get baords:
test('getBoardsByProjectId - successfully fetches boards', async () => {
  prismaMock.board.findMany = async () => [
    { id: 1, title: 'Board 1', projectId: 5 },
  ];
  const results = (await boardService.getBoardsByProjectId(
    5,
  )) as BoardPayload[];
  assert.equal(results.length, 1);
  assert.equal(results[0].projectId, 5);
});

//by id:
test('getBoardById - successfully fetches a single board', async () => {
  prismaMock.board.findUnique = async () => ({
    id: 10,
    title: 'Details',
    projectId: 5,
  });
  const result = (await boardService.getBoardById(10)) as BoardPayload;
  assert.equal(result.id, 10);
  assert.equal(result.title, 'Details');
});
test('getBoardById - throws 404 if board not found', async () => {
  prismaMock.board.findUnique = async () => null;
  let caughtError: unknown;
  try {
    await boardService.getBoardById(99);
  } catch (error) {
    caughtError = error;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 404);
});

//update board:
test('updateBoard - successfully updates a board', async () => {
  prismaMock.board.findUnique = async () => ({
    id: 10,
    title: 'Old Title',
    projectId: 5,
  });
  prismaMock.board.update = async (args: unknown) => {
    const requestArgs = args as { data: Record<string, unknown> };
    return { id: 10, projectId: 5, ...requestArgs.data };
  };
  const result = (await boardService.updateBoard(10, {
    title: 'Updated Title',
  })) as BoardPayload;
  assert.equal(result.title, 'Updated Title');
});
test('updateBoard - throws 404 if board to update is not found', async () => {
  prismaMock.board.findUnique = async () => null;
  let caughtError: unknown;
  try {
    await boardService.updateBoard(99, { title: 'Updated Title' });
  } catch (error) {
    caughtError = error;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 404);
});

//delete board:
test('deleteBoard - successfully deletes a board', async () => {
  prismaMock.board.delete = async () => ({
    id: 10,
    title: 'To Delete',
    projectId: 5,
  });
  const result = (await boardService.deleteBoard(10)) as BoardPayload;
  assert.equal(result.id, 10);
});
test('deleteBoard - throws 404 if board to delete is not found (Prisma P2025)', async () => {
  prismaMock.board.delete = async () => {
    throw new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
  };
  let caughtError: unknown;
  try {
    await boardService.deleteBoard(99);
  } catch (error) {
    caughtError = error;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 404);
});
test('deleteBoard - passes non-P2025 unexpected errors upward', async () => {
  const genericError = new Error('Database disconnected');
  prismaMock.board.delete = async () => {
    throw genericError;
  };
  let caughtError: unknown;
  try {
    await boardService.deleteBoard(10);
  } catch (error) {
    caughtError = error;
  }
  assert.strictEqual(caughtError, genericError);
});
