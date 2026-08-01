import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'events';
import fs from 'fs';
import { uploadAvatar } from '../src/middleware/uploadAvatar.js';

type mockResponse = {
  statusCode: number | null;
  jsonPayload: unknown;
  status: (code: number) => mockResponse;
  json: (payload: unknown) => mockResponse;
};
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

class MockStreamReq extends EventEmitter {
  headers: Record<string, string> = {};
  file?: unknown;
}

test('uploadAvatar - skips if not multipart form data', async () => {
  const middleware = uploadAvatar.single('avatar');
  const req = new MockStreamReq();
  req.headers['content-type'] = 'application/json';
  const res = createRes();
  const { next, calls } = createNext();
  await middleware(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], undefined);
});
test('uploadAvatar - fails if missing boundary', async () => {
  const middleware = uploadAvatar.single('avatar');
  const req = new MockStreamReq();
  req.headers['content-type'] = 'multipart/form-data; charset=utf-8';
  const res = createRes();
  const { next } = createNext();
  await middleware(req as never, res as never, next as never);
  assert.equal(res.statusCode, 400);
  assert.equal(
    (res.jsonPayload as { error: string }).error,
    'Invalid Content-Type header',
  );
});
test('uploadAvatar - successfully parses file stream and attaches to req', async () => {
  mock.method(fs, 'mkdirSync', () => {});
  mock.method(fs, 'writeFileSync', () => {});
  const middleware = uploadAvatar.single('avatar');
  const req = new MockStreamReq();
  req.headers['content-type'] = 'multipart/form-data; boundary=fakeboundary';
  const res = createRes();
  const { next, calls } = createNext();
  const middlewarePromise = middleware(
    req as never,
    res as never,
    next as never,
  );
  const payload = Buffer.from(
    '--fakeboundary\r\n' +
      'Content-Disposition: form-data; name="avatar"; filename="profile.jpg"\r\n' +
      'Content-Type: image/jpeg\r\n\r\n' +
      'fake-image-bytes-here\r\n' +
      '--fakeboundary--',
  );
  req.emit('data', payload);
  req.emit('end');
  await middlewarePromise;
  assert.equal(calls.length, 1);
  assert.ok(req.file);
  const fileData = req.file as { originalname: string; mimetype: string };
  assert.equal(fileData.originalname, 'profile.jpg');
  assert.equal(fileData.mimetype, 'image/jpeg');
});
