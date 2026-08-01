import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enforceWipLimit,
  validateAssigneeMembership,
  validateTaskHierarchy,
  validateTransition,
  getResolutionDatesForColumn,
  syncStoryStatus,
} from '../src/utils/taskHelpers.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../types/appError.js';

//mock setup:
const prismaMock = prisma as unknown as {
  column: { findUnique: (args: unknown) => Promise<unknown> };
  task: {
    count: (args: unknown) => Promise<number>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
  projectMembership: { findUnique: (args: unknown) => Promise<unknown> };
  workflowTransition: { findFirst: (args: unknown) => Promise<unknown> };
  auditLog: { create: (args: unknown) => Promise<unknown> };
};

// enforceWipLimit
test('enforceWipLimit: passes when under WIP limit', async () => {
  prismaMock.column.findUnique = async () => ({
    id: 1,
    wipLimit: 5,
    title: 'In Progress',
  });
  prismaMock.task.count = async () => 3; // 3 is less than 5
  await assert.doesNotReject(enforceWipLimit(1));
});
test('enforceWipLimit: throws when WIP limit is exceeded', async () => {
  prismaMock.column.findUnique = async () => ({
    id: 1,
    wipLimit: 5,
    title: 'In Progress',
  });
  prismaMock.task.count = async () => 5; // 5 is >= 5, should throw
  await assert.rejects(enforceWipLimit(1), (err: AppError) => {
    assert.equal(err.statusCode, 400);
    assert.match(err.message, /WIP Limit Reached/);
    return true;
  });
});

//validateAssigneeMembership tests
test('validateAssigneeMembership: throws if column not found', async () => {
  prismaMock.column.findUnique = async () => null;
  await assert.rejects(
    validateAssigneeMembership(1, 999),
    (err: AppError) => err.statusCode === 404,
  );
});
test('validateAssigneeMembership: throws if user is not in project', async () => {
  prismaMock.column.findUnique = async () => ({ board: { projectId: 10 } });
  prismaMock.projectMembership.findUnique = async () => null;
  await assert.rejects(
    validateAssigneeMembership(1, 1),
    (err: AppError) =>
      err.statusCode === 400 && err.message.includes('Validation Error'),
  );
});
test('validateAssigneeMembership: passes if user is in project', async () => {
  prismaMock.column.findUnique = async () => ({ board: { projectId: 10 } });
  prismaMock.projectMembership.findUnique = async () => ({ id: 1 });
  await assert.doesNotReject(validateAssigneeMembership(1, 1));
});

//validateTaskHierarchy tests
test('validateTaskHierarchy: throws if parent is not a STORY', async () => {
  prismaMock.task.findUnique = async () => ({ issueType: 'BUG' }); // Parent is a BUG
  await assert.rejects(
    validateTaskHierarchy(1, 'TASK'),
    (err: AppError) =>
      err.statusCode === 400 && err.message.includes('child of a STORY'),
  );
});
test('validateTaskHierarchy: throws if child is a STORY', async () => {
  prismaMock.task.findUnique = async () => ({ issueType: 'STORY' }); // Parent is STORY
  await assert.rejects(
    validateTaskHierarchy(1, 'STORY'), // But child is also a STORY
    (err: AppError) =>
      err.statusCode === 400 && err.message.includes('cannot be a child'),
  );
});
test('validateTaskHierarchy: passes for valid hierarchy', async () => {
  prismaMock.task.findUnique = async () => ({ issueType: 'STORY' });
  await assert.doesNotReject(validateTaskHierarchy(1, 'TASK'));
});

//validateTransition Tests
test('validateTransition: throws if transition is invalid', async () => {
  prismaMock.workflowTransition.findFirst = async () => null;
  await assert.rejects(
    validateTransition(1, 1, 3),
    (err: AppError) => err.statusCode === 400,
  );
});
test('validateTransition: passes if transition exists', async () => {
  prismaMock.workflowTransition.findFirst = async () => ({ id: 1 });
  await assert.doesNotReject(validateTransition(1, 1, 3));
});

//getResolutionDatesForColumn
test('getResolutionDatesForColumn: DONE column returns both dates', async () => {
  prismaMock.column.findUnique = async () => ({ status: 'DONE' });
  const result = await getResolutionDatesForColumn(1, null);
  assert.ok(result.resolvedAt);
  assert.ok(result.closedAt);
});
test('getResolutionDatesForColumn: IN_REVIEW column returns resolvedAt only', async () => {
  prismaMock.column.findUnique = async () => ({ status: 'IN_REVIEW' });
  const result = await getResolutionDatesForColumn(1, null);
  assert.ok(result.resolvedAt);
  assert.equal(result.closedAt, null);
});

// syncStoryStatus tests
test('syncStoryStatus: moves story to DONE if all children are DONE', async () => {
  let updateCalled = false;
  let auditCalled = false;
  prismaMock.task.findUnique = async () => ({
    id: 100,
    issueType: 'STORY',
    columnId: 1, // Currently in TODO
    children: [{ column: { status: 'DONE' } }, { column: { status: 'DONE' } }],
    column: {
      board: {
        columns: [
          { id: 1, status: 'TODO' },
          { id: 2, status: 'IN_PROGRESS' },
          { id: 3, status: 'DONE' },
        ],
      },
    },
  });
  prismaMock.task.update = async (args: unknown) => {
    updateCalled = true;
    const updateArgs = args as { data: { columnId: number } };
    assert.equal(updateArgs.data.columnId, 3);
    return {};
  };
  prismaMock.auditLog.create = async () => {
    auditCalled = true;
    return {};
  };
  await syncStoryStatus(100, 1);
  assert.ok(updateCalled);
  assert.ok(auditCalled);
});
test('syncStoryStatus: moves story to IN_PROGRESS if children are mixed', async () => {
  let updateCalled = false;
  prismaMock.task.findUnique = async () => ({
    id: 100,
    issueType: 'STORY',
    columnId: 1, // Currently in TODO
    children: [{ column: { status: 'DONE' } }, { column: { status: 'TODO' } }],
    column: {
      board: {
        columns: [
          { id: 1, status: 'TODO' },
          { id: 2, status: 'IN_PROGRESS' },
          { id: 3, status: 'DONE' },
        ],
      },
    },
  });
  prismaMock.task.update = async (args: unknown) => {
    updateCalled = true;
    const updateArgs = args as { data: { columnId: number } };
    assert.equal(updateArgs.data.columnId, 2);
    return {};
  };
  prismaMock.auditLog.create = async () => ({});
  await syncStoryStatus(100, 1);
  assert.ok(updateCalled);
});
test('syncStoryStatus: does nothing if story is already in the correct column', async () => {
  let updateCalled = false;
  prismaMock.task.findUnique = async () => ({
    id: 100,
    issueType: 'STORY',
    columnId: 3,
    children: [{ column: { status: 'DONE' } }],
    column: {
      board: {
        columns: [{ id: 3, status: 'DONE' }],
      },
    },
  });
  prismaMock.task.update = async () => {
    updateCalled = true;
  };
  await syncStoryStatus(100, 1);
  assert.equal(updateCalled, false);
});
