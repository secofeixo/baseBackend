

const express = require('express'),
  bearerToken = require('express-bearer-token'),
  bodyParser = require('body-parser'),
  compression = require('compression'),
  methodOverride = require('method-override'),
  path = require('path'),
  helmet = require('helmet'),
  config = require('./config'),
  logger = require('../app/controllers/log.controller.js'),
  cors = require('cors'),
  restify = require('express-restify-mongoose');

function avoiDeleteAll(req, res, next) {
  if (req.params.id) {
    next();
  } else {
    res.status(403).send({ msg: 'Not allowed to remove all records' });
  }
}

function configRestify(router, Model) {
  const options = {};
  if (Model.modelRestify) {
    // restify the CRUD function for the mongoose model
    if (Model.access) options.access = Model.access;
    if (Model.preMiddleware) options.preMiddleware = Model.preMiddleware;
    if (Model.preRead) options.preRead = Model.preRead;
    if (Model.preCreate) options.preCreate = Model.preCreate;
    if (Model.preUpdate) options.preUpdate = Model.preUpdate;

    if (Model.preDelete) options.preDelete = Model.preDelete;
    else options.preDelete = avoiDeleteAll;

    if (Model.postRead) options.postRead = Model.postRead;
    if (Model.postCreate) options.postCreate = Model.postCreate;
    if (Model.postUpdate) options.postUpdate = Model.postUpdate;
    if (Model.postDelete) options.postDelete = Model.postDelete;
    if (Model.outputFn) options.outputFn = Model.outputFn;
    options.findOneAndRemove = false;

    restify.serve(router, Model.modelRestify, options);
  }
}

module.exports = () => {
  const app = express();

  app.use(cors({ credentials: true, origin: true }));

  const router = express.Router();

  app.use(helmet({ hsts: false }));

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ limit: '50mb' }));
  // app.use(fileUpload());

  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).send({ msg: 'Malformed JSON' });
    }
    return next();
  });

  app.use(compression());
  app.use(methodOverride());
  app.use(bearerToken());

  app.use(express.static(path.resolve('./public')));

  app.use(require('morgan')('combined', { stream: logger.stream }));

  if (app.get('env') === 'production') {
    app.set('trust proxy', 1); // trust first proxy
  }

  const options = {
    prefix: '',
    version: '',
    lean: false,
    // limit: 30,
  };
  restify.defaults(options);

  // Globbing model files
  config.getGlobbedFiles('./app/models/**/*.js').forEach(modelPath => {
    const Model = require(path.resolve(modelPath));
    configRestify(router, Model);
  });

  require('../app/middlewares/middlewares.js')(app);

    // Globbing routing files
  config.getGlobbedFiles('./app/routes/**/*.js').forEach(routePath => {
    require(path.resolve(routePath))(app);
  });

  app.use(router);

  return app;
};
