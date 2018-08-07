const mongoose = require('mongoose'),
  User = mongoose.main_conn.model('User'),
  bcrypt = require('bcrypt'),
  utils = require('../controllers/utils.controller'),
  logger = require('./log.controller.js'),
  jwt = require('jsonwebtoken'),
  config = require('../../config/config');


function getByUsername(req, res) {
  User.findOne({ username: req.params.username }, (err, user) => {
    if (err) return res.status(500).send({ msg: 'Internal error' });
    else if (!user) return res.status(404).send({ msg: 'User not found' });
    return res.status(200).send(user.getPublicProfileData());
  });
}

function showPrivateProfile(req, item) {
  let bShowPrivateProfile = false;
  if (req.session && req.session.user) {
    if (req.session.user._id === item._id.toString()) {
      bShowPrivateProfile = true;
    }
  }

  return bShowPrivateProfile;
}

async function freeEmail(id, email) {
  // check if email and username does not exist
  let userEmail;
  try {
    userEmail = await User.findOne({ 'email.addr': email, _id: { $ne: id } },
                             { _id: 1 }).exec();
  } catch (errEmail) {
    return `Internal error ${errEmail}`;
  }

  logger.debug(`user.controller.js. freeEmail. User: ${JSON.stringify(userEmail)}.`);
  return (userEmail === null);
}

async function freeUsername(id, _username) {
  // check if username does not exist
  let userUsername;
  try {
    userUsername = await User.findOne({ username: _username, _id: { $ne: id } },
      { _id: 1 }).exec();
  } catch (errUsername) {
    return `Internal error ${errUsername}`;
  }

  logger.debug(`user.controller.js. freeUsername. User: ${JSON.stringify(userUsername)}.`);
  return (userUsername === null);
}

async function updateProfile(req) {
  if (req.session && req.session.user) {
    if (req.params.id) {
      if (req.session.user._id === req.params.id) {
        logger.info(`user.controller.js. updateProfile. Params: ${JSON.stringify(req.params)}: Body:${JSON.stringify(req.body)}.`);
        if (req.body['email.addr']) {
          const bFreeEmail = await freeEmail(req.session.user._id, req.body['email.addr']);
          if (bFreeEmail === false) {
            return 'Email already in use';
          } else if (bFreeEmail !== true) {
            throw new Error(bFreeEmail);
          }
          // the email has changed so the email is not validated yet
          req.body['email.validated'] = false;
          req.validateEmail = true;
        }

        if (req.body.username) {
          const bFreeUsername = await freeUsername(req.session.user._id, req.body.username);
          if (bFreeUsername === false) {
            return 'Username already in use';
          } else if (bFreeUsername !== true) {
            throw new Error(bFreeUsername);
          }
        }
      }
    }
  }

  return true;
}

async function retrievePasswordGetCode(req, res) {
  const missingFields = utils.missingBodyFields(req, 'email');
  if (missingFields.length > 0) return utils.badQuery(res, missingFields);

  const emailParam = req.body.email;
  const phoneParam = req.body.phone;

  logger.info(`user.controller.js. retrievePasswordGetCode. Email: ${emailParam}. Phone: ${phoneParam}`);
  // get the user from the database, in this way we check that the email exists
  let userRead;
  try {
    userRead = await User.findOne({ 'email.addr': emailParam }).exec();
  } catch (err) {
    logger.error(`user.controller.js. retrievePasswordGetCode. Error: ${err}`);
    res.status(500).send({ msg: `Internal error ${err}` });
    return 1;
  }

  if (!userRead) {
    logger.info(`user.controller.js. retrievePasswordGetCode. User not found: ${emailParam}`);
    res.status(404).send({ msg: `User ${emailParam} not found` });
    return 1;
  }

  // generate new password
  const generator = require('generate-password');

  const codeRetrievePwd = generator.generate({
    length: 8,
    numbers: true,
  });

  logger.info(`user.controller.js. retrievePasswordGetCode. Code: ${codeRetrievePwd} for user: ${userRead._id}`);

  userRead.resetPwd.code = codeRetrievePwd;
  userRead.resetPwd.date = new Date();
  let dataUpdate;
  try {
    dataUpdate = await User.updateOne({ _id: userRead._id },
      { $set: { 'resetPwd.code': userRead.resetPwd.code,
        'resetPwd.date': userRead.resetPwd.date } }).exec();
  } catch (errUpdateUser) {
    res.status(500).send({ msg: `Internal error ${errUpdateUser}` });
    return 1;
  }

  if (!dataUpdate) {
    res.status(404).send({ msg: 'No data updating document with code' });
    return 1;
  }
  if (dataUpdate.nModified === 1) {
    const email = require('../controllers/email.controller');
    email.sendEmailRetrievePasswordCode(userRead.email.addr, codeRetrievePwd, undefined);
    const publicUser = userRead.getPublicProfileData();
    if (process.env.NODE_ENV === 'test') {
      publicUser.code = codeRetrievePwd;
    }

    res.status(200).json(publicUser);
  } else {
    res.status(500).send({ msg: 'Code not saved in the database' });
  }
  return 1;
}

