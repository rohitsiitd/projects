import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../lib/prisma.js';
import { clrDb } from './testSetup.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Project, Board } from '@prisma/client';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'super_secret_test_key';
describe('e2e api routes test', () => {
  let usr: User;
  let proj: Project;
  let brd: Board;
  let myCookie: string;

  beforeEach(async () => {
    // wipe out the db completely
    await clrDb();
    // make a dummy user
    const pwHash = await bcrypt.hash('password123', 10);
    usr = await prisma.user.create({
      data: {
        username: 'testusr99',
        email: 'testuser99@example.com',
        password: pwHash,
      },
    });
    // bake a jwt cookie manually
    const pl = { userId: usr.id, globalRole: 'USER' };
    const tok = jwt.sign(pl, process.env.JWT_SECRET!, { expiresIn: '1h' });
    myCookie = `accessToken=${tok}`;

    // setup a project
    proj = await prisma.project.create({
      data: {
        name: 'test proj',
        createdById: usr.id,
      },
    });
    // add the user as an admin to the project
    await prisma.projectMembership.create({
      data: {
        userId: usr.id,
        projectId: proj.id,
        role: 'PROJECT_ADMIN',
      },
    });

    // throw a board in there
    brd = await prisma.board.create({
      data: {
        title: 'test brd',
        projectId: proj.id,
      },
    });
  });

  test('makes a column and checks prisma db', async () => {
    const stuff = {
      title: 'cool column',
      order: 1,
    };
    // hit the express route
    const resp = await request(app)
      .post(`/api/projects/${proj.id}/boards/${brd.id}/columns`)
      .set('Cookie', myCookie)
      .send(stuff);
    assert.strictEqual(resp.status, 201);
    assert.strictEqual(resp.body.title, 'cool column');

    // check if it actually saved in the db
    const colCheck = await prisma.column.findFirst({
      where: { boardId: brd.id, title: 'cool column' },
    });
    assert.ok(colCheck, 'db should have this column');
    assert.strictEqual(colCheck!.title, 'cool column');
    assert.strictEqual(colCheck!.order, 1);
  });

  test('makes a task inside a column and checks prisma db', async () => {
    // need a column to hold the task
    const col = await prisma.column.create({
      data: {
        title: 'task holder',
        order: 1,
        boardId: brd.id,
      },
    });

    const stuff = {
      title: 'new task bruh',
      description: 'just testing the api',
      columnId: col.id,
      order: 1,
    };
    //express route
    const resp = await request(app)
      .post(`/api/projects/${proj.id}/boards/${brd.id}/columns/${col.id}/tasks`)
      .set('Cookie', myCookie)
      .send(stuff);
    assert.strictEqual(resp.status, 201);
    assert.strictEqual(resp.body.title, 'new task bruh');
    //db checks
    const tskCheck = await prisma.task.findUnique({
      where: { id: resp.body.id },
      include: { assignee: true, reporter: true },
    });

    assert.ok(tskCheck, 'task must be stored in db');
    assert.strictEqual(tskCheck!.title, 'new task bruh');
    assert.strictEqual(tskCheck!.columnId, col.id);
    assert.strictEqual(tskCheck!.reporterId, usr.id);
  });

  test('can move a task fine (happy path)', async () => {
    // make two columns
    const colA = await prisma.column.create({
      data: { title: 'start', order: 1, boardId: brd.id },
    });
    const colB = await prisma.column.create({
      data: { title: 'end', order: 2, boardId: brd.id },
    });

    //fix transition for testing
    await prisma.workflowTransition.create({
      data: {
        projectId: proj.id,
        boardId: brd.id,
        fromColumnId: colA.id,
        toColumnId: colB.id,
      },
    });

    // put a task in colA
    const tsk = await prisma.task.create({
      data: {
        title: 'mover task',
        columnId: colA.id,
        order: 1,
        reporterId: usr.id,
      },
    });
    // try moving it
    const resp = await request(app)
      .patch(
        `/api/projects/${proj.id}/boards/${brd.id}/columns/${colA.id}/tasks/${tsk.id}/move`,
      )
      .set('Cookie', myCookie)
      .send({ targetColumnId: colB.id, newOrder: 1 });

    assert.strictEqual(resp.status, 200);

    //check if moved in db
    const finalTsk = await prisma.task.findUnique({ where: { id: tsk.id } });
    assert.strictEqual(finalTsk!.columnId, colB.id);
  });

  test('blocks movement if wip limit is full (sad path)', async () => {
    // colb has a limit of 1
    const colA = await prisma.column.create({
      data: { title: 'start wip', order: 1, boardId: brd.id },
    });
    const colB = await prisma.column.create({
      data: { title: 'end wip', order: 2, boardId: brd.id, wipLimit: 1 },
    });
    // fix transition for testing
    await prisma.workflowTransition.create({
      data: {
        projectId: proj.id,
        boardId: brd.id,
        fromColumnId: colA.id,
        toColumnId: colB.id,
      },
    });

    // fill col b up
    await prisma.task.create({
      data: {
        title: 'already here',
        columnId: colB.id,
        order: 1,
        reporterId: usr.id,
      },
    });
    const tsk = await prisma.task.create({
      data: {
        title: 'stuck task',
        columnId: colA.id,
        order: 1,
        reporterId: usr.id,
      },
    });

    // try to move it
    const resp = await request(app)
      .patch(
        `/api/projects/${proj.id}/boards/${brd.id}/columns/${colA.id}/tasks/${tsk.id}/move`,
      )
      .set('Cookie', myCookie)
      .send({ targetColumnId: colB.id, newOrder: 2 });
    assert.strictEqual(resp.status, 400);
    assert.match(resp.body.message || '', /wip limit/i);

    // check db to be sure it didnt move
    const dbTsk = await prisma.task.findUnique({ where: { id: tsk.id } });
    assert.strictEqual(dbTsk!.columnId, colA.id, 'it should stay in source');
  });

  test('blocks unauth requests (401)', async () => {
    const stuff = { title: 'hack hack', order: 1 };
    const resp = await request(app)
      .post(`/api/projects/${proj.id}/boards/${brd.id}/columns`)
      .send(stuff);

    assert.strictEqual(resp.status, 401);
  });

  test('runs complete crud functions on board', async () => {
    //make a board
    const mkResp = await request(app)
      .post(`/api/projects/${proj.id}/boards`)
      .set('Cookie', myCookie)
      .send({ title: 'crud brd', description: 'test test' });

    assert.strictEqual(mkResp.status, 201);
    const newBrdId = mkResp.body.id;
    assert.strictEqual(mkResp.body.title, 'crud brd');
    // get boards list
    const getResp = await request(app)
      .get(`/api/projects/${proj.id}/boards`)
      .set('Cookie', myCookie);
    assert.strictEqual(getResp.status, 200);
    const fnd = getResp.body.find((b: Board) => b.id === newBrdId);
    assert.ok(fnd, 'board is in the list');
    // update the board
    const updResp = await request(app)
      .put(`/api/projects/${proj.id}/boards/${newBrdId}`)
      .set('Cookie', myCookie)
      .send({ title: 'better crud brd' });
    assert.strictEqual(updResp.status, 200);
    assert.strictEqual(updResp.body.title, 'better crud brd');

    //delete the board
    const delResp = await request(app)
      .delete(`/api/projects/${proj.id}/boards/${newBrdId}`)
      .set('Cookie', myCookie);
    assert.ok(
      [200, 204].includes(delResp.status),
      `weird status: ${delResp.status}`,
    );
    //verify db delete
    const chk = await prisma.board.findUnique({ where: { id: newBrdId } });
    assert.strictEqual(
      chk,
      null,
      'db should be completely empty of this board',
    );
  });
});
