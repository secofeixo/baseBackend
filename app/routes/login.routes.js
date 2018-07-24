const loginCtrl = require('../controllers/login/login.controller.js');

module.exports = app => {
  app.route('/login')
    .get(loginCtrl.validToken)
    .post(loginCtrl.login);
  app.route('/logout').post(loginCtrl.logout);
};
