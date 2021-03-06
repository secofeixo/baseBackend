

const config = require('./config/config'),
  mongoose = require('./config/mongoose');

const client = require('./config/redis');

const app = require('./config/express')();
const logger = require('./app/controllers/log.controller.js');

// Set up port
app.set('port', config.port);

process.on('SIGINT', () => {
  client.close();
  mongoose.main_conn.close(() => {
    logger.error('Connection with MongoDB database is closed.');
    process.exit(0);
  });
});

app.listen(config.port);
logger.info(`Goldenspear server is on port ${app.get('port')}`);

module.exports.getApp = app;
