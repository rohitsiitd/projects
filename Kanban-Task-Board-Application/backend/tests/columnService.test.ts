import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import * as columnService from '../src/services/columnService.js';
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
  column: PrismaModelMock;
  board: PrismaModelMock;
  project: PrismaModelMock;
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

// create column tests
test('createColumn - successfully creates a column', async () => {
  prismaMock.column.create = async () => ({
    id: 1,
    title: 'New Col',
    boardId: 5,
    order: 0,
    status: 'TODO',
  });
  prismaMock.board.findUnique = async () => ({ id: 5, projectId: 1 });
  prismaMock.project.update = async () => ({});

  const result = await columnService.createColumn(5, {
    title: 'New Col',
  } as unknown as Parameters<typeof columnService.createColumn>[1]);

  assert.ok(result); // fixes typescript possibly null error
  assert.equal((result as { title: string }).title, 'New Col');
});

test('createColumn - throws 400 if title is missing', async () => {
  const err = await catchError(
    columnService.createColumn(5, { title: '' } as unknown as Parameters<
      typeof columnService.createColumn
    >[1]),
  );

  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 400);
});

// get columns tests
test('getColumnsByBoardId - successfully fetches columns', async () => {
  prismaMock.column.findMany = async () => [
    { id: 1, title: 'Col 1', boardId: 5, order: 0, status: 'TODO' },
  ];

  const result = await columnService.getColumnsByBoardId(5);

  assert.ok(result); // fixes typescript possibly null error
  assert.equal((result as unknown[]).length, 1);
  assert.equal(((result as unknown[])[0] as { id: number }).id, 1);
});

// update column tests
test('updateColumn - successfully updates a column without changing order', async () => {
  prismaMock.column.findUnique = async () => ({
    id: 10,
    title: 'Old Title',
    boardId: 5,
    order: 1,
    status: 'TODO',
    board: { projectId: 1 },
  });
  prismaMock.column.findMany = async () => [];
  prismaMock.column.update = async () => ({
    id: 10,
    title: 'Updated Title',
    boardId: 5,
    order: 1,
    status: 'DONE',
  });
  prismaMock.project.update = async () => ({});

  const result = await columnService.updateColumn(10, {
    title: 'Updated Title',
    status: 'DONE',
  } as unknown as Parameters<typeof columnService.updateColumn>[1]);

  assert.ok(result); // fixes typescript possibly null error
  assert.equal((result as { title: string }).title, 'Updated Title');
  assert.equal((result as { status: string }).status, 'DONE');
});

test('updateColumn - successfully shifts columns and updates order', async () => {
  let findUniqueCallCount = 0;
  prismaMock.column.findUnique = async () => {
    findUniqueCallCount++;
    if (findUniqueCallCount === 1) {
      return {
        id: 10,
        title: 'Old Title',
        boardId: 5,
        order: 1,
        status: 'TODO',
        board: { projectId: 1 },
      };
    }
    return {
      id: 10,
      title: 'Old Title',
      boardId: 5,
      order: 2,
      status: 'TODO',
    };
  };

  prismaMock.column.findMany = async () => [];
  prismaMock.$transaction = async () => {};
  prismaMock.project.update = async () => ({});

  const result = await columnService.updateColumn(10, {
    order: 2,
  } as unknown as Parameters<typeof columnService.updateColumn>[1]);

  assert.ok(result); // fixes typescript possibly null error
  assert.equal((result as { order: number }).order, 2);
});

test('updateColumn - throws 404 if column to update is not found', async () => {
  prismaMock.column.findUnique = async () => null;

  const err = (await catchError(
    columnService.updateColumn(10, {
      title: 'Updated Title',
    } as unknown as Parameters<typeof columnService.updateColumn>[1]),
  )) as AppError;

  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 404);
});

// delete column tests
test('deleteColumn - successfully deletes a column', async () => {
  prismaMock.column.findUnique = async () => ({
    id: 10,
    boardId: 5,
    board: { projectId: 1 },
  });
  prismaMock.column.findMany = async () => [];
  prismaMock.column.delete = async () => ({
    id: 10,
    title: 'To Delete',
  });
  prismaMock.project.update = async () => ({});

  const result = await columnService.deleteColumn(10);

  assert.ok(result); // fixes typescript possibly null error
  assert.equal((result as { title: string }).title, 'To Delete');
});

test('deleteColumn - throws 404 if column to delete is not found', async () => {
  prismaMock.column.findUnique = async () => null;
  prismaMock.column.delete = async () => {
    throw new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
  };

  const err = (await catchError(columnService.deleteColumn(10))) as AppError;

  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 404);
});

test('deleteColumn - passes unexpected errors upward', async () => {
  const mockError = new Error('Database crash');
  prismaMock.column.findUnique = async () => null;
  prismaMock.column.delete = async () => {
    throw mockError;
  };

  const err = await catchError(columnService.deleteColumn(10));

  assert.strictEqual(err, mockError);
});
