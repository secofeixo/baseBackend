const mongoose = require('../../../config/mongoose'),
  bcrypt = require('bcrypt'),
  logger = require('../../controllers/log.controller.js'),
  _ = require('lodash'),
  utils = require('../../controllers/utils.controller'),
  jwt = require('jsonwebtoken'),
  Schema = mongoose.Schema,
  config = require('../../../config/config'),
  requireLogin = require('../../middlewares/requireLogin');

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    // unique: true,
    trim: true,
    lowercase: true,
  },
  password: String,
  name: {
    first: {
      type: String,
      default: '',
    },
    last: {
      type: String,
      default: '',
    },
  },
  email: {
    addr: {
      type: String,
      lowercase: true,
      // unique: true,
      trim: true,
    },
    validated: {
      type: Boolean,
      default: false,
    },
    codeVal: String,
  },
  resetPwd: {
    code: String,
    date: Date,
  },
  config: {
    newtest: {
      type: Boolean,
      default: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  visible: {
    profile: {
      type: Boolean,
      default: true,
    },
  },
});

UserSchema.set('timestamps', true);
UserSchema.set('collection', 'user');
UserSchema.set('versionKey', false);
UserSchema.index({ 'email.addr': 1 });
UserSchema.index({ username: 1 });

UserSchema.path('email.addr').validate(email => {
  const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
  return emailRegex.test(email); // Assuming email has a text attribute
}, 'The e-mail field cannot be empty.');

UserSchema.methods.getPublicProfileData = function getPublicProfileData() {
  const publicProfile = {};
  publicProfile._id = this._id;

  if (this.visible.profile) {
    publicProfile.username = this.username;
    publicProfile.name = this.name;
    publicProfile.email = {};
    publicProfile.email.addr = this.email.addr;
  }

  return publicProfile;
};

UserSchema.methods.getName = function getName() {
  if (this.name.first) {
    let sName = this.name.first.trim();
    if (sName !== '') {
      if (this.name.last) {
        if (this.name.last.trim() !== '') {
          sName = `${sName} ${this.name.last.trim()}`;
        }
      }
      return sName;
    }
  }

  return this.username;
};

module.exports.modelRestify = mongoose.main_conn.model('User', UserSchema);
module.exports.preMiddleware = requireLogin.policyUser;

module.exports.preCreate = (req, res, next) => {
  const missingFields = utils.missingBodyFields(req, 'username', 'email.addr', 'password');
  logger.info(`user.model.js. preCreate. ${JSON.stringify(req.body, null, 2)}`);

  if (missingFields.length > 0) return utils.badQuery(res, missingFields);
  const query = module.exports.modelRestify.findOne({ $or: [{ username: req.body.username }, { 'email.addr': req.body['email.addr'] }] }).exec();
  return query.then(user => {
    if (user) throw new Error('registered');

    const cryptedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = cryptedPassword;
    req.body['email.validated'] = false;
    next();
  }).catch(err => {
    if (err.message === 'registered') return res.status(403).send({ msg: 'User already registered' });
    return utils.internalError(err, res);
  });
};

module.exports.postCreate = (req, res, next) => {
  const result = req.erm.result;
  next();

  const email = require('../../controllers/email.controller');
  email.sendEmailWelcomeUser(result, undefined);
  const token = jwt.sign({ user: result._id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  email.sendEmailValidateEmail(result, token, undefined);
};

module.exports.preUpdate = async (req, res, next) => {
  const ctrlUser = require('../../controllers/user.controller');
  let bUpdate;
  try {
    bUpdate = await ctrlUser.updateProfile(req);
  } catch (err) {
    res.status(500).send({ msg: err });
    return;
  }

  if (bUpdate !== true) {
    res.status(400).send({ msg: bUpdate });
    return;
  }

  if (req.body.password) {
    const cryptedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = cryptedPassword;
  }
  next();
};

module.exports.postUpdate = (req, res, next) => {
  const ctrlUser = require('../../controllers/user.controller');
  const result = req.erm.result;
  if (req.validateEmail) {
    const token = jwt.sign({ user: result._id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    const email = require('../../controllers/email.controller');
    email.sendEmailValidateEmail(result, token, undefined);
  }
  if (result) {
    const bPrivateProfile = ctrlUser.showPrivateProfile(req, result);
    if (!bPrivateProfile) {
      req.erm.result = result.getPublicProfileData();
    }
  }
  // req.erm.result = result.getPublicProfileData();
  next();
};

module.exports.postRead = (req, res, next) => {
  const ctrlUser = require('../../controllers/user.controller');
  const result = req.erm.result;
  if (result) {
    if (_.isArray(result)) {
      const newResult = [];
      result.forEach(resultItem => {
        const bPrivateProfile = ctrlUser.showPrivateProfile(req, resultItem);
        if (!bPrivateProfile) {
          newResult.push(resultItem.getPublicProfileData());
        } else {
          newResult.push(resultItem);
        }
      });
      req.erm.result = newResult;
    } else if (_.isObjectLike(result)) {
      if (result instanceof module.exports.modelRestify) {
        const bPrivateProfile = ctrlUser.showPrivateProfile(req, result);
        if (!bPrivateProfile) {
          req.erm.result = result.getPublicProfileData();
        }
      } else {
        logger.debug('user.model. postRead. No getPublicProfileData');
      }
    }
    // req.erm.result = result.getPublicProfileData();
  }
  // req.erm.result = result.getPublicProfileData();
  next();
};
