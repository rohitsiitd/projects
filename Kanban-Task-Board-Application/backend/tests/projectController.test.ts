import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProject,
  updateProject,
  getProjects,
  projectArchive,
  unarchiveProject,
  deleteProject,
} from '../src/controllers/ProjectControllers.js';
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

const prismaMock = prisma as unknown as {
  project: {
    create: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  projectMembership: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
  };
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

test('createProject - successfully creates project and membership', async () => {
  prismaMock.project.create = async () => ({ id: 5, name: 'P1' });
  prismaMock.projectMembership.create = async () => ({});
  const req = createReq({ body: { projectname: 'P1', description: 'D' } });
  const res = createRes();
  const { next } = createNext();
  await createProject(req as never, res as never, next as never);
  assert.equal(res.statusCode, 201);
});
test('createProject - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.project.create = async () => {
    throw mockError;
  };
  const req = createReq({ body: { projectname: 'P1' } });
  const res = createRes();
  const { next, calls } = createNext();
  await createProject(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('updateProject - successfully updates unarchived project', async () => {
  prismaMock.project.findUnique = async () => ({ id: 5, archived: false });
  prismaMock.project.update = async () => ({ id: 5, name: 'New' });
  const req = createReq({
    params: { projectId: '5' },
    body: { projectname: 'New' },
  });
  const res = createRes();
  const { next } = createNext();
  await updateProject(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
});
test('updateProject - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.project.findUnique = async () => {
    throw mockError;
  };
  const req = createReq({
    params: { projectId: '5' },
    body: { projectname: 'New' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await updateProject(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('getProjects - fetches memberships', async () => {
  prismaMock.projectMembership.findMany = async () => [
    { project: { id: 5 }, role: 'ADMIN' },
  ];
  const req = createReq();
  const res = createRes();
  const { next } = createNext();
  await getProjects(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
  assert.equal(
    (
      (res.jsonPayload as { projects: unknown[] }).projects[0] as {
        userRole: string;
      }
    ).userRole,
    'ADMIN',
  );
});
test('getProjects - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.projectMembership.findMany = async () => {
    throw mockError;
  };
  const req = createReq();
  const res = createRes();
  const { next, calls } = createNext();
  await getProjects(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('projectArchive - successfully archives', async () => {
  prismaMock.project.findUnique = async () => ({ id: 5, archived: false, createdById: 1 });
  prismaMock.project.update = async () => ({ id: 5 });
  const req = createReq({ params: { projectId: '5' } });
  const res = createRes();
  const { next } = createNext();
  await projectArchive(req as never, res as never, next as never);
  assert.equal(res.statusCode, 201);
});
test('projectArchive - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.project.findUnique = async () => {
    throw mockError;
  };
  const req = createReq({ params: { projectId: '5' } });
  const res = createRes();
  const { next, calls } = createNext();
  await projectArchive(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('unarchiveProject - successfully unarchives', async () => {
  prismaMock.project.findUnique = async () => ({ id: 5, archived: true, createdById: 1 });
  prismaMock.project.update = async () => ({ id: 5 });
  const req = createReq({ params: { projectId: '5' } });
  const res = createRes();
  const { next } = createNext();
  await unarchiveProject(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
});
test('unarchiveProject - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.project.findUnique = async () => {
    throw mockError;
  };
  const req = createReq({ params: { projectId: '5' } });
  const res = createRes();
  const { next, calls } = createNext();
  await unarchiveProject(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('deleteProject - successfully deletes', async () => {
  prismaMock.project.findUnique = async () => ({ id: 5, createdById: 1 });
  prismaMock.project.delete = async () => ({ id: 5 });
  const req = createReq({ params: { projectId: '5' } });
  const res = createRes();
  const { next } = createNext();
  await deleteProject(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
});
test('deleteProject - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.project.findUnique = async () => {
    throw mockError;
  };
  const req = createReq({ params: { projectId: '5' } });
  const res = createRes();
  const { next, calls } = createNext();
  await deleteProject(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});