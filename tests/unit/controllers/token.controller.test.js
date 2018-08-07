process.env.NODE_ENV = 'test';

const ctrlToken = require('../../../app/controllers/token.controller');
const redis = require('../../../config/redis');

let tokenTest;

describe('Testing token functions', () => {
  jest.setTimeout(30000);
  test('generatetoken', async () => {
    tokenTest = ctrlToken.generateToken('userId');
    const bValid = await ctrlToken.validToken(tokenTest);
    expect(bValid.validToken).toBeTruthy();
    expect(bValid.payload).toBeDefined();
  });

  test('validate token blank', async () => {
    const bValid = await ctrlToken.validToken('');
    expect(bValid.validToken).toBeFalsy();
    expect(bValid.payload).toBeUndefined();
  });

  test('validate token error', async () => {
    const bValid = await ctrlToken.validToken('testtoken');
    expect(bValid.validToken).toBeFalsy();
    expect(bValid.payload).toBeUndefined();
  });

  test('validate token expired', async () => {
    const bValid = await ctrlToken.validToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNWI0ZjU1NjZlYjk0ZGU0NDVhNjc2ODZkIiwianRpIjoiMTY1YmI4NjgtNzlhZS00ZThlLTg2M2UtZjg4YWJiZDllMmQ3IiwiaWF0IjoxNTMyMDEwMDE2LCJleHAiOjE1MzIwOTY0MTZ9.Jm5ahlxk5WoieEg63qaLkf6AkRBMUKMWKH9SUF8d-po');
    expect(bValid.validToken).toBeFalsy();
    expect(bValid.payload).toBeUndefined();
  });

  test('invalidate token', () => {
    const bInvalidated = ctrlToken.invalidateToken(tokenTest);
    expect(bInvalidated).toBeTruthy();
  });

  test('re invalidate token', () => {
    const bInvalidated = ctrlToken.invalidateToken(tokenTest);
    expect(bInvalidated).toBeTruthy();
  });

  test('invalidate token blank', () => {
    const bInvalidated = ctrlToken.invalidateToken('');
    expect(bInvalidated).toBeFalsy();
  });

  test('invalidate token error', () => {
    const bInvalidated = ctrlToken.invalidateToken('token.test.signature');
    expect(bInvalidated).toBeFalsy();
  });

  test('validate token invalidated', async () => {
    const bValid = await ctrlToken.validToken(tokenTest);
    expect(bValid.validToken).toBeFalsy();
    expect(bValid.payload).toBeUndefined();
  });

  afterAll(() => {
    redis.close();
  });
});
