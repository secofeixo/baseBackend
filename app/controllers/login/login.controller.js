const mongoose = require('mongoose'),
  bcrypt = require('bcrypt'),
  utils = require('../utils.controller'),
  User = mongoose.main_conn.model('User'),
  logger = require('../log.controller.js'),
  _ = require('lodash'),
  ctrlToken = require('../token.controller');

async function login(req, res) {
  logger.info('login.controller.js - Login');
  function wrongCredentials() {
    return res.status(403).send({ msg: 'Wrong credentials' });
  }
  const missingFieldsUsername = utils.missingBodyFields(req, 'username', 'password');
  const missingFieldsEmail = utils.missingBodyFields(req, 'email', 'password');
  const allMissingFields = _.union(missingFieldsUsername, missingFieldsEmail);
  if ((missingFieldsUsername.length > 0) && (missingFieldsEmail.length > 0)) {
    return utils.badQuery(res, allMissingFields);
  }
  const queryUser = {};
  if (missingFieldsUsername.length === 0) {
    queryUser.username = req.body.username;
  } else if (missingFieldsEmail.length === 0) {
    queryUser['email.addr'] = req.body.email;
  }
  let user;
  try {
    user = await User.findOne(queryUser).exec();
  } catch (err) {
    return utils.internalError(err, res);
  }

  if (!user) {
    if (missingFieldsUsername.length === 0) {
      logger.debug(`login.controller.js - login - User NOT found by username ${req.body.username}`);
    } else if (missingFieldsEmail.length === 0) {
      logger.debug(`login.controller.js - login - User NOT found by email ${req.body.email}`);
    }
    return wrongCredentials();
  }

  logger.debug('login.controller.js - Login - User found by username');
  if (!bcrypt.compare(req.body.password, user.password)) {
    return wrongCredentials();
  }

  const token = ctrlToken.generateToken(user._id);
  return res.status(200).json({ token, user });
}

function logout(req, res) {
  if (req.token) {
    logger.info(`login.controller. logout token ${req.token}`);
    if (ctrlToken.invalidateToken(req.token)) {
      res.status(200).json({ msg: 'User logged out' });
    } else {
      res.status(403).json({ msg: 'Invalid token' });
    }
  } else {
    res.status(400).json({ msg: 'Token blank' });
  }
}

async function validToken(req, res) {
  if (req.token) {
    logger.info(`login.controller. validToken ${req.token}`);
    const bValidToken = await ctrlToken.validToken(req.token);
    logger.debug(`login.controller. bValidToken ${JSON.stringify(bValidToken)}`);
    if (bValidToken.validToken) {
      res.status(200).json({ msg: 'Valid token' });
    } else {
      res.status(403).json({ msg: 'Invalid token' });
    }
  } else {
    res.status(400).json({ msg: 'Token blank' });
  }
}

module.exports = {
  login,
  logout,
  validToken,
};
