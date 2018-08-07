

module.exports = {
  port: process.env.PORT || 1337,
  email: {
    pool: true,
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use TLS
    account: 'userGmailService',
    pwd: 'passwordUserGmailService',
  },
  debugLevel: {
    console: 'debug',
    file: 'info',
  },
  jwt: {
    secret: 'supersecrettoken',
    expiresIn: 60 * 60 * 24,
  },
  redis: {
    url: 'redis://localhost:6379',
  },
  wwwfolder: '/download', // this folder must be created and with the permissions to write in it
};
