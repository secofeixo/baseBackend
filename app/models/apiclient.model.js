

const mongoose = require('../../config/mongoose'),
  Schema = mongoose.Schema;

const ApiClientSchema = new Schema({
  clientId: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  clientSecret: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
  },
});

ApiClientSchema.set('timestamps', true);
ApiClientSchema.set('collection', 'apiclient');
ApiClientSchema.set('versionKey', false);

module.exports = mongoose.main_conn.model('ApiClient', ApiClientSchema);

module.exports.preMiddleware = (req, res, next) => next();

module.exports.preCreate = (req, res, next) => {
  next();
};

module.exports.postCreate = (req, res, next) => {
  next();
};

module.exports.preUpdate = (req, res, next) => {
  next();
};

module.exports.postUpdate = (req, res, next) => {
  next();
};

module.exports.postRead = (req, res, next) => {
  next();
};
