process.env.NODE_ENV = 'test';
process.env.PORT = 10002;

const app = require('../../app.js').getApp,
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  User = mongoose.main_conn.model('User'),
  jwt = require('jsonwebtoken'),
  config = require('../../config/config');

let tokenUsername;
let tokenEmail;
let idUser;
let idUserAux;
const tokenExpired = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNWI0ZjU1NjZlYjk0ZGU0NDVhNjc2ODZkIiwianRpIjoiMTY1YmI4NjgtNzlhZS00ZThlLTg2M2UtZjg4YWJiZDllMmQ3IiwiaWF0IjoxNTMyMDEwMDE2LCJleHAiOjE1MzIwOTY0MTZ9.Jm5ahlxk5WoieEg63qaLkf6AkRBMUKMWKH9SUF8d-po';

describe('Users & authentication', () => {
  jest.setTimeout(30000);
  
  beforeAll(() => User.remove().exec());

  test('User added', done => {
    supertest(app)
      .post('/user')
      .send({ 'email.addr': 'myemail@mail.com', username: 'myuser', password: 'mypassword', 'name.first': 'First', 'name.last': 'Last' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(201);
        expect(res.body._id).toBeDefined();
        idUser = res.body._id;
        return done();
      });
  });

  test('User aux added', done => {
    supertest(app)
      .post('/user')
      .send({ 'email.addr': 'def@def.com', username: 'madcarpone', password: 'mypassword', 'name.first': 'John', 'name.last': 'Smith' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(201);
        expect(res.body._id).toBeDefined();
        idUserAux = res.body._id;
        return done();
      });
  });

  test('login using email', done => {
    supertest(app)
      .post('/login')
      .send({ email: 'myemail@mail.com', password: 'mypassword' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
        tokenEmail = res.body.token;
        return done();
      });
  });

  test('login using username', done => {
    supertest(app)
      .post('/login')
      .send({ username: 'myuser', password: 'mypassword' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
        tokenUsername = res.body.token;
        return done();
      });
  });

  test('login check token', done => {
    supertest(app)
      .get('/login')
      .set('Authorization', `Bearer ${tokenUsername}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        return done();
      });
  });

  test('login check invalid token', done => {
    supertest(app)
      .get('/login')
      .set('Authorization', 'Bearer invalidtoken')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('login check token expired', done => {
    supertest(app)
      .get('/login')
      .set('Authorization', `Bearer ${tokenExpired}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('User dont exist', done => {
    supertest(app)
      .get('/user/inexistentuser')
      .set('Authorization', `Bearer ${tokenUsername}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(404);
        return done();
      });
  });

  test('User. Already registered', done => {
    supertest(app)
      .post('/user')
      .send({ 'email.addr': 'myemail@mail.com', username: 'myuser', password: 'mypassword', 'name.first': 'First', 'name.last': 'Last' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('User. get data', done => {
    supertest(app)
      .get(`/user/${idUser}`)
      .set('Authorization', `Bearer ${tokenUsername}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBeDefined();
        expect(res.body._id).toEqual(idUser);
        expect(res.body.createdAt).toBeDefined();
        return done();
      });
  });

  test('User. get data other user', done => {
    supertest(app)
      .get(`/user/${idUserAux}`)
      .set('Authorization', `Bearer ${tokenUsername}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBeDefined();
        expect(res.body._id).toEqual(idUserAux);
        expect(res.body.createdAt).toBeUndefined();
        return done();
      });
  });

  test('User. update data', done => {
    supertest(app)
      .post(`/user/${idUser}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ 'name.first': 'Carla' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body.name.first).toBe('Carla');
        return done();
      });
  });

  test('User. update wrong user data', done => {
    supertest(app)
      .post(`/user/${idUserAux}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ 'name.first': 'Carla' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('User. update with no token', done => {
    supertest(app)
      .post(`/user/${idUserAux}`)
      .send({ 'name.first': 'Carla' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('User. Updating data with email already exists', done => {
    supertest(app)
      .post(`/user/${idUser}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ 'email.addr': 'def@def.com' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(400);
        return done();
      });
  });

  test('User. get user data with malformed token', done => {
    supertest(app)
      .get('/user')
      .set('Authorization', 'Bearer token')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('User. get user data with token expired', done => {
    supertest(app)
      .get('/user')
      .set('Authorization', `Bearer ${tokenExpired}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('logout user', done => {
    supertest(app)
      .post('/logout')
      .set('Authorization', `Bearer ${tokenUsername}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        return done();
      });
  });

  test('login. check token logged out', done => {
    supertest(app)
      .get('/login')
      .set('Authorization', `Bearer ${tokenUsername}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  let codeRetrievePwd;

  test('user. retrieve password get code', done => {
    supertest(app)
      .post('/user/retrievePasswordGetCode')
      .send({ email: 'def@def.com' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body.code).toBeDefined();
        codeRetrievePwd = res.body.code;
        return done();
      });
  });

  test('user. retrieve password get code email does not exists', done => {
    supertest(app)
      .post('/user/retrievePasswordGetCode')
      .send({ email: '123@123.com' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(404);
        return done();
      });
  });

  test('user. retrieve password. missing password', done => {
    supertest(app)
      .post('/user/retrievePassword')
      .send({ email: 'def@def.com', code: '12345678' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(400);
        expect(res.body.missingFields).toContain('password');
        return done();
      });
  });

  test('user. retrieve password. missing fields', done => {
    supertest(app)
      .post('/user/retrievePassword')
      .send({ })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(400);
        expect(res.body.missingFields).toContain('email');
        expect(res.body.missingFields).toContain('password');
        expect(res.body.missingFields).toContain('code');
        return done();
      });
  });

  test('user. retrieve password. email does not exists', done => {
    supertest(app)
      .post('/user/retrievePassword')
      .send({ email: '123@123.com', password: '12345678', code: codeRetrievePwd })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(404);
        return done();
      });
  });

  test('user. retrieve password', done => {
    supertest(app)
      .post('/user/retrievePassword')
      .send({ email: 'def@def.com', password: '12345678', code: codeRetrievePwd })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        return done();
      });
  });

  test('user. re-send email for validating email. Field email empty', done => {
    supertest(app)
      .post('/emailValidateProfile')
      .send({})
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(400);
        return done();
      });
  });

  test('user. re-send email for validating email. wrong email', done => {
    supertest(app)
      .post('/emailValidateProfile')
      .send({ email: '123@123.com.com' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(404);
        return done();
      });
  });

  test('user. re-send email for validating email', done => {
    supertest(app)
      .post('/emailValidateProfile')
      .send({ email: 'def@def.com' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        return done();
      });
  });

  test('user. validate email. No token set', done => {
    supertest(app)
      .get('/verifyProfile')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(400);
        return done();
      });
  });

  test('user. validate email. Token invalid', done => {
    supertest(app)
      .get('/verifyProfile?token=invalidtoken')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(401);
        return done();
      });
  });

  test('user. validate email. Token expired', done => {
    supertest(app)
      .get(`/verifyProfile?token=${tokenExpired}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(401);
        return done();
      });
  });

  test('user. validate email', done => {
    const token = jwt.sign({ user: idUserAux }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    supertest(app)
      .get(`/verifyProfile?token=${token}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        return done();
      });
  });
});
