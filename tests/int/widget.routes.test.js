process.env.NODE_ENV = 'test';
process.env.PORT = 10001;

const app = require('../../app.js').getApp,
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  Widget = mongoose.main_conn.model('Widgets'),
  User = mongoose.main_conn.model('User');

let tokenEmail;
let idWidget;
let idWidgetAux;
const tokenExpired = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNWI0ZjU1NjZlYjk0ZGU0NDVhNjc2ODZkIiwianRpIjoiMTY1YmI4NjgtNzlhZS00ZThlLTg2M2UtZjg4YWJiZDllMmQ3IiwiaWF0IjoxNTMyMDEwMDE2LCJleHAiOjE1MzIwOTY0MTZ9.Jm5ahlxk5WoieEg63qaLkf6AkRBMUKMWKH9SUF8d-po';

describe('Widgets', () => {
  jest.setTimeout(30000);
  
  beforeAll(async done => {
    const newUser = User({
      'email.addr': 'emailuserwidget@mail.com',
      username: 'usertestwidget',
      password: 'mypassword',
      'name.first': 'First',
      'name.last': 'Last',
    });
    await newUser.save();
    await Widget.remove().exec();
    supertest(app)
      .post('/login')
      .send({ email: 'emailuserwidget@mail.com', password: 'mypassword' })
      .end((err, res) => {
        if (err) return done(err);
        tokenEmail = res.body.token;
        return done();
      });
  });
  afterAll(() => {
    require('../../app.js').close();
  });

  test('added', done => {
    supertest(app)
      .post('/widgets')
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ name: 'widget1' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(201);
        expect(res.body._id).toBeDefined();
        idWidget = res.body._id;
        return done();
      });
  });

  test('aux added', done => {
    supertest(app)
      .post('/widgets')
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ name: 'widget2' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(201);
        expect(res.body._id).toBeDefined();
        idWidgetAux = res.body._id;
        return done();
      });
  });

  test('get data', done => {
    supertest(app)
      .get(`/widgets/${idWidget}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBeDefined();
        expect(res.body._id).toEqual(idWidget);
        expect(res.body.createdAt).toBeDefined();
        return done();
      });
  });

  test('get data other widget', done => {
    supertest(app)
      .get(`/widgets/${idWidgetAux}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBeDefined();
        expect(res.body._id).toEqual(idWidgetAux);
        expect(res.body.createdAt).toBeDefined();
        return done();
      });
  });

  test('get data all widgets', done => {
    supertest(app)
      .get('/widgets')
      .set('Authorization', `Bearer ${tokenEmail}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        return done();
      });
  });

  test('update data', done => {
    supertest(app)
      .post(`/widgets/${idWidget}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ name: 'WIDGET11' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('widget11');
        return done();
      });
  });

  test('update with no token', done => {
    supertest(app)
      .post(`/widgets/${idWidgetAux}`)
      .send({ name: 'WIDGET1' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('get user data with malformed token', done => {
    supertest(app)
      .get('/widgets')
      .set('Authorization', 'Bearer token')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('get user data with token expired', done => {
    supertest(app)
      .get('/widgets')
      .set('Authorization', `Bearer ${tokenExpired}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });
});
