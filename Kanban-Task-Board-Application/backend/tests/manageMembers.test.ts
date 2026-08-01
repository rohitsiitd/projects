import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addMember,
  deleteMember,
  updateMember,
  getMembers,
} from '../src/controllers/manageMembers';

import { prisma } from '../lib/prisma.js';
import { AppError } from '../types/appError.js';

// defining type:
type mockRequest = {
  params: Record<string, string>;
  body: Record<string, unknown>;
  user?: {
    userId?: number;
    globalRole?: 'GLOBAL_ADMIN' | 'USER';
  };
};

type mockResponse = {
  statusCode: number | null;
  jsonPayload: unknown;
  status: (code: number) => mockResponse;
  json: (payload: unknown) => mockResponse;
};

//for following our error structure:
interface HttpError extends Error {
  statusCode: number;
}

//setting up mock prisma so that it return what we say:
const prismaMock = prisma as unknown as {
  project: {
    findUnique: (args: unknown) => Promise<unknown>;
  };
  user: {
    findUnique: (args: unknown) => Promise<unknown>;
  };
  projectMembership: {
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
  notification: {
    create: (args: unknown) => Promise<unknown>;
  };
};

//helper functions:
const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
  params: {},
  body: {},
  user: { globalRole: 'USER' },
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

//TESTING started: 1 -> 2 -> 3:
//Get members:
test('getMembers returns the project members', async () => {
  prismaMock.project.findUnique = async () => ({ id: 7 });
  prismaMock.projectMembership.findMany = async () => [
    {
      id: 1,
      userId: 11,
      projectId: 7,
      role: 'PROJECT_MEMBER',
      user: {
        id: 11,
        email: 'admin@taskboard.com',
        username: 'admin',
      },
    },
  ];

  const req = createReq({ params: { projectId: '7' } });
  const res = createRes();
  const { next, calls } = createNext();

  await getMembers(req as never, res as never, next as never);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.jsonPayload, {
    members: [
      {
        id: 1,
        userId: 11,
        projectId: 7,
        role: 'PROJECT_MEMBER',
        email: 'admin@taskboard.com',
        username: 'admin',
      },
    ],
  });
  assert.deepEqual(calls, []);
});

