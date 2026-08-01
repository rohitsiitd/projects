import test from 'node:test';
import assert from 'node:assert/strict';
import {
  notifyStatusChanged,
  notifyTaskAssigned,
  buildActivityTimeline,
} from '../src/services/taskActivityService.js';
import { prisma } from '../lib/prisma.js';

type TimelineObject = {
  id: string;
  type: string;
  content?: string;
  field?: string;
};

const prismaMock = prisma as unknown as {
  notification: {
    create: (args: unknown) => Promise<unknown>;
    createMany: (args: unknown) => Promise<unknown>;
  };
};

test('notifyStatusChanged - notifies both assignee and reporter if they are different from user', async () => {
  let createdCalls = 0;
  prismaMock.notification.createMany = async (args: unknown) => {
    const requestArgs = args as { data: unknown[] };
    createdCalls = requestArgs.data.length;
    return { count: createdCalls };
  };
  await notifyStatusChanged(10, 'Task', 2, 3, 1);
  assert.equal(createdCalls, 2);
});
test('notifyStatusChanged - does not notify the user who made the change', async () => {
  let createdCalls = 0;
  prismaMock.notification.createMany = async (args: unknown) => {
    const requestArgs = args as { data: unknown[] };
    createdCalls = requestArgs.data.length;
    return { count: createdCalls };
  };
  await notifyStatusChanged(10, 'Task', 1, 1, 1); // User 1 made the change, is also assignee and reporter
  assert.equal(createdCalls, 0);
});

// --- NOTIFY TASK ASSIGNED ---
test('notifyTaskAssigned - notifies assignee if assigned by someone else', async () => {
  let wasCalled = false;
  prismaMock.notification.create = async () => {
    wasCalled = true;
    return {};
  };
  await notifyTaskAssigned(10, 'Task', 2, 1);
  assert.equal(wasCalled, true);
});
test('notifyTaskAssigned - does not notify if user assigns themselves', async () => {
  let wasCalled = false;
  prismaMock.notification.create = async () => {
    wasCalled = true;
    return {};
  };
  await notifyTaskAssigned(10, 'Task', 1, 1);
  assert.equal(wasCalled, false);
});

test('buildActivityTimeline - correctly merges and sorts comments and logs chronologically', () => {
  const comments = [
    {
      id: 1,
      content: 'First',
      createdAt: new Date('2023-01-01T10:00:00Z'),
      author: { id: 1, username: 'a', avatar: '' },
    },
  ];
  const logs = [
    {
      id: 2,
      type: 'STATUS_CHANGE',
      oldValue: '1',
      newValue: '2',
      createdAt: new Date('2023-01-02T10:00:00Z'),
      user: { id: 1, username: 'a', avatar: '' },
    },
  ];
  const timeline = buildActivityTimeline(
    comments as never[],
    logs as never[],
  ) as TimelineObject[];
  assert.equal(timeline.length, 2);
  assert.equal(timeline[0].type, 'auditLog'); // Latest first
  assert.equal(timeline[1].type, 'comment'); // Oldest last
  assert.equal(timeline[0].id, 'log-2');
  assert.equal(timeline[1].id, 'comment-1');
});
