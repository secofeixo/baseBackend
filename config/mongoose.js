const config = require('./config'),
  mongoose = require('mongoose');
const logger = require('../app/controllers/log.controller.js');

// Create mongodb connection
mongoose.Promise = global.Promise;

logger.info(`Connecting to ${config.db.replace(/\/\/([^:]+):(.*)@/, '//$1:***@')}`);
if (config.dboptions) {
  mongoose.main_conn = mongoose.createConnection(config.db, config.dboptions);
} else {
  mongoose.main_conn = mongoose.createConnection(config.db);
  // mongoose.main_conn = mongoose.createConnection(config.db, { useMongoClient: true });
}

logger.info('Create mongo connection');

mongoose.main_conn.on('error', err => {
  if (err) {
    logger.error(`mongoose.js. Error main_con ${JSON.stringify(err)}`);
    throw new Error('Could not connect with MongoDB database. goldenspear');
  }
});

module.exports = mongoose;
