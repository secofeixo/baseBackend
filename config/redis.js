const Redis = require('redis'),
  util = require('util'),
  config = require('./config'),
  logger = require('../app/controllers/log.controller.js');

const client = Redis.createClient(config.redis.url);
client.hget = util.promisify(client.hget);
client.get = util.promisify(client.get);

function addToken(token) {
  client.set(`${token}`, '1', 'EX', config.jwt.expiresIn);
}

async function hasToken(token) {
  const exists = await client.get(token);
  logger.debug(`redis. hasToken. ${JSON.stringify(exists)}`);
  return (exists !== null);
}

function close() {
  client.quit();
}

module.exports = {
  client,
  addToken,
  hasToken,
  close,
};
