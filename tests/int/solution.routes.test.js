process.env.NODE_ENV = 'test';
process.env.PORT = 10004;

const app = require('../../app.js').getApp,
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  User = mongoose.main_conn.model('User'),
  Widget = mongoose.main_conn.model('Widgets'),
  Screen = mongoose.main_conn.model('Screens'),
  Solution = mongoose.main_conn.model('Solutions'),
  _ = require('lodash');

let tokenEmail;
let idSolution;
let idSolutionAux;
const tokenExpired = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNWI0ZjU1NjZlYjk0ZGU0NDVhNjc2ODZkIiwianRpIjoiMTY1YmI4NjgtNzlhZS00ZThlLTg2M2UtZjg4YWJiZDllMmQ3IiwiaWF0IjoxNTMyMDEwMDE2LCJleHAiOjE1MzIwOTY0MTZ9.Jm5ahlxk5WoieEg63qaLkf6AkRBMUKMWKH9SUF8d-po';
const widgets = [];
const screens = [];

describe('Solutions', () => {
  jest.setTimeout(30000);

  beforeAll(async done => {
    await User.remove({ username: 'usertestsolution' }).exec();
    const newUser = User({
      'email.addr': 'emailusersolution@mail.com',
      username: 'usertestsolution',
      password: 'mypassword',
      'name.first': 'First',
      'name.last': 'Last',
    });
    await newUser.save();
    await Widget.remove({ name: 'widgetTestSolution1' }).exec();
    await Widget.remove({ name: 'widgetTestSolution2' }).exec();
    const widget1 = Widget({
      name: 'widgetTestSolution1',
    });
    let data = await widget1.save();
    widgets.push({ id: _.toString(data._id), pos: { x: 1, y: 1 }, size: { height: 500, width: 100 } });
    const widget2 = Widget({
      name: 'widgetTestSolution2',
    });
    data = await widget2.save();
    widgets.push({ id: _.toString(data._id), pos: { x: 23, y: 45 }, size: { height: 250, width: 500 } });
    await Screen.remove({ name: 'screenTestSolution1' }).exec();
    await Screen.remove({ name: 'screenTestSolution2' }).exec();
    const screen1 = Screen({
      name: 'screenTestSolution1',
      widgets,
    });
    data = await screen1.save();
    screens.push(_.toString(data._id));
    const screen2 = Screen({
      name: 'screenTestSolution2',
    });
    data = await screen2.save();
    screens.push(_.toString(data._id));

    await Solution.remove({ name: 'solution1' }).exec();
    await Solution.remove({ name: 'solution11' }).exec();
    await Solution.remove({ name: 'solution2' }).exec();

    supertest(app)
      .post('/login')
      .send({ email: 'emailusersolution@mail.com', password: 'mypassword' })
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
      .post('/solutions')
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ name: 'solution1', screens: [screens[0]] })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(201);
        expect(res.body._id).toBeDefined();
        idSolution = res.body._id;
        return done();
      });
  });

  test('aux added', done => {
    supertest(app)
      .post('/solutions')
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ name: 'solution2', screens })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(201);
        expect(res.body._id).toBeDefined();
        idSolutionAux = res.body._id;
        return done();
      });
  });

  test('get data', done => {
    supertest(app)
      .get(`/solutions/${idSolution}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBeDefined();
        expect(res.body._id).toEqual(idSolution);
        expect(res.body.createdAt).toBeDefined();
        return done();
      });
  });

  test('get data populate screens', done => {
    supertest(app)
      .get(`/solutions/${idSolution}?populate={"path":"screens"}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBeDefined();
        expect(res.body._id).toEqual(idSolution);
        expect(res.body.screens).toBeDefined();
        expect(res.body.createdAt).toBeDefined();
        expect(Array.isArray(res.body.screens)).toBeTruthy();
        if (res.body.screens.length > 0) {
          const screen = res.body.screens[0];
          expect(screen._id).toBeDefined();
        }
        return done();
      });
  });

  test('get data other solution', done => {
    supertest(app)
      .get(`/solutions/${idSolutionAux}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBeDefined();
        expect(res.body._id).toEqual(idSolutionAux);
        expect(res.body.createdAt).toBeDefined();
        return done();
      });
  });

  test('get data all solutions', done => {
    supertest(app)
      .get('/solutions')
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
      .post(`/solutions/${idSolution}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .send({ name: 'solution11' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('solution11');
        return done();
      });
  });

  test('update with no token', done => {
    supertest(app)
      .post(`/solutions/${idSolutionAux}`)
      .send({ name: 'solution1' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('get user data with malformed token', done => {
    supertest(app)
      .get('/solutions')
      .set('Authorization', 'Bearer token')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('get user data with token expired', done => {
    supertest(app)
      .get('/solutions')
      .set('Authorization', `Bearer ${tokenExpired}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(403);
        return done();
      });
  });

  test('remove solution', done => {
    supertest(app)
      .del(`/screens/${idSolution}`)
      .set('Authorization', `Bearer ${tokenEmail}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).toBe(204);
        return done();
      });
  });
});
