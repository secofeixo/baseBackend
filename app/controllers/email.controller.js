const logger = require('./log.controller.js'),
  nodemailer = require('nodemailer'),
  config = require('../../config/config');

// const sendmailCfg = {
//   sendmail: true,
//   newline: 'unix',
//   path: '/usr/sbin/sendmail',
// };

const smtpCfg = {
  pool: config.email.pool,
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // use TLS
  auth: {
    user: config.email.account,
    pass: config.email.pwd,
  },
};

const transporter = nodemailer.createTransport(smtpCfg);

async function sendEmailValidateEmail(user, token, res) {
  const mailOptions = {
    from: 'goldenspear <info@goldenspear.com>',
    to: user.email.addr,
    subject: 'Goldenspear. Email validation',
    text: `Click in the new link to validate your profile: http://localhost:1337/verifyProfile?token=${token}`,
    html: `Click in the new link to validate your profile: http://localhost:1337/verifyProfile?token=${token}`,
  };

  let info;
  try {
    info = await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error(`emailcontroller. sendEmailValidateEmail. Error: ${error}`);
    if (res !== undefined) {
      res.status(500).send({ msg: 'emailcontroller. sendEmailValidateEmail. Error sending the e-mail' });
    }
    return info;
  }

  logger.debug(`emailcontroller. sendEmailValidateEmail. Message sent: ${info.response}`);
  if (res !== undefined) {
    res.status(200).json({
      code: 0,
      msg: 'Message sent',
    });
  }
  return info;
}

async function sendEmailWelcomeUser(user, res) {
  let sText = 'Hi ';
  sText = `Hi ${user.getName()}\n`;
  sText = `${sText}We appreciate you very much that you sign up in the Goldenspear social network\n`;
  sText = `${sText}In this fashion social network you will be able to search millions of products, and to see a lots of looks how to combine them\n`;
  sText = `${sText}Also you will be able to go to the shop of the products that are shown in the looks in order to buy them\n`;
  sText = `${sText}\n`;
  sText = `${sText}Enjoy it\n`;
  sText = `${sText}\n`;

  const mailOptions = {
    from: 'goldenspear <info@goldenspear.com>',
    to: user.email.addr,
    subject: 'Welcome to goldenspear social network',
    text: sText,
  };

  let info;
  try {
    info = await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error(`emailcontroller. sendEmailWelcomeUser. Error: ${error}`);
    if (res !== undefined) {
      res.status(500).send({ msg: 'emailcontroller. sendEmailWelcomeUser. Error sending the e-mail' });
    }
    return info;
  }
  logger.debug(`emailcontroller. sendEmailWelcomeUser. Message sent: ${info.response}`);
  if (res !== undefined) {
    return res.status(200).json({
      code: 0,
      msg: 'Message sent',
    });
  }
  return info;
}

async function sendEmailRetrievePasswordCode(email, code, res) {
  let sText = 'Hi ';
  sText = `Your code to recover the password is: ${code}\n`;

  const mailOptions = {
    from: 'goldenspear <info@goldenspear.com>',
    to: email,
    subject: 'Retrieve password Code',
    text: sText,
    html: sText,
  };

  let info;
  try {
    info = await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error(`emailcontroller. sendEmailRetrievePasswordCode. Error: ${error}`);
    if (res !== undefined) {
      res.status(500).send({ msg: 'emailcontroller. sendEmailRetrievePasswordCode. Error sending the e-mail' });
    }
    return info;
  }

  logger.debug(`emailcontroller. sendEmailRetrievePasswordCode. Message sent: ${info.response}`);
  if (res !== undefined) {
    return res.status(200).json({
      code: process.env.NODE_ENV === 'test' ? code : 0,
      msg: 'Message sent',
    });
  }
  return info;
}

module.exports = {
  sendEmailValidateEmail,
  sendEmailWelcomeUser,
  sendEmailRetrievePasswordCode,
};
