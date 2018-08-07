process.env.NODE_ENV = 'test';
const mockRes = require('jest-mock-express').response;
const ctrlEmail = require('../../../app/controllers/email.controller');

// const app = require('../app.js').getApp;

describe('Testing email', () => {
  jest.setTimeout(30000);

  test('Sending validate email', async () => {
    const user = {
      email: {
        addr: 'def@def.com',
      },
    };
    const fakeRes = mockRes();
    await ctrlEmail.sendEmailValidateEmail(user, 'tokentovalidateuser', fakeRes);
    expect(fakeRes.status).toHaveBeenCalledWith(200);
    expect(fakeRes.json).toHaveBeenCalled();
  });
  test('sending welcome email', async () => {
    const user = {
      email: {
        addr: 'def@def.com',
      },
      getName() {
        return 'Full name';
      },
    };
    const fakeRes = mockRes();
    await ctrlEmail.sendEmailWelcomeUser(user, fakeRes);
    expect(fakeRes.status).toHaveBeenCalledWith(200);
    expect(fakeRes.json).toHaveBeenCalled();
  });
  test('sending retrieve password code', async () => {
    const fakeRes = mockRes();
    await ctrlEmail.sendEmailRetrievePasswordCode('def@def.com', 'Code', fakeRes);
    expect(fakeRes.status).toHaveBeenCalledWith(200);
    expect(fakeRes.json).toHaveBeenCalled();
  });
});
