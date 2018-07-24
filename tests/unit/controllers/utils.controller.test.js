process.env.NODE_ENV = 'test';

const ctrlUtils = require('../../../app/controllers/utils.controller');

describe('testing utils controller', () => {
  describe('Testing missing body fields', () => {
    test('testing no missing fields nor required fields', () => {
      const req = { body: { } };
      expect(ctrlUtils.missingBodyFields(req).length).toBe(0);
    });

    test('testing 1 missing a field', () => {
      const req = { body: { } };
      expect(ctrlUtils.missingBodyFields(req, 'user').length).toBe(1);
      expect(ctrlUtils.missingBodyFields(req, 'user')[0]).toBe('user');
    });

    test('testing 2 missing fields', () => {
      const req = { body: { email: 'testemail@mail.com' } };
      expect(ctrlUtils.missingBodyFields(req, 'user', 'password').length).toBe(2);
      expect(ctrlUtils.missingBodyFields(req, 'user', 'password')).toEqual(['user', 'password']);
    });

    test('testing with existent fields', () => {
      const req = { body: { user: 'John', img: '2.jpg', email: 'john2@mymail.com' } };
      expect(ctrlUtils.missingBodyFields(req, 'user', 'img').length).toBe(0);
    });
  });

  describe('Testing missing query fields', () => {
    test('testing no missing fields nor required fields', () => {
      const req = { query: { } };
      expect(ctrlUtils.missingQueryFields(req).length).toBe(0);
    });

    test('testing 1 missing a field', () => {
      const req = { query: { } };
      expect(ctrlUtils.missingQueryFields(req, 'user').length).toBe(1);
      expect(ctrlUtils.missingQueryFields(req, 'user')[0]).toBe('user');
    });

    test('testing 2 missing fields', () => {
      const req = { query: { email: 'testemail@mail.com' } };
      expect(ctrlUtils.missingQueryFields(req, 'user', 'password').length).toBe(2);
      expect(ctrlUtils.missingQueryFields(req, 'user', 'password')).toEqual(['user', 'password']);
    });

    test('testing with existent fields', () => {
      const req = { query: { user: 'John', img: '2.jpg', email: 'john2@mymail.com' } };
      expect(ctrlUtils.missingQueryFields(req, 'user', 'img').length).toBe(0);
    });
  });

  describe('formating date', () => {
    test('get format date', () => {
      const timeStamp = ctrlUtils.getTimeStamp();
      expect(timeStamp.length).toBe(14);
    });
  });

  describe('unset fields', () => {
    test('unset body field', done => {
      const req = { body: { field1: 'test', field2: 'unset' } };
      ctrlUtils.unsetBodyFields(req, null, () => {
        expect(req.body.field1).toBeDefined();
        expect(req.body.field2).toBeUndefined();
        done();
      });
    });
  });
});
