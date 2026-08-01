import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { errorMiddleware } from '../src/middleware/errorMiddleware.js';
import { AppError } from '../types/appError.js';

type mockRequest = Record<string, unknown>;
type mockResponse = {
  statusCode: number | null;
  jsonPayload: unknown;
  status: (code: number) => mockResponse;
  json: (payload: unknown) => mockResponse;
};

const createReq = (): mockRequest => ({});
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

test('errorMiddleware - handles AppError correctly', async () => {
  mock.method(console, 'error', () => {}); //Stopping console.error so no ouput
  const customError = new AppError('Custom missing item', 404);
  const req = createReq();
  const res = createRes();
  const { next } = createNext();
  await errorMiddleware(customError, req as never, res as never, next as never);
  assert.equal(res.statusCode, 404);
  assert.equal(
    (res.jsonPayload as { message: string }).message,
    'Custom missing item',
  );
});
test('errorMiddleware - handles generic unknown errors as 500', async () => {
  mock.method(console, 'error', () => {});
  const genericError = new Error('Database disconnected completely');
  const req = createReq();
  const res = createRes();
  const { next } = createNext();
  await errorMiddleware(
    genericError,
    req as never,
    res as never,
    next as never,
  );
  assert.equal(res.statusCode, 500);
  assert.equal(
    (res.jsonPayload as { message: string }).message,
    'Internal Server Error',
  );
});
