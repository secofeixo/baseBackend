
const logger = require('../../app/controllers/log.controller.js'),
  constants = require('../../config/constants.js');

module.exports = app => {
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
      // res.setHeader('Access-Control-Allow-Origin', 'http://dev.goldenspear.com');
    } else if (process.env.NODE_ENV === 'production') {
      res.setHeader('Access-Control-Allow-Origin', 'http://app.goldenspear.com');
    } else {
      // (process.env.NODE_ENV === 'local')
      logger.info('middlewares.js No CORS setting');
    }
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin, Authorization, Origin, x-requested-with, Content-Type, Content-Range, Content-Disposition, Content-Description');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE');
    next();
  });

  app.use((req, res, next) => {
    // inject limit parameter for get queries
    if (req.method === 'GET') {
      if (req.query.limit) {
        if (req.query.limit < 0) {
          delete req.query.limit;
        }
      } else {
        req.query.limit = constants.LIMIT_PER_PAGE;
      }
    }
    next();
  });
};
