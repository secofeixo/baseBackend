const config = require('../../config/config'),
  jwt = require('jsonwebtoken'),
  uuid = require('uuid/v4'),
  redis = require('../../config/redis'),
  logger = require('../controllers/log.controller.js');

function generateToken(userId) {
  const payload = {
    user: userId,
    jti: uuid(),
  };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  return token;
}

function getKeyOfToken(payloadToken) {
  let key;
  if (payloadToken) {
    key = `token:${payloadToken.user}:${payloadToken.jti}`;
  }
  return key;
}

function invalidateToken(token) {
  let bReturn;
  logger.info(`token.controller. invalidateToken ${token}`);
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    logger.debug(`token.controller. invalidateToken. payload ${JSON.stringify(payload)}`);
    const keyToken = getKeyOfToken(payload);
    redis.addToken(keyToken);
    logger.debug('token.controller. logout token. add token to blacklist');
    bReturn = true;
  } catch (err) {
    bReturn = false;
  }

  return bReturn;
}

async function validToken(token) {
  let bValidToken = false;
  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
    bValidToken = true;
  } catch (err) {
    logger.error(`requireLogin. validTokenInternal. Error verifying token ${JSON.stringify(err)}`);
    bValidToken = false;
  }

  if (!bValidToken) {
    return { validToken: bValidToken };
  }

  const keyToken = getKeyOfToken(payload);
  if (keyToken) {
    if (await redis.hasToken(keyToken)) {
      return { validToken: false };
    }
  }

  return { validToken: bValidToken, payload };
}

module.exports = {
  generateToken,
  invalidateToken,
  validToken,
  getKeyOfToken,
};
