const usersCtrl = require('../controllers/user.controller.js');

module.exports = app => {
  app.route('/user/retrievePasswordGetCode').post(usersCtrl.retrievePasswordGetCode);
  app.route('/user/retrievePassword').post(usersCtrl.retrievePassword);
  app.route('/verifyProfile').get(usersCtrl.verifyProfile);
  app.route('/emailValidateProfile').post(usersCtrl.sendEmailValidateEmail);
};