test('getMembers - returns 404 if project not found', async () => {
  prismaMock.project.findUnique = async () => null;

  const req = createReq({ params: { projectId: '99' } });
  const res = createRes();
  const { next, calls } = createNext();

  await getMembers(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.ok(calls[0] instanceof AppError);
  assert.equal((calls[0] as HttpError).statusCode, 404);
});

test('getMembers - passes unexpected errors to next()', async () => {
  const mockError = new Error('Database connection failed');
  prismaMock.project.findUnique = async () => {
    throw mockError;
  };

  const req = createReq({ params: { projectId: '7' } });
  const res = createRes();
  const { next, calls } = createNext();

  await getMembers(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});

//add member:
test('addMember - successfully adds a member', async () => {
  prismaMock.user.findUnique = async () => ({ id: 11, email: 'new@user.com' });
  prismaMock.project.findUnique = async () => ({ id: 7, name: 'Proj' });
  prismaMock.projectMembership.findUnique = async () => null;
  prismaMock.notification.create = async () => ({}); // Mock notification
  prismaMock.projectMembership.create = async (args: unknown) => {
    const requestArgs = args as { data: Record<string, unknown> };
    return { id: 1, ...requestArgs.data };
  };

  const req = createReq({
    params: { projectId: '7', email: 'new@user.com' },
    body: { role: 'PROJECT_MEMBER' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await addMember(req as never, res as never, next as never);
  //defning the type of response expected:
  type ExpectedAddResponse = {
    message: string;
    membership: { role: string; id: number; userId: number; projectId: number };
  };
  const payload = res.jsonPayload as ExpectedAddResponse;

  assert.equal(res.statusCode, 201);
  assert.equal(payload.message, 'Member added successfully');
  assert.equal(payload.membership.role, 'PROJECT_MEMBER');
  assert.equal(calls.length, 0);
});

test('addMember - defaults to PROJECT_VIEWER if an invalid role is provided', async () => {
  prismaMock.user.findUnique = async () => ({ id: 11, email: 'new@user.com' });
  prismaMock.project.findUnique = async () => ({ id: 7, name: 'Proj' });
  prismaMock.projectMembership.findUnique = async () => null;
  prismaMock.notification.create = async () => ({}); 
  
  let savedRole = '';
  prismaMock.projectMembership.create = async (args: unknown) => {
    const requestArgs = args as { data: { role: string } };
    savedRole = requestArgs.data.role;
    return { id: 1, ...requestArgs.data };
  };

  const req = createReq({
    params: { projectId: '7', email: 'new@user.com' },
    body: { role: 'SUPER_MADE_UP_ROLE' },
  });
  
  const res = createRes();
  const { next, calls } = createNext();

  await addMember(req as never, res as never, next as never);

  assert.equal(calls.length, 0);
  assert.equal(res.statusCode, 201);
  assert.equal(savedRole, 'PROJECT_VIEWER');
});

test('addMember - prevents adding an existing member', async () => {
  prismaMock.user.findUnique = async () => ({ id: 11, email: 'new@user.com' });
  prismaMock.project.findUnique = async () => ({ id: 7 });
  prismaMock.projectMembership.findUnique = async () => ({
    id: 1,
    role: 'PROJECT_MEMBER',
  });

  const req = createReq({
    params: { projectId: '7', email: 'new@user.com' },
    body: { role: 'PROJECT_MEMBER' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await addMember(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
  assert.match((calls[0] as AppError).message, /already a member/);
});

test('addMember - passes unexpected errors to next()', async () => {
  const mockError = new Error('Database connection failed');
  prismaMock.user.findUnique = async () => {
    throw mockError;
  };

  const req = createReq({ params: { projectId: '7', email: 'test@user.com' } });
  const res = createRes();
  const { next, calls } = createNext();

  await addMember(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});

//delete member:
test('deleteMember - successfully removes a member', async () => {
  prismaMock.user.findUnique = async () => ({
    id: 11,
    email: 'remove@user.com',
  });
  prismaMock.project.findUnique = async () => ({ id: 7 });
  prismaMock.projectMembership.findUnique = async () => ({
    id: 1,
    role: 'PROJECT_MEMBER',
  });
  prismaMock.projectMembership.delete = async () => ({});

  const req = createReq({
    params: { projectId: '7', email: 'remove@user.com' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await deleteMember(req as never, res as never, next as never);

  type ExpectedDeleteResponse = { message: string };
  const payload = res.jsonPayload as ExpectedDeleteResponse;

  assert.equal(res.statusCode, 200);
  assert.equal(payload.message, 'Member removed successfully');
  assert.equal(calls.length, 0);
});

test('deleteMember - prevents removing a PROJECT_ADMIN', async () => {
  prismaMock.user.findUnique = async () => ({
    id: 11,
    email: 'admin@user.com',
  });
  prismaMock.project.findUnique = async () => ({ id: 7 });
  prismaMock.projectMembership.findUnique = async () => ({
    id: 1,
    role: 'PROJECT_ADMIN',
  });

  const req = createReq({
    params: { projectId: '7', email: 'admin@user.com' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await deleteMember(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
  assert.match((calls[0] as AppError).message, /ADMIN of this project/);
});

test('deleteMember - passes unexpected errors to next()', async () => {
  const mockError = new Error('Database connection failed');
  prismaMock.user.findUnique = async () => {
    throw mockError;
  };

  const req = createReq({ params: { projectId: '7', email: 'test@user.com' } });
  const res = createRes();
  const { next, calls } = createNext();

  await deleteMember(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});

//update member:
test('updateMember - successfully updates a member role', async () => {
  prismaMock.user.findUnique = async () => ({
    id: 11,
    email: 'update@user.com',
    globalRole: 'USER',
  });
  prismaMock.project.findUnique = async () => ({ id: 7 });
  prismaMock.projectMembership.findUnique = async () => ({
    id: 1,
    role: 'PROJECT_VIEWER',
  });
  prismaMock.projectMembership.update = async () => ({});

  const req = createReq({
    params: { projectId: '7', email: 'update@user.com' },
    body: { role: 'PROJECT_MEMBER' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await updateMember(req as never, res as never, next as never);

  type ExpectedUpdateResponse = { message: string };
  const payload = res.jsonPayload as ExpectedUpdateResponse;

  assert.equal(res.statusCode, 200);
  assert.equal(payload.message, 'Member Role updated successfully');
  assert.equal(calls.length, 0);
});

test('updateMember - prevents changing role of a GLOBAL_ADMIN', async () => {
  prismaMock.user.findUnique = async () => ({
    id: 11,
    email: 'boss@user.com',
    globalRole: 'GLOBAL_ADMIN',
  });

  const req = createReq({
    params: { projectId: '7', email: 'boss@user.com' },
    body: { role: 'PROJECT_VIEWER' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await updateMember(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 404);
  assert.match((calls[0] as AppError).message, /Can't change role of ADMIN/);
});

test('updateMember - passes unexpected errors to next()', async () => {
  const mockError = new Error('Database connection failed');
  prismaMock.user.findUnique = async () => {
    throw mockError;
  };

  const req = createReq({
    params: { projectId: '7', email: 'test@user.com' },
    body: { role: 'PROJECT_MEMBER' },
  });
  const res = createRes();
  const { next, calls } = createNext();

  await updateMember(req as never, res as never, next as never);

  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});
