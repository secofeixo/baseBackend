process.env.NODE_ENV = 'test';
process.env.PORT = 10003;

const app = require('../../app.js').getApp,
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  User = mongoose.main_conn.model('User'),
  Widget = mongoose.main_conn.model('Widgets'),
  Screen = mongoose.main_conn.model('Screens'),
  _ = require('lodash');

let tokenEmail;
let idScreen;
let idScreenAux;
const tokenExpired = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNWI0ZjU1NjZlYjk0ZGU0NDVhNjc2ODZkIiwianRpIjoiMTY1YmI4NjgtNzlhZS00ZThlLTg2M2UtZjg4YWJiZDllMmQ3IiwiaWF0IjoxNTMyMDEwMDE2LCJleHAiOjE1MzIwOTY0MTZ9.Jm5ahlxk5WoieEg63qaLkf6AkRBMUKMWKH9SUF8d-po';
const widgets = [];

describe('Screens', () => {
  jest.setTimeout(30000);

  beforeAll(async done => {
    await User.remove({ username: 'usertestscreen' }).exec();
    const newUser = User({
      'email.addr': 'emailuserscreen@mail.com',
      username: 'usertestscreen',
      password: 'mypassword',
      'name.first': 'First',
      'name.last': 'Last',
    });
    await newUser.save();
    await Widget.remove({ name: 'widgetTestScreen1' }).exec();
    await Widget.remove({ name: 'widgetTestScreen2' }).exec();
    const widget1 = Widget({
      name: 'widgetTestScreen1',
    });
    let data = await widget1.save();
    widgets.push({ id: _.toString(data._id), pos: { x: 1, y: 1 }, size: { height: 500, width: 100 } });
    const widget2 = Widget({
      name: 'widgetTestScreen2',
    });
    data = await widget2.save();
    widgets.push({ id: _.toString(data._id), pos: { x: 23, y: 45 }, size: { height: 250, width: 500 } });
    await Screen.remove({ name: 'screen1' }).exec();
    await Screen.remove({ name: 'screen11' }).exec();
    await Screen.remove({ name: 'screen2' }).exec();

    supertest(app)
      .post('/login')
      .send({ email: 'emailuserscreen@mail.com', password: 'mypassword' })
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
      .post('/screens')
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ name: 'screen1', widgets })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(201);
        expect(res.body._id).toBeDefined();
        idScreen = res.body._id;
        return done();
      });
  });

  test('aux added', done => {
    supertest(app)
      .post('/screens')
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ name: 'screen2' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(201);
        expect(res.body._id).toBeDefined();
        idScreenAux = res.body._id;
        return done();
      });
  });

  test('get data', done => {
    supertest(app)
      .get(`/screens/${idScreen}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBeDefined();
        expect(res.body._id).toEqual(idScreen);
        expect(res.body.createdAt).toBeDefined();
        return done();
      });
  });

  test('get data populate widgets', done => {
    supertest(app)
      .get(`/screens/${idScreen}?populate={"path":"widgets.id"}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBeDefined();
        expect(res.body._id).toEqual(idScreen);
        expect(res.body.createdAt).toBeDefined();
        expect(Array.isArray(res.body.widgets)).toBeTruthy();
        if (res.body.widgets.length > 0) {
          const widget = res.body.widgets[0];
          expect(widget.id._id).toBeDefined();
        }
        expect(Array.isArray(res.body.widgets)).toBeTruthy();
        return done();
      });
  });

  test('get data other screen', done => {
    supertest(app)
      .get(`/screens/${idScreenAux}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBeDefined();
        expect(res.body._id).toEqual(idScreenAux);
        expect(res.body.createdAt).toBeDefined();
        return done();
      });
  });

  test('get data all screens', done => {
    supertest(app)
      .get('/screens')
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
      .post(`/screens/${idScreen}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ name: 'screen11' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('screen11');
        return done();
      });
  });

  test('update with no token', done => {
    supertest(app)
      .post(`/screens/${idScreenAux}`)
      .send({ name: 'screen1' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('get user data with malformed token', done => {
    supertest(app)
      .get('/screens')
      .set('Authorization', 'Bearer token')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('get user data with token expired', done => {
    supertest(app)
      .get('/screens')
      .set('Authorization', `Bearer ${tokenExpired}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test.skip('remove screen', done => {
    supertest(app)
      .del(`/screens/${idScreen}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(204);
        return done();
      });
  });
});
