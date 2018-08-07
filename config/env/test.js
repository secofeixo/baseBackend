

module.exports = {
  db: 'mongodb://localhost/bigfinite-test',
  email: {
    pool: false,
    secure: false, // use TLS
    host: 'smtp.ethereal.email',
    port: 587,
    account: 'user@ethereal.email',
    pwd: 'password',
  },
  debugLevel: {
    console: 'none',
    file: 'none',
  },
};