async function retrievePassword(req, res) {
  const missingFields = utils.missingBodyFields(req, 'email', 'password', 'code');
  if (missingFields.length > 0) return utils.badQuery(res, missingFields);

  const emailParam = req.body.email;
  const newPassword = `${req.body.password}`;
  const codeParam = req.body.code;

  let user;
  try {
    user = await User.findOne({ 'email.addr': emailParam }).exec();
  } catch (err) {
    logger.error(`user.controller.js. retrievePassword. Error: ${err}`);
    res.status(500).send({ msg: `Internal error ${err}` });
    return 1;
  }

  if (!user) {
    logger.info(`user.controller.js. retrievePasswordGetCode. User not found: ${emailParam}`);
    res.status(404).send({ msg: `User ${emailParam} not found` });
    return 0;
  }

  const MS_PER_HOUR = 1000 * 60 * 60;
  const dateCodeGeneration = user.resetPwd.date;
  const now = new Date();
  const diffDate = new Date(now - dateCodeGeneration);
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(dateCodeGeneration.getFullYear(),
                        dateCodeGeneration.getMonth(),
                        dateCodeGeneration.getDate(),
                        dateCodeGeneration.getHours(),
                        dateCodeGeneration.getMinutes(),
                        dateCodeGeneration.getSeconds());
  const utc2 = Date.UTC(now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                        now.getHours(),
                        now.getMinutes(),
                        now.getSeconds());

  const diffHours = Math.floor((utc2 - utc1) / MS_PER_HOUR);
  logger.info(`user.controller.js. retrievePassword. DiffHours ${diffHours}`);

  if (diffHours > 1) {
    logger.info(`user.controller.js. retrievePassword. \
      Time elapsed from the query to retrieve password ${diffHours}. \
      Diff: ${diffDate.toString()}. Now: ${now.toString()}. \
      DateCodeGeneration: ${dateCodeGeneration.toString()}`);
    res.status(400).send({ msg: 'Time elapsed. Get a new code for retrieving the password' });
    return 1;
  }

  if (codeParam !== user.resetPwd.code) {
    logger.info(`user.controller.js. retrievePassword. \
      Code different ${codeParam} from user code ${user.resetPwd.code}`);
    res.status(400).send({ msg: 'Code not valid' });
    return 1;
  }

  const cryptedPassword = bcrypt.hashSync(newPassword, 10);
  user.password = cryptedPassword;
  // update the password of the user
  let dataUpdate;
  try {
    dataUpdate = await User.update({ _id: user._id },
        { $set: { password: cryptedPassword } });
  } catch (errUpdateUser) {
    res.status(500).send({ msg: `Internal error ${errUpdateUser}` });
    return 1;
  }

  if (!dataUpdate) {
    res.status(500).send({ msg: 'New password not saved in User collections' });
    return 1;
  }

  const publicUser = user.getPublicProfileData();
  res.status(200).json(publicUser);
  return 0;
}

async function getValidUsername(username) {
  let users;
  try {
    users = await User.find({ username: new RegExp(`^${username}`, 'i') }, { username: true }).exec();
  } catch (err) {
    const sError = `Error reading users for getting username valid: ${err}`;
    logger.error(`user.controller. getValidUsername. ${sError}`);
    throw new Error(sError);
  }

  const iNumMaxUsers = users.length;
  let bValidUsername = false;
  let sFinalUsername = '';
  if (iNumMaxUsers > 0) {
    // there are results that start with username, we must check for a username that does not already exist
    for (let i = 1; i <= (iNumMaxUsers + 5); i += 1) {
      const sNewUsername = `${username}${i}`;
      let iNumDiff = 0;
      users.forEach(user => {
        if (user.username !== sNewUsername) {
          iNumDiff += 1;
        }
      });
      if (iNumDiff === iNumMaxUsers) {
        sFinalUsername = sNewUsername;
        bValidUsername = true;
        break;
      }
    }
  } else {
    // there are NO results that start with username, the username is valid
    bValidUsername = true;
    sFinalUsername = username;
  }

  if (bValidUsername) {
    return sFinalUsername;
  }

  return bValidUsername;
}

async function verifyProfile(req, res) {
  const token = req.query.token;
  if (!token) {
    res.status(400).json({ msg: 'Token not set' });
    return;
  }
  logger.debug(`user.controller.js. verifyProfile. token: ${token}.`);
  let payload;
  try {
    payload = await jwt.verify(token, config.jwt.secret);
  } catch (err) {
    logger.debug(`user.controller.js. verifyProfile. Error jwt: ${JSON.stringify(err)}.`);
    res.status(401).send({ msg: 'token expired or not valid' });
    payload = undefined;
    return;
  }

  logger.debug(`user.controller.js. verifyProfile. payload: ${JSON.stringify(payload)}.`);
  if (payload) {
    const user = payload.user;
    try {
      await User.update({ _id: user }, { $set: { 'email.validated': true } }).exec();
      res.status(200).json({ msg: 'email validated' });
    } catch (errupdatedUser) {
      const sError = `user.controller.js. verifyProfile. Error updating user validating email. ${errupdatedUser}`;
      utils.internalError(sError, res);
    }
  } else {
    const sError = 'user.controller.js. verifyProfile. Payload empty';
    utils.internalError(sError, res);
  }
}

async function sendEmailValidateEmail(req, res) {
  const missingFieldsEmail = utils.missingBodyFields(req, 'email');
  if (missingFieldsEmail.length > 0) {
    return utils.badQuery(res, missingFieldsEmail);
  }
  const queryUser = {};
  queryUser['email.addr'] = req.body.email;
  let user;
  try {
    user = await User.findOne(queryUser).exec();
  } catch (err) {
    return utils.internalError(err, res);
  }

  if (!user) {
    logger.info(`user.controller.js. sendEmailValidateEmail. User NOT found by email ${req.body.email}`);
    return res.status(404).json({ msg: 'User not found' });
  }

  const token = jwt.sign({ user: user._id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  const email = require('./email.controller');
  return email.sendEmailValidateEmail(user, token, res);
}

module.exports = {
  getByUsername,
  showPrivateProfile,
  updateProfile,
  retrievePasswordGetCode,
  retrievePassword,
  getValidUsername,
  verifyProfile,
  sendEmailValidateEmail,
};
