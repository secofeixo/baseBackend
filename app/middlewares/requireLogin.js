const config = require('../../config/config'),
  jwt = require('jsonwebtoken'),
  redis = require('../../config/redis'),
  logger = require('../controllers/log.controller.js');

async function validTokenInternal(token) {
  let bValidToken = false;
  if (await redis.hasToken(token)) {
    return { validToken: bValidToken };
  }
  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
    bValidToken = true;
  } catch (err) {
    logger.error(`requireLogin. validTokenInternal. Error verifying token ${JSON.stringify(err)}`);
    bValidToken = false;
  }

  return { validToken: bValidToken, payload };
}

async function validToken(req, res, next) {
  if (!req.token) {
    res.status(403).json({ msg: 'Token not set' });
    return;
  }

  const result = await validTokenInternal(req.token);
  if (!result.validToken) {
    res.status(403).json({ msg: 'Invalid token' });
  }

  req.session = {
    user: { _id: result.payload.user },
  };
  next();
}

async function policyUser(req, res, next) {
  let bPostMethod = false;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (req.params.id === undefined) { // alowing adding new users
      next();
      return;
    }
    bPostMethod = true;
  }

  if (!req.token) {
    res.status(403).json({ msg: 'Token not set' });
    return;
  }
  const result = await validTokenInternal(req.token);
  logger.debug(`requireLogin. policyUser. tokenInternal ${JSON.stringify(result)}`);
  if (!result.validToken) {
    res.status(403).json({ msg: 'Invalid token' });
    return;
  }

  req.session = {
    user: { _id: result.payload.user },
  };

  if (!bPostMethod) {
    next();
    return;
  }

  if (result.payload.user !== req.params.id) {
    res.status(403).json({ msg: 'Not enough privileges' });
    return;
  }
  next();
}

module.exports = {
  validToken,
  policyUser,
};
